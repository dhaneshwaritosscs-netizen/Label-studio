"""
Models for Role Management System
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError
import uuid

User = get_user_model()


class Role(models.Model):
    """
    Model representing a role that can be assigned to users
    """
    ROLE_TYPES = [
        ('system', 'System Role'),
        ('custom', 'Custom Role'),
        ('project', 'Project Role'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True, help_text="Internal role identifier")
    display_name = models.CharField(max_length=200, help_text="Human-readable role name")
    description = models.TextField(blank=True, help_text="Role description")
    role_type = models.CharField(max_length=20, choices=ROLE_TYPES, default='custom')
    is_active = models.BooleanField(default=True, help_text="Whether this role is active")
    
    # Metadata
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='created_roles',
        help_text="User who created this role"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['display_name']
        verbose_name = "Role"
        verbose_name_plural = "Roles"
    
    def __str__(self):
        return f"{self.display_name} ({self.name})"
    
    def clean(self):
        """Validate role data"""
        if not self.name:
            raise ValidationError("Role name is required")
        
        if not self.display_name:
            raise ValidationError("Display name is required")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class RolePermission(models.Model):
    """
    Model representing permissions associated with roles
    """
    PERMISSION_TYPES = [
        ('read', 'Read'),
        ('write', 'Write'),
        ('delete', 'Delete'),
        ('admin', 'Admin'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(
        Role, 
        on_delete=models.CASCADE, 
        related_name='permissions',
        help_text="Role this permission belongs to"
    )
    permission_name = models.CharField(max_length=100, help_text="Permission identifier")
    permission_type = models.CharField(max_length=20, choices=PERMISSION_TYPES, default='read')
    resource = models.CharField(max_length=100, blank=True, help_text="Resource this permission applies to")
    is_granted = models.BooleanField(default=True, help_text="Whether this permission is granted")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['role', 'permission_name', 'resource']
        ordering = ['permission_name']
        verbose_name = "Role Permission"
        verbose_name_plural = "Role Permissions"
    
    def __str__(self):
        action = "Grant" if self.is_granted else "Deny"
        return f"{self.role.display_name} - {action} {self.permission_name}"


class UserRoleAssignment(models.Model):
    """
    Model representing the assignment of roles to users
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='role_assignments',
        help_text="User this role is assigned to"
    )
    role = models.ForeignKey(
        Role, 
        on_delete=models.CASCADE, 
        related_name='user_assignments',
        help_text="Role assigned to the user"
    )
    
    # Assignment metadata
    assigned_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='assigned_roles',
        help_text="User who assigned this role"
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True, help_text="Whether this assignment is active")
    
    # Revocation metadata
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='revoked_roles',
        help_text="User who revoked this role"
    )
    
    # Additional information
    notes = models.TextField(blank=True, help_text="Additional notes about this assignment")
    
    class Meta:
        unique_together = ['user', 'role']
        ordering = ['-assigned_at']
        verbose_name = "User Role Assignment"
        verbose_name_plural = "User Role Assignments"
    
    def __str__(self):
        status = "Active" if self.is_active else "Revoked"
        return f"{self.user.email} - {self.role.display_name} ({status})"
    
    def revoke(self, revoked_by=None):
        """Revoke this role assignment"""
        self.is_active = False
        self.revoked_at = timezone.now()
        self.revoked_by = revoked_by
        self.save()
    
    def reactivate(self):
        """Reactivate this role assignment"""
        self.is_active = True
        self.revoked_at = None
        self.revoked_by = None
        self.save()


class RoleAssignmentLog(models.Model):
    """
    Model for logging role assignment activities
    """
    ACTION_TYPES = [
        ('assigned', 'Assigned'),
        ('revoked', 'Revoked'),
        ('reactivated', 'Reactivated'),
        ('modified', 'Modified'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='role_assignment_logs',
        help_text="User affected by this action"
    )
    role = models.ForeignKey(
        Role, 
        on_delete=models.CASCADE, 
        related_name='assignment_logs',
        help_text="Role involved in this action"
    )
    action = models.CharField(max_length=20, choices=ACTION_TYPES, help_text="Type of action performed")
    action_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='performed_role_actions',
        help_text="User who performed this action"
    )
    action_at = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict, help_text="Additional details about the action")
    
    # Request metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-action_at']
        verbose_name = "Role Assignment Log"
        verbose_name_plural = "Role Assignment Logs"
    
    def __str__(self):
        return f"{self.action.title()} {self.role.display_name} for {self.user.email} at {self.action_at}"
    
    @classmethod
    def log_action(cls, user, role, action, action_by=None, details=None, request=None):
        """Create a log entry for a role assignment action"""
        log_data = {
            'user': user,
            'role': role,
            'action': action,
            'action_by': action_by,
            'details': details or {},
        }
        
        if request:
            log_data['ip_address'] = cls._get_client_ip(request)
            log_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
        
        return cls.objects.create(**log_data)
    
    @staticmethod
    def _get_client_ip(request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip