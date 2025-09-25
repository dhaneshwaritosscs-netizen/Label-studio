"""
API views for Project Settings Access Management
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .project_settings_access import ProjectSettingsAccess, SettingsAccessLog, SettingsAccessTemplate
from .project_settings_access_serializers import (
    ProjectSettingsAccessSerializer,
    SettingsAccessLogSerializer,
    SettingsAccessTemplateSerializer
)

User = get_user_model()


class ProjectSettingsAccessViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing project settings access.
    """
    queryset = ProjectSettingsAccess.objects.select_related('user', 'project', 'granted_by').all()
    serializer_class = ProjectSettingsAccessSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter settings access based on user permissions."""
        queryset = super().get_queryset()
        
        # Non-staff users can only see their own settings access
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Grant project settings access to a user."""
        # Set granted_by to current user
        request.data['granted_by'] = request.user.id
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Log the access grant
        SettingsAccessLog.objects.create(
            user=request.user,
            project=serializer.instance.project,
            field_name='all',
            action='permission_granted',
            details={
                'target_user': serializer.instance.user.username,
                'project': serializer.instance.project.title,
                'access_levels': serializer.instance.get_all_access_levels()
            },
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Update project settings access."""
        instance = self.get_object()
        old_access_levels = instance.get_all_access_levels()
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Log the change
        new_access_levels = instance.get_all_access_levels()
        SettingsAccessLog.objects.create(
            user=request.user,
            project=instance.project,
            field_name='all',
            action='permission_granted',
            details={
                'target_user': instance.user.username,
                'project': instance.project.title,
                'old_access_levels': old_access_levels,
                'new_access_levels': new_access_levels
            },
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_project_access(self, request):
        """Get current user's project settings access."""
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response(
                {'error': 'project_id parameter required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            settings_access = ProjectSettingsAccess.objects.get(
                user=request.user, 
                project_id=project_id,
                is_active=True
            )
            serializer = self.get_serializer(settings_access)
            return Response(serializer.data)
        except ProjectSettingsAccess.DoesNotExist:
            return Response(
                {'error': 'No settings access found for this project'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def check_field_access(self, request):
        """Check if current user has access to a specific settings field."""
        project_id = request.query_params.get('project_id')
        field_name = request.query_params.get('field_name')
        required_level = request.query_params.get('required_level', 'read')
        
        if not project_id or not field_name:
            return Response(
                {'error': 'project_id and field_name parameters required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            settings_access = ProjectSettingsAccess.objects.get(
                user=request.user, 
                project_id=project_id,
                is_active=True
            )
            
            has_access = settings_access.has_field_access(field_name, required_level)
            current_access = settings_access.get_field_access(field_name)
            
            return Response({
                'field_name': field_name,
                'required_level': required_level,
                'current_access': current_access,
                'has_access': has_access,
                'project': settings_access.project.title
            })
        except ProjectSettingsAccess.DoesNotExist:
            return Response(
                {'error': 'No settings access found for this project'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def revoke_access(self, request, pk=None):
        """Revoke project settings access."""
        settings_access = self.get_object()
        settings_access.is_active = False
        settings_access.save()
        
        # Log the revocation
        SettingsAccessLog.objects.create(
            user=request.user,
            project=settings_access.project,
            field_name='all',
            action='permission_revoked',
            details={
                'target_user': settings_access.user.username,
                'project': settings_access.project.title,
                'access_levels': settings_access.get_all_access_levels()
            },
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({'message': 'Project settings access revoked successfully'})
    
    @action(detail=False, methods=['post'])
    def apply_template(self, request):
        """Apply a settings access template to a user-project combination."""
        template_id = request.data.get('template_id')
        user_id = request.data.get('user_id')
        project_id = request.data.get('project_id')
        
        if not all([template_id, user_id, project_id]):
            return Response(
                {'error': 'template_id, user_id, and project_id are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            template = SettingsAccessTemplate.objects.get(id=template_id, is_active=True)
            user = User.objects.get(id=user_id)
            project = template._meta.get_field('project').related_model.objects.get(id=project_id)
            
            access = template.apply_to_user_project(user, project, request.user)
            
            # Log the template application
            SettingsAccessLog.objects.create(
                user=request.user,
                project=project,
                field_name='all',
                action='permission_granted',
                details={
                    'target_user': user.username,
                    'project': project.title,
                    'template': template.name,
                    'access_levels': access.get_all_access_levels()
                },
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            serializer = self.get_serializer(access)
            return Response(serializer.data)
            
        except (SettingsAccessTemplate.DoesNotExist, User.DoesNotExist):
            return Response(
                {'error': 'Template or user not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SettingsAccessLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing settings access logs (read-only).
    """
    queryset = SettingsAccessLog.objects.select_related('user', 'project').all()
    serializer_class = SettingsAccessLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter logs based on user permissions."""
        queryset = super().get_queryset()
        
        # Non-staff users can only see their own logs
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def project_logs(self, request):
        """Get access logs for a specific project."""
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response(
                {'error': 'project_id parameter required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logs = self.get_queryset().filter(project_id=project_id)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)


class SettingsAccessTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing settings access templates.
    """
    queryset = SettingsAccessTemplate.objects.all()
    serializer_class = SettingsAccessTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter templates based on user permissions."""
        queryset = super().get_queryset()
        
        # Non-staff users can only see active templates
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a new settings access template."""
        # Set created_by to current user
        request.data['created_by'] = request.user.id
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=True, methods=['post'])
    def apply_to_user_project(self, request, pk=None):
        """Apply this template to a user-project combination."""
        template = self.get_object()
        user_id = request.data.get('user_id')
        project_id = request.data.get('project_id')
        
        if not all([user_id, project_id]):
            return Response(
                {'error': 'user_id and project_id are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
            project = template._meta.get_field('project').related_model.objects.get(id=project_id)
            
            access = template.apply_to_user_project(user, project, request.user)
            
            serializer = ProjectSettingsAccessSerializer(access)
            return Response(serializer.data)
            
        except (User.DoesNotExist, Exception) as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )








