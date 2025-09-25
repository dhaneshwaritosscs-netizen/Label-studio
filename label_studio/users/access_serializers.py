"""
Serializers for User Access Management API
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .access_models import UserRole, UserAccess, AccessLog, ProjectAccess

User = get_user_model()


class UserRoleSerializer(serializers.ModelSerializer):
    """Serializer for UserRole model."""
    
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = UserRole
        fields = [
            'id', 'name', 'display_name', 'description', 
            'permissions', 'is_active', 'user_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_user_count(self, obj):
        """Get the number of users with this role."""
        return obj.users.count()


class UserAccessSerializer(serializers.ModelSerializer):
    """Serializer for UserAccess model."""
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    role_name = serializers.CharField(source='role.display_name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    access_valid = serializers.SerializerMethodField()
    effective_permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = UserAccess
        fields = [
            'id', 'user', 'user_username', 'user_email', 'user_first_name', 'user_last_name',
            'role', 'role_name', 'status', 'permissions', 'access_token',
            'last_access', 'access_expires_at', 'created_by', 'created_by_username',
            'access_valid', 'effective_permissions', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'access_token', 'last_access', 'created_by', 
            'created_at', 'updated_at'
        ]
    
    def get_access_valid(self, obj):
        """Check if the user's access is currently valid."""
        return obj.is_access_valid()
    
    def get_effective_permissions(self, obj):
        """Get all effective permissions for this user."""
        return obj.get_effective_permissions()


class AccessLogSerializer(serializers.ModelSerializer):
    """Serializer for AccessLog model."""
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AccessLog
        fields = [
            'id', 'user', 'user_username', 'user_email', 'action', 'action_display',
            'details', 'ip_address', 'user_agent', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class ProjectAccessSerializer(serializers.ModelSerializer):
    """Serializer for ProjectAccess model."""
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    granted_by_username = serializers.CharField(source='granted_by.username', read_only=True)
    access_level_display = serializers.CharField(source='get_access_level_display', read_only=True)
    access_valid = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectAccess
        fields = [
            'id', 'user', 'user_username', 'user_email', 'project', 'project_title',
            'access_level', 'access_level_display', 'granted_by', 'granted_by_username',
            'granted_at', 'expires_at', 'is_active', 'access_valid'
        ]
        read_only_fields = ['id', 'granted_by', 'granted_at']
    
    def get_access_valid(self, obj):
        """Check if the project access is currently valid."""
        return obj.is_valid()


class UserAccessSummarySerializer(serializers.Serializer):
    """Summary serializer for user access information."""
    
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField(allow_null=True)
    status = serializers.CharField()
    access_valid = serializers.BooleanField()
    last_access = serializers.DateTimeField(allow_null=True)
    project_count = serializers.IntegerField()
    
    def to_representation(self, instance):
        """Custom representation for user access summary."""
        user_access = getattr(instance, 'access_profile', None)
        
        return {
            'user_id': instance.id,
            'username': instance.username,
            'email': instance.email,
            'role': user_access.role.display_name if user_access and user_access.role else None,
            'status': user_access.status if user_access else 'no_access',
            'access_valid': user_access.is_access_valid() if user_access else False,
            'last_access': user_access.last_access if user_access else None,
            'project_count': instance.project_accesses.filter(is_active=True).count()
        }








