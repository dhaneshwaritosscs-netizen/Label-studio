"""
API views for Role Assignment functionality
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from core.permissions import ViewClassPermission, all_permissions
import logging

from .models import User
from .role_models import Role, UserRoleAssignment
from .role_serializers import (
    RoleAssignmentRequestSerializer,
    RoleAssignmentResponseSerializer,
    UserRoleAssignmentSerializer
)

logger = logging.getLogger(__name__)
User = get_user_model()


class RoleAssignmentAPIView(APIView):
    """
    API view for assigning roles to users by email
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def _is_admin(self, user):
        """Check if user is admin"""
        # Check for specific admin email
        if user.email == 'dhaneshwari.tosscss@gmail.com':
            return True
        if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):
            return True
        try:
            return UserRoleAssignment.objects.filter(user=user, role__name__iexact='administrator', is_active=True).exists()
        except Exception:
            return False

    def post(self, request):
        """
        Assign roles to a user by email address
        """
        serializer = RoleAssignmentRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    'success': False,
                    'error': 'Invalid request data',
                    'details': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        email = serializer.validated_data['email']
        selected_roles = serializer.validated_data['selected_roles']
        
        # Check if user is admin
        is_admin = self._is_admin(request.user)
        
        try:
            # Check if user exists
            try:
                user = User.objects.get(email=email)
                user_exists = True
                
                # For non-admin users, check if they can assign roles to this user
                if not is_admin:
                    # Client can only assign roles to users they created
                    logger.info(f"Debug - User {user.email} created_by: {user.created_by}, Request user: {request.user}, Comparison: {user.created_by == request.user}")
                    
                    # Handle case where created_by is None or doesn't match
                    if user.created_by is None or user.created_by.id != request.user.id:
                        # Additional check: if both users are in the same organization, allow assignment
                        try:
                            if (hasattr(request.user, 'active_organization') and 
                                hasattr(user, 'active_organization') and 
                                request.user.active_organization is not None and
                                user.active_organization is not None and
                                request.user.active_organization.id == user.active_organization.id):
                                logger.info(f"Allowing role assignment: Both users in same organization {request.user.active_organization.id}")
                            else:
                                logger.warning(f"Permission denied: User {user.email} created_by ({user.created_by}) != request.user ({request.user})")
                                return Response(
                                    {
                                        'success': False,
                                        'error': 'You can only assign roles to users you created. Please use the "Add User" button in Manage Users to create users first.'
                                    },
                                    status=status.HTTP_403_FORBIDDEN
                                )
                        except Exception as org_error:
                            logger.error(f"Error checking organization: {org_error}")
                            return Response(
                                {
                                    'success': False,
                                    'error': 'You can only assign roles to users you created. Please use the "Add User" button in Manage Users to create users first.'
                                },
                                status=status.HTTP_403_FORBIDDEN
                            )
                        
            except User.DoesNotExist:
                user_exists = False
                # For non-admin users, don't allow creating new users
                if not is_admin:
                    return Response(
                        {
                            'success': False,
                            'error': 'User not found. You can only assign roles to users you created. Please use the "Add User" button in Manage Users to create users first.'
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Admin can create new user if they don't exist
                user = User.objects.create_user(
                    email=email,
                    password=None,  # Will be set when user first logs in
                    username=email.split('@')[0],
                    created_by=request.user  # Set created_by to the admin who created the user
                )
                logger.info(f"Created new user for email: {email}")
            
            # Get or create roles
            assigned_roles = []
            for role_name in selected_roles:
                try:
                    role = Role.objects.get(name=role_name)
                except Role.DoesNotExist:
                    # Create role if it doesn't exist
                    role = Role.objects.create(
                        name=role_name,
                        display_name=role_name.replace('-', ' ').title(),
                        description=f"Role for {role_name}",
                        is_active=True,
                        created_by=request.user if request.user.is_authenticated else None
                    )
                    logger.info(f"Created new role: {role_name}")
                
                # Assign role to user - handle both new and existing assignments
                assignment, created = UserRoleAssignment.objects.get_or_create(
                    user=user,
                    role=role,
                    defaults={
                        'assigned_by': request.user if request.user.is_authenticated else None,
                        'assigned_at': timezone.now(),
                        'is_active': True
                    }
                )
                
                if created:
                    assigned_roles.append(role)
                    logger.info(f"Assigned role {role.name} to user {email}")
                else:
                    # Assignment already exists, check if it's inactive and reactivate if needed
                    if not assignment.is_active:
                        assignment.is_active = True
                        assignment.assigned_by = request.user if request.user.is_authenticated else None
                        assignment.assigned_at = timezone.now()
                        assignment.revoked_at = None
                        assignment.revoked_by = None
                        assignment.save()
                        assigned_roles.append(role)
                        logger.info(f"Reactivated role {role.name} for user {email}")
                    else:
                        logger.info(f"Role {role.name} already assigned to user {email}")
            
            # Send notification email
            self._send_assignment_notification(user, assigned_roles, user_exists)
            
            response_data = {
                'success': True,
                'message': f"Successfully assigned {len(assigned_roles)} role(s) to {email}",
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'user_exists': user_exists
                },
                'assigned_roles': [
                    {
                        'id': role.id,
                        'name': role.name,
                        'display_name': role.display_name
                    }
                    for role in assigned_roles
                ]
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error assigning roles to {email}: {str(e)}")
            return Response(
                {
                    'success': False,
                    'error': 'Failed to assign roles',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _send_assignment_notification(self, user, assigned_roles, user_exists):
        """
        Send email notification about role assignment
        """
        try:
            if not user_exists:
                subject = "Welcome to Label Studio - Your Account Has Been Created"
                message = f"""
Hello {user.username},

Your account has been created in Label Studio and the following roles have been assigned to you:

{chr(10).join([f"- {role.display_name}: {role.description}" for role in assigned_roles])}

You can now log in to Label Studio using your email address: {user.email}

Best regards,
Label Studio Team
                """
            else:
                subject = "Label Studio - New Roles Assigned"
                message = f"""
Hello {user.username},

The following new roles have been assigned to your Label Studio account:

{chr(10).join([f"- {role.display_name}: {role.description}" for role in assigned_roles])}

You can access these features by logging into Label Studio.

Best regards,
Label Studio Team
                """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            logger.info(f"Sent role assignment notification to {user.email}")
            
        except Exception as e:
            logger.error(f"Failed to send notification email to {user.email}: {str(e)}")


class RoleAssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing role assignments
    """
    queryset = UserRoleAssignment.objects.all()
    serializer_class = UserRoleAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter assignments based on user permissions"""
        queryset = super().get_queryset()
        
        # Non-staff users can only see their own assignments
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def by_email(self, request):
        """Get role assignments for a user by email"""
        email = request.query_params.get('email')
        if not email:
            return Response(
                {'error': 'Email parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            assignments = UserRoleAssignment.objects.filter(user=user, is_active=True)
            serializer = self.get_serializer(assignments, many=True)
            
            return Response({
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username
                },
                'assignments': serializer.data
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """Revoke a role assignment"""
        assignment = self.get_object()
        assignment.is_active = False
        assignment.revoked_at = timezone.now()
        assignment.revoked_by = request.user
        assignment.save()
        
        return Response({
            'message': f'Role {assignment.role.display_name} revoked from {assignment.user.email}'
        })
    
    @action(detail=False, methods=['get'])
    def available_roles(self, request):
        """Get list of available roles for assignment"""
        roles = Role.objects.filter(is_active=True)
        role_data = [
            {
                'id': role.id,
                'name': role.name,
                'display_name': role.display_name,
                'description': role.description
            }
            for role in roles
        ]
        
        return Response(role_data)
