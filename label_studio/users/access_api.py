"""
API views for User Access Management
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db.models import Q
import logging

from .role_models import Role, UserRoleAssignment, RolePermission
from .role_serializers import UserRoleAssignmentSerializer

logger = logging.getLogger(__name__)
User = get_user_model()


class UserRoleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for reading user roles
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


class UserAccessViewSet(viewsets.ViewSet):
    """
    ViewSet for user access management
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_access(self, request):
        """Get current user's access permissions"""
        user = request.user
        assignments = UserRoleAssignment.objects.filter(user=user, is_active=True)
        
        roles = []
        permissions = []
        
        for assignment in assignments:
            role_data = {
                'id': assignment.role.id,
                'name': assignment.role.name,
                'display_name': assignment.role.display_name,
                'description': assignment.role.description,
                'assigned_at': assignment.assigned_at,
            }
            roles.append(role_data)
            
            # Get role permissions
            role_permissions = RolePermission.objects.filter(role=assignment.role, is_granted=True)
            for perm in role_permissions:
                permissions.append({
                    'permission_name': perm.permission_name,
                    'permission_type': perm.permission_type,
                    'resource': perm.resource,
                })
        
        return Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
            },
            'roles': roles,
            'permissions': permissions
        })
    
    @action(detail=False, methods=['get'])
    def check_permission(self, request):
        """Check if user has specific permission"""
        permission_name = request.query_params.get('permission')
        resource = request.query_params.get('resource', '')
        
        if not permission_name:
            return Response(
                {'error': 'Permission parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        user_roles = UserRoleAssignment.objects.filter(user=user, is_active=True).values_list('role', flat=True)
        
        has_permission = RolePermission.objects.filter(
            role__in=user_roles,
            permission_name=permission_name,
            resource=resource,
            is_granted=True
        ).exists()
        
        return Response({
            'permission': permission_name,
            'resource': resource,
            'has_permission': has_permission
        })