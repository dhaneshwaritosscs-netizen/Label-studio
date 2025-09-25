"""
User Access Management Models
This module defines models for managing user access, roles, and permissions.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.conf import settings
from core.utils.common import create_hash


class UserRole(models.Model):
    """
    Defines different roles that users can have in the system.
    """
    
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('manager', 'Manager'),
        ('annotator', 'Annotator'),
        ('viewer', 'Viewer'),
        ('guest', 'Guest'),
    ]
    
    name = models.CharField(
        _('role name'),
        max_length=50,
        choices=ROLE_CHOICES,
        unique=True,
        help_text=_('The name of the role')
    )
    
    display_name = models.CharField(
        _('display name'),
        max_length=100,
        help_text=_('Human-readable name for the role')
    )
    
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('Description of what this role can do')
    )
    
    permissions = models.JSONField(
        _('permissions'),
        default=dict,
        help_text=_('JSON object containing role permissions')
    )
    
    is_active = models.BooleanField(
        _('is active'),
        default=True,
        help_text=_('Whether this role is currently active')
    )
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        db_table = 'user_role'
        verbose_name = _('User Role')
        verbose_name_plural = _('User Roles')
        ordering = ['name']
    
    def __str__(self):
        return f"{self.display_name} ({self.name})"


class UserAccess(models.Model):
    """
    Manages user access permissions and role assignments.
    """
    
    ACCESS_STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
        ('pending', 'Pending'),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='access_profile',
        help_text=_('The user this access profile belongs to')
    )
    
    role = models.ForeignKey(
        UserRole,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        help_text=_('The primary role assigned to this user')
    )
    
    status = models.CharField(
        _('access status'),
        max_length=20,
        choices=ACCESS_STATUS_CHOICES,
        default='active',
        help_text=_('Current access status of the user')
    )
    
    permissions = models.JSONField(
        _('custom permissions'),
        default=dict,
        help_text=_('Custom permissions specific to this user')
    )
    
    access_token = models.CharField(
        _('access token'),
        max_length=256,
        unique=True,
        default=create_hash,
        help_text=_('Unique token for API access')
    )
    
    last_access = models.DateTimeField(
        _('last access'),
        null=True,
        blank=True,
        help_text=_('When the user last accessed the system')
    )
    
    access_expires_at = models.DateTimeField(
        _('access expires at'),
        null=True,
        blank=True,
        help_text=_('When this user\'s access expires')
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_access_profiles',
        help_text=_('User who created this access profile')
    )
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        db_table = 'user_access'
        verbose_name = _('User Access')
        verbose_name_plural = _('User Access Profiles')
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['access_token']),
            models.Index(fields=['last_access']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.get_status_display()}"
    
    def is_access_valid(self):
        """Check if the user's access is currently valid."""
        if self.status != 'active':
            return False
        
        if self.access_expires_at and timezone.now() > self.access_expires_at:
            return False
        
        return True
    
    def update_last_access(self):
        """Update the last access timestamp."""
        self.last_access = timezone.now()
        self.save(update_fields=['last_access'])
    
    def get_effective_permissions(self):
        """Get all effective permissions for this user."""
        permissions = {}
        
        # Add role permissions
        if self.role:
            permissions.update(self.role.permissions)
        
        # Add custom permissions (custom permissions override role permissions)
        permissions.update(self.permissions)
        
        return permissions
    
    def has_permission(self, permission_name):
        """Check if user has a specific permission."""
        effective_permissions = self.get_effective_permissions()
        return effective_permissions.get(permission_name, False)


class AccessLog(models.Model):
    """
    Logs user access activities for audit purposes.
    """
    
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('access_denied', 'Access Denied'),
        ('permission_granted', 'Permission Granted'),
        ('permission_denied', 'Permission Denied'),
        ('role_changed', 'Role Changed'),
        ('status_changed', 'Status Changed'),
        ('api_access', 'API Access'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='access_logs',
        help_text=_('User who performed the action')
    )
    
    action = models.CharField(
        _('action'),
        max_length=50,
        choices=ACTION_CHOICES,
        help_text=_('Type of action performed')
    )
    
    details = models.JSONField(
        _('details'),
        default=dict,
        help_text=_('Additional details about the action')
    )
    
    ip_address = models.GenericIPAddressField(
        _('IP address'),
        null=True,
        blank=True,
        help_text=_('IP address from which the action was performed')
    )
    
    user_agent = models.TextField(
        _('user agent'),
        blank=True,
        help_text=_('User agent string from the request')
    )
    
    timestamp = models.DateTimeField(
        _('timestamp'),
        auto_now_add=True,
        help_text=_('When the action occurred')
    )
    
    class Meta:
        db_table = 'access_log'
        verbose_name = _('Access Log')
        verbose_name_plural = _('Access Logs')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'action']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['ip_address']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.get_action_display()} at {self.timestamp}"


class ProjectAccess(models.Model):
    """
    Manages user access to specific projects.
    """
    
    ACCESS_LEVEL_CHOICES = [
        ('read', 'Read Only'),
        ('write', 'Read/Write'),
        ('admin', 'Administrator'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_accesses',
        help_text=_('User with project access')
    )
    
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='user_accesses',
        help_text=_('Project the user has access to')
    )
    
    access_level = models.CharField(
        _('access level'),
        max_length=20,
        choices=ACCESS_LEVEL_CHOICES,
        default='read',
        help_text=_('Level of access to the project')
    )
    
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='granted_project_accesses',
        help_text=_('User who granted this access')
    )
    
    granted_at = models.DateTimeField(
        _('granted at'),
        auto_now_add=True,
        help_text=_('When access was granted')
    )
    
    expires_at = models.DateTimeField(
        _('expires at'),
        null=True,
        blank=True,
        help_text=_('When this access expires')
    )
    
    is_active = models.BooleanField(
        _('is active'),
        default=True,
        help_text=_('Whether this access is currently active')
    )
    
    class Meta:
        db_table = 'project_access'
        verbose_name = _('Project Access')
        verbose_name_plural = _('Project Accesses')
        unique_together = ['user', 'project']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['project', 'is_active']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.project.title} ({self.get_access_level_display()})"
    
    def is_valid(self):
        """Check if the project access is currently valid."""
        if not self.is_active:
            return False
        
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        
        return True








