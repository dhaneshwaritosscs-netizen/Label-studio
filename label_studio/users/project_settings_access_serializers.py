"""
Serializers for Project Settings Access Management API
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .project_settings_access import ProjectSettingsAccess, SettingsAccessLog, SettingsAccessTemplate

User = get_user_model()


class ProjectSettingsAccessSerializer(serializers.ModelSerializer):
    """Serializer for ProjectSettingsAccess model."""
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    granted_by_username = serializers.CharField(source='granted_by.username', read_only=True)
    access_valid = serializers.SerializerMethodField()
    all_access_levels = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectSettingsAccess
        fields = [
            'id', 'user', 'user_username', 'user_email', 'user_first_name', 'user_last_name',
            'project', 'project_title', 'general_access', 'labeling_interface_access',
            'annotation_access', 'model_access', 'predictions_access', 'cloud_storage_access',
            'webhooks_access', 'danger_zone_access', 'granted_by', 'granted_by_username',
            'granted_at', 'expires_at', 'is_active', 'notes', 'access_valid', 'all_access_levels'
        ]
        read_only_fields = [
            'id', 'granted_by', 'granted_at'
        ]
    
    def get_access_valid(self, obj):
        """Check if the settings access is currently valid."""
        return obj.is_valid()
    
    def get_all_access_levels(self, obj):
        """Get all field access levels as a dictionary."""
        return obj.get_all_access_levels()


class SettingsAccessLogSerializer(serializers.ModelSerializer):
    """Serializer for SettingsAccessLog model."""
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    field_display = serializers.CharField(source='get_field_name_display', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = SettingsAccessLog
        fields = [
            'id', 'user', 'user_username', 'user_email', 'project', 'project_title',
            'field_name', 'field_display', 'action', 'action_display',
            'details', 'ip_address', 'user_agent', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class SettingsAccessTemplateSerializer(serializers.ModelSerializer):
    """Serializer for SettingsAccessTemplate model."""
    
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    template_type_display = serializers.CharField(source='get_template_type_display', read_only=True)
    
    class Meta:
        model = SettingsAccessTemplate
        fields = [
            'id', 'name', 'template_type', 'template_type_display', 'description',
            'general_access', 'labeling_interface_access', 'annotation_access',
            'model_access', 'predictions_access', 'cloud_storage_access',
            'webhooks_access', 'danger_zone_access', 'is_active',
            'created_by', 'created_by_username', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at'
        ]


class ProjectSettingsAccessSummarySerializer(serializers.Serializer):
    """Summary serializer for project settings access information."""
    
    project_id = serializers.IntegerField()
    project_title = serializers.CharField()
    user_count = serializers.IntegerField()
    access_levels_summary = serializers.DictField()
    
    def to_representation(self, instance):
        """Custom representation for project settings access summary."""
        return {
            'project_id': instance['project_id'],
            'project_title': instance['project_title'],
            'user_count': instance['user_count'],
            'access_levels_summary': instance['access_levels_summary']
        }


class FieldAccessCheckSerializer(serializers.Serializer):
    """Serializer for field access check responses."""
    
    field_name = serializers.CharField()
    required_level = serializers.CharField()
    current_access = serializers.CharField()
    has_access = serializers.BooleanField()
    project_title = serializers.CharField()
    
    def to_representation(self, instance):
        """Custom representation for field access check."""
        return {
            'field_name': instance['field_name'],
            'required_level': instance['required_level'],
            'current_access': instance['current_access'],
            'has_access': instance['has_access'],
            'project_title': instance['project_title']
        }








