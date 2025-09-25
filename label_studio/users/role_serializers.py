"""
Serializers for Role Management
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .role_models import Role, UserRoleAssignment, RolePermission, RoleAssignmentLog

User = get_user_model()


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for Role model"""
    
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'display_name', 'description', 
            'is_active', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """Validate role name uniqueness"""
        if self.instance and self.instance.name == value:
            return value
        
        if Role.objects.filter(name=value).exists():
            raise serializers.ValidationError("A role with this name already exists.")
        
        return value


class RolePermissionSerializer(serializers.ModelSerializer):
    """Serializer for RolePermission model"""
    
    class Meta:
        model = RolePermission
        fields = [
            'id', 'role', 'permission_name', 'permission_type',
            'resource', 'is_granted', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class UserRoleAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for UserRoleAssignment model"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    role_name = serializers.CharField(source='role.display_name', read_only=True)
    assigned_by_email = serializers.EmailField(source='assigned_by.email', read_only=True)
    
    class Meta:
        model = UserRoleAssignment
        fields = [
            'id', 'user', 'user_email', 'user_username', 'role', 'role_name',
            'assigned_by', 'assigned_by_email', 'assigned_at', 'is_active',
            'revoked_at', 'revoked_by', 'notes'
        ]
        read_only_fields = [
            'id', 'assigned_at', 'revoked_at', 'revoked_by'
        ]
    
    def validate(self, data):
        """Validate role assignment"""
        user = data.get('user')
        role = data.get('role')
        
        if user and role:
            # Check if assignment already exists
            existing = UserRoleAssignment.objects.filter(
                user=user, 
                role=role, 
                is_active=True
            ).exists()
            
            if existing:
                raise serializers.ValidationError(
                    f"User {user.email} already has role {role.display_name}"
                )
        
        return data


class RoleAssignmentRequestSerializer(serializers.Serializer):
    """Serializer for role assignment requests"""
    email = serializers.EmailField()
    selected_roles = serializers.ListField(
        child=serializers.CharField(),
        min_length=1,
        error_messages={
            'min_length': 'At least one role must be selected.'
        }
    )
    
    def validate_email(self, value):
        """Validate email format and length"""
        if len(value) > 254:
            raise serializers.ValidationError("Email address is too long.")
        return value.lower()
    
    def validate_selected_roles(self, value):
        """Validate selected roles"""
        if not value:
            raise serializers.ValidationError("At least one role must be selected.")
        
        # Check if all role IDs are valid
        valid_roles = Role.objects.filter(name__in=value, is_active=True)
        valid_role_names = [role.name for role in valid_roles]
        
        invalid_roles = [role for role in value if role not in valid_role_names]
        if invalid_roles:
            raise serializers.ValidationError(
                f"Invalid role(s): {', '.join(invalid_roles)}"
            )
        
        return value


class RoleAssignmentResponseSerializer(serializers.Serializer):
    """Serializer for role assignment responses"""
    success = serializers.BooleanField()
    message = serializers.CharField()
    user = serializers.DictField()
    assigned_roles = serializers.ListField()


class RoleAssignmentLogSerializer(serializers.ModelSerializer):
    """Serializer for RoleAssignmentLog model"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    role_name = serializers.CharField(source='role.display_name', read_only=True)
    action_by_email = serializers.EmailField(source='action_by.email', read_only=True)
    
    class Meta:
        model = RoleAssignmentLog
        fields = [
            'id', 'user', 'user_email', 'role', 'role_name',
            'action', 'action_by', 'action_by_email', 'action_at',
            'details', 'ip_address', 'user_agent'
        ]
        read_only_fields = ['id', 'action_at']


class BulkRoleAssignmentSerializer(serializers.Serializer):
    """Serializer for bulk role assignments"""
    emails = serializers.ListField(
        child=serializers.EmailField(),
        min_length=1
    )
    selected_roles = serializers.ListField(
        child=serializers.CharField(),
        min_length=1
    )
    
    def validate_emails(self, value):
        """Validate email list"""
        if len(value) > 100:  # Limit bulk operations
            raise serializers.ValidationError("Cannot assign roles to more than 100 users at once.")
        
        # Check for duplicates
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Duplicate email addresses found.")
        
        return [email.lower() for email in value]
    
    def validate_selected_roles(self, value):
        """Validate selected roles"""
        valid_roles = Role.objects.filter(name__in=value, is_active=True)
        valid_role_names = [role.name for role in valid_roles]
        
        invalid_roles = [role for role in value if role not in valid_role_names]
        if invalid_roles:
            raise serializers.ValidationError(
                f"Invalid role(s): {', '.join(invalid_roles)}"
            )
        
        return value