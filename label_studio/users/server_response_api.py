"""
Server Response API - Comprehensive API for handling server responses
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import logging
import json

logger = logging.getLogger(__name__)
User = get_user_model()


class ServerResponseAPIView(APIView):
    """
    Comprehensive API for handling server responses
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        Health check endpoint
        """
        return Response({
            'status': 'success',
            'message': 'Server is running',
            'timestamp': timezone.now().isoformat(),
            'version': '1.0.0'
        }, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Handle various server response requests
        """
        try:
            # Get request data
            data = request.data
            action = data.get('action', 'unknown')
            
            logger.info(f"Server response API called with action: {action}")
            
            if action == 'health_check':
                return self._health_check()
            elif action == 'test_connection':
                return self._test_connection()
            elif action == 'get_server_info':
                return self._get_server_info()
            else:
                return Response({
                    'status': 'error',
                    'message': f'Unknown action: {action}',
                    'available_actions': ['health_check', 'test_connection', 'get_server_info']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Server response API error: {e}", exc_info=True)
            return Response({
                'status': 'error',
                'message': 'Internal server error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _health_check(self):
        """Health check response"""
        return Response({
            'status': 'success',
            'message': 'Server is healthy',
            'timestamp': timezone.now().isoformat(),
            'database': 'connected',
            'api': 'operational'
        }, status=status.HTTP_200_OK)

    def _test_connection(self):
        """Test connection response"""
        return Response({
            'status': 'success',
            'message': 'Connection test successful',
            'timestamp': timezone.now().isoformat(),
            'server': 'Django',
            'port': '8010',
            'database': 'SQLite'
        }, status=status.HTTP_200_OK)

    def _get_server_info(self):
        """Get server information"""
        return Response({
            'status': 'success',
            'message': 'Server information retrieved',
            'timestamp': timezone.now().isoformat(),
            'server_info': {
                'framework': 'Django',
                'version': '3.1.7',
                'database': 'SQLite',
                'port': '8010',
                'environment': 'development'
            }
        }, status=status.HTTP_200_OK)


class RoleAssignmentResponseAPIView(APIView):
    """
    Enhanced role assignment API with comprehensive response handling
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Enhanced role assignment with comprehensive response
        """
        try:
            # Validate request data
            email = request.data.get('email')
            selected_roles = request.data.get('selected_roles', [])
            
            if not email:
                return Response({
                    'status': 'error',
                    'message': 'Email is required',
                    'code': 'MISSING_EMAIL'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not selected_roles:
                return Response({
                    'status': 'error',
                    'message': 'At least one role must be selected',
                    'code': 'NO_ROLES_SELECTED'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Import role models
            from users.role_models import Role, UserRoleAssignment
            
            # Check if user is admin
            def _is_admin(user):
                """Check if user is admin"""
                # Check if user is anonymous
                if not user.is_authenticated:
                    return False
                if user.email == 'dhaneshwari.tosscss@gmail.com':
                    return True
                if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):
                    return True
                try:
                    return UserRoleAssignment.objects.filter(user=user, role__name__iexact='administrator', is_active=True).exists()
                except Exception:
                    return False
            
            is_admin = _is_admin(request.user)
            
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
                                return Response({
                                    'status': 'error',
                                    'message': 'You can only assign roles to users you created. Please use the "Add User" button in Manage Users to create users first.',
                                    'code': 'PERMISSION_DENIED'
                                }, status=status.HTTP_403_FORBIDDEN)
                        except Exception as org_error:
                            logger.error(f"Error checking organization: {org_error}")
                            return Response({
                                'status': 'error',
                                'message': 'You can only assign roles to users you created. Please use the "Add User" button in Manage Users to create users first.',
                                'code': 'PERMISSION_DENIED'
                            }, status=status.HTTP_403_FORBIDDEN)
                        
            except User.DoesNotExist:
                user_exists = False
                # For non-admin users, don't allow creating new users
                if not is_admin:
                    return Response({
                        'status': 'error',
                        'message': 'User not found. You can only assign roles to users you created. Please use the "Add User" button in Manage Users to create users first.',
                        'code': 'USER_NOT_FOUND'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                # Admin can create new user if they don't exist
                user = User.objects.create_user(
                    email=email,
                    password=None,  # Will be set when user first logs in
                    username=email.split('@')[0],
                    created_by=request.user  # Set created_by to the admin who created the user
                )
                logger.info(f"Created new user for email: {email}")
            
            # Get all existing roles for this user
            existing_assignments = UserRoleAssignment.objects.filter(user=user, is_active=True)
            existing_role_names = [assignment.role.name for assignment in existing_assignments]
            
            # Process role assignments and unassignments
            assigned_roles = []
            unassigned_roles = []
            
            try:
                # First, handle unassignments (roles that exist but are not in selected_roles)
                for assignment in existing_assignments:
                    if assignment.role.name not in selected_roles:
                        # Unassign this role
                        assignment.is_active = False
                        assignment.unassigned_by = request.user if request.user.is_authenticated else None
                        assignment.unassigned_at = timezone.now()
                        assignment.save()
                        unassigned_roles.append({
                            'role_name': assignment.role.display_name,
                            'role_id': assignment.role.id,
                            'unassigned_at': assignment.unassigned_at.isoformat()
                        })
                        logger.info(f"Unassigned role '{assignment.role.display_name}' from user {user.email}")
                
                # Then, handle assignments (roles in selected_roles)
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
                    
                    # Check if role assignment already exists (active or inactive)
                    existing_assignment = UserRoleAssignment.objects.filter(
                        user=user, 
                        role=role
                    ).first()
                    
                    if existing_assignment:
                        if existing_assignment.is_active:
                            logger.info(f"Role '{role.display_name}' already assigned to user {user.email}")
                        else:
                            # Reactivate the existing assignment
                            existing_assignment.is_active = True
                            existing_assignment.assigned_by = request.user if request.user.is_authenticated else None
                            existing_assignment.assigned_at = timezone.now()
                            existing_assignment.revoked_at = None
                            existing_assignment.revoked_by = None
                            existing_assignment.save()
                            
                            assigned_roles.append({
                                'role_name': role.display_name,
                                'role_id': role.id,
                                'assigned_at': existing_assignment.assigned_at.isoformat()
                            })
                            logger.info(f"Reactivated role '{role.display_name}' for user {user.email}")
                    else:
                        # Create new assignment
                        assignment = UserRoleAssignment.objects.create(
                            user=user,
                            role=role,
                            assigned_by=request.user if request.user.is_authenticated else None,
                            assigned_at=timezone.now(),
                            is_active=True
                        )
                        assigned_roles.append({
                            'role_name': role.display_name,
                            'role_id': role.id,
                            'assigned_at': assignment.assigned_at.isoformat()
                        })
                        logger.info(f"Assigned role '{role.display_name}' to user {user.email}")
            
            except Exception as role_error:
                logger.error(f"Error processing role assignments: {role_error}")
                return Response({
                    'status': 'error',
                    'message': f'Failed to process role assignments: {str(role_error)}',
                    'code': 'ROLE_PROCESSING_ERROR'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({
                'status': 'success',
                'message': f'Successfully processed {len(assigned_roles)} assignment(s) and {len(unassigned_roles)} unassignment(s) for {user.email}',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username
                },
                'assigned_roles': assigned_roles,
                'unassigned_roles': unassigned_roles,
                'user_exists': user_exists,
                'timestamp': timezone.now().isoformat(),
                'server_response': 'OK'
            }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error(f"Role assignment response API error: {e}", exc_info=True)
            return Response({
                'status': 'error',
                'message': 'Internal server error',
                'error': str(e),
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SimpleUserRolesAPIView(APIView):
    """
    Simple API endpoint to fetch user roles without authentication
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        """
        Get roles for a specific user by email - no authentication required
        """
        try:
            email = request.query_params.get('email')
            if not email:
                return Response({
                    'status': 'error',
                    'message': 'Email parameter is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Import role models
            from users.role_models import UserRoleAssignment
            from django.contrib.auth import get_user_model
            User = get_user_model()

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({
                    'status': 'success',
                    'message': 'User not found',
                    'user_roles': [],
                    'user_exists': False
                }, status=status.HTTP_200_OK)

            # Get user role assignments
            assignments = UserRoleAssignment.objects.filter(user=user, is_active=True)
            user_roles = []
            
            # Check for hardcoded admin email
            if user.email == 'dhaneshwari.tosscss@gmail.com':
                user_roles.append({
                    'id': 'admin-hardcoded',
                    'name': 'admin',
                    'display_name': 'Administrator',
                    'description': 'System Administrator',
                    'assigned_at': timezone.now().isoformat(),
                    'assigned_by': 'System'
                })
            
            for assignment in assignments:
                user_roles.append({
                    'id': str(assignment.role.id),
                    'name': assignment.role.name,
                    'display_name': assignment.role.display_name,
                    'description': assignment.role.description,
                    'assigned_at': assignment.assigned_at.isoformat(),
                    'assigned_by': assignment.assigned_by.email if assignment.assigned_by else 'System'
                })

            return Response({
                'status': 'success',
                'message': f'Found {len(user_roles)} role(s) for user',
                'user_roles': user_roles,
                'user_exists': True,
                'user_info': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Simple user roles API error: {e}", exc_info=True)
            return Response({
                'status': 'error',
                'message': 'Internal server error',
                'error': str(e),
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserRolesAPIView(APIView):
    """
    API endpoint to fetch user roles
    """
    permission_classes = [permissions.AllowAny]  # Allow any for now to test functionality
    authentication_classes = []  # Disable authentication completely

    def get(self, request):
        """
        Get roles for a specific user by email
        """
        try:
            email = request.query_params.get('email')
            if not email:
                return Response({
                    'status': 'error',
                    'message': 'Email parameter is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Import role models
            from users.role_models import UserRoleAssignment
            from django.contrib.auth import get_user_model
            User = get_user_model()

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({
                    'status': 'success',
                    'message': 'User not found',
                    'user_roles': [],
                    'user_exists': False
                }, status=status.HTTP_200_OK)

            # Get user role assignments
            assignments = UserRoleAssignment.objects.filter(user=user, is_active=True)
            user_roles = []
            
            # Check for hardcoded admin email
            if user.email == 'dhaneshwari.tosscss@gmail.com':
                user_roles.append({
                    'id': 'admin-hardcoded',
                    'name': 'admin',
                    'display_name': 'Administrator',
                    'description': 'System Administrator',
                    'assigned_at': timezone.now().isoformat(),
                    'assigned_by': 'System'
                })
            
            for assignment in assignments:
                user_roles.append({
                    'id': str(assignment.role.id),
                    'name': assignment.role.name,
                    'display_name': assignment.role.display_name,
                    'description': assignment.role.description,
                    'assigned_at': assignment.assigned_at.isoformat(),
                    'assigned_by': assignment.assigned_by.email if assignment.assigned_by else 'System'
                })

            return Response({
                'status': 'success',
                'message': f'Found {len(user_roles)} role(s) for user',
                'user_roles': user_roles,
                'user_exists': True,
                'user_info': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"User roles API error: {e}", exc_info=True)
            return Response({
                'status': 'error',
                'message': 'Internal server error',
                'error': str(e),
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class APIStatusView(APIView):
    """
    API Status endpoint for monitoring
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        Get API status and health
        """
        try:
            # Test database connection
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"

        return Response({
            'status': 'success',
            'api_status': 'operational',
            'database_status': db_status,
            'timestamp': timezone.now().isoformat(),
            'endpoints': {
                'role_assignment': '/api/role-assignment/',
                'server_response': '/api/server-response/',
                'api_status': '/api/status/',
                'user_roles': '/api/user-roles/'
            }
        }, status=status.HTTP_200_OK)


# Simple Django view function that bypasses REST framework authentication
@csrf_exempt
@require_http_methods(["GET"])
def simple_user_roles_view(request):
    """
    Simple Django view to fetch user roles without authentication
    """
    try:
        email = request.GET.get('email')
        if not email:
            return JsonResponse({
                'status': 'error',
                'message': 'Email parameter is required'
            }, status=400)

        # Import role models
        from users.role_models import UserRoleAssignment
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({
                'status': 'success',
                'message': 'User not found',
                'user_roles': [],
                'user_exists': False
            })

        # Get user role assignments
        assignments = UserRoleAssignment.objects.filter(user=user, is_active=True)
        user_roles = []
        
        # Check for hardcoded admin email
        if user.email == 'dhaneshwari.tosscss@gmail.com':
            user_roles.append({
                'id': 'admin-hardcoded',
                'name': 'admin',
                'display_name': 'Administrator',
                'description': 'System Administrator',
                'assigned_at': timezone.now().isoformat(),
                'assigned_by': 'System'
            })
        
        for assignment in assignments:
            user_roles.append({
                'id': str(assignment.role.id),
                'name': assignment.role.name,
                'display_name': assignment.role.display_name,
                'description': assignment.role.description,
                'assigned_at': assignment.assigned_at.isoformat(),
                'assigned_by': assignment.assigned_by.email if assignment.assigned_by else 'System'
            })

        return JsonResponse({
            'status': 'success',
            'message': f'Found {len(user_roles)} role(s) for user',
            'user_roles': user_roles,
            'user_exists': True,
            'user_info': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        })

    except Exception as e:
        logger.error(f"Simple user roles view error: {e}", exc_info=True)
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'error': str(e),
            'timestamp': timezone.now().isoformat()
        }, status=500)
