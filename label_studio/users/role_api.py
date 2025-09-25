"""
API views for Role Management
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db.models import Q
import logging

from .role_models import Role, UserRoleAssignment
from .role_serializers import RoleSerializer, UserRoleAssignmentSerializer

logger = logging.getLogger(__name__)
User = get_user_model()


class RoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing roles
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter roles based on user permissions"""
        queryset = super().get_queryset()
        
        # Non-staff users can only see active roles
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def users(self, request, pk=None):
        """Get users assigned to a specific role"""
        role = self.get_object()
        assignments = UserRoleAssignment.objects.filter(role=role, is_active=True)
        serializer = UserRoleAssignmentSerializer(assignments, many=True)
        
        return Response({
            'role': RoleSerializer(role).data,
            'assignments': serializer.data
        })


class UserRoleAssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user role assignments
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