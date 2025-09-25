"""
Project Settings Access Control Models
Manages user access to specific project settings fields.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.conf import settings


class ProjectSettingsAccess(models.Model):
    """
    Manages user access to specific project settings fields.
    """
    
    # Project Settings Fields
    SETTINGS_FIELDS = [
        ('general', 'General Settings'),
        ('labeling_interface', 'Labeling Interface'),
        ('annotation', 'Annotation Settings'),
        ('model', 'Model Settings'),
        ('predictions', 'Predictions'),
        ('cloud_storage', 'Cloud Storage'),
        ('webhooks', 'Webhooks'),
        ('danger_zone', 'Danger Zone'),
    ]
    
    ACCESS_LEVEL_CHOICES = [
        ('none', 'No Access'),
        ('read', 'Read Only'),
        ('write', 'Read/Write'),
        ('admin', 'Full Access'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_settings_access',
        help_text=_('User with access to project settings')
    )
    
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='settings_access',
        help_text=_('Project the user has settings access to')
    )
    
    # Individual field access levels
    general_access = models.CharField(
        _('general access'),
        max_length=20,
        choices=ACCESS_LEVEL_CHOICES,
        default='read',
        help_text=_('Access level for General settings')
    )
    
    labeling_interface_access = models.CharField(
        _('labeling interface access'),
        max_length=20,
        choices=ACCESS_LEVEL_CHOICES,
        default='read',
        help_text=_('Access level for Labeling Interface settings')
    )
    
    annotation_access = models.CharField(
        _('annotation access'),
        max_length=20,
        choices=ACCESS_LEVEL_CHOICES,
        default='read',
        help_text=_('Access level for Annotation settings')
    )
    
    model_access = models.CharField(
        _('model access'),
        max_length=20,
        choices=ACCESS_LEVEL_CHOICES,
        default='read',
        help_text=_('Access level for Model settings')
    )
    
    predictions_access = models.CharField(
        _('predictions access'),
        max_length=20,
        choices=ACCESS_LEVEL_CHOICES,
        default='read',
        help_text=_('Access level for Predictions settings')
    )
    
    cloud_storage_access = models.CharField(
        _('cloud storage access'),
        max_length=20,
        choices=ACCESS_LEVEL_CHOICES,
        default='read',
        help_text=_('Access level for Cloud Storage settings')
    )
    
    webhooks_access = models.CharField(
        _('webhooks access'),
        max_length=20,
        choices=ACCESS_LEVEL_CHOICES,
        default='read',
        help_text=_('Access level for Webhooks settings')
    )
    
    danger_zone_access = models.CharField(
        _('danger zone access'),
        max_length=20,
        choices=ACCESS_LEVEL_CHOICES,
        default='none',
        help_text=_('Access level for Danger Zone settings')
    )
    
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='granted_settings_access',
        help_text=_('User who granted this settings access')
    )
    
    granted_at = models.DateTimeField(
        _('granted at'),
        auto_now_add=True,
        help_text=_('When settings access was granted')
    )
    
    expires_at = models.DateTimeField(
        _('expires at'),
        null=True,
        blank=True,
        help_text=_('When this settings access expires')
    )
    
    is_active = models.BooleanField(
        _('is active'),
        default=True,
        help_text=_('Whether this settings access is currently active')
    )
    
    notes = models.TextField(
        _('notes'),
        blank=True,
        help_text=_('Additional notes about this access grant')
    )
    
    class Meta:
        db_table = 'project_settings_access'
        verbose_name = _('Project Settings Access')
        verbose_name_plural = _('Project Settings Access')
        unique_together = ['user', 'project']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['project', 'is_active']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.project.title} Settings Access"
    
    def is_valid(self):
        """Check if the settings access is currently valid."""
        if not self.is_active:
            return False
        
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        
        return True
    
    def get_field_access(self, field_name):
        """Get access level for a specific field."""
        field_mapping = {
            'general': self.general_access,
            'labeling_interface': self.labeling_interface_access,
            'annotation': self.annotation_access,
            'model': self.model_access,
            'predictions': self.predictions_access,
            'cloud_storage': self.cloud_storage_access,
            'webhooks': self.webhooks_access,
            'danger_zone': self.danger_zone_access,
        }
        
        return field_mapping.get(field_name, 'none')
    
    def has_field_access(self, field_name, required_level='read'):
        """Check if user has required access level for a field."""
        if not self.is_valid():
            return False
        
        current_access = self.get_field_access(field_name)
        
        # Define access level hierarchy
        access_hierarchy = {
            'none': 0,
            'read': 1,
            'write': 2,
            'admin': 3,
        }
        
        required_level_value = access_hierarchy.get(required_level, 0)
        current_level_value = access_hierarchy.get(current_access, 0)
        
        return current_level_value >= required_level_value
    
    def can_read_field(self, field_name):
        """Check if user can read a specific field."""
        return self.has_field_access(field_name, 'read')
    
    def can_write_field(self, field_name):
        """Check if user can write to a specific field."""
        return self.has_field_access(field_name, 'write')
    
    def can_admin_field(self, field_name):
        """Check if user has admin access to a specific field."""
        return self.has_field_access(field_name, 'admin')
    
    def get_all_access_levels(self):
        """Get all field access levels as a dictionary."""
        return {
            'general': self.general_access,
            'labeling_interface': self.labeling_interface_access,
            'annotation': self.annotation_access,
            'model': self.model_access,
            'predictions': self.predictions_access,
            'cloud_storage': self.cloud_storage_access,
            'webhooks': self.webhooks_access,
            'danger_zone': self.danger_zone_access,
        }


class SettingsAccessLog(models.Model):
    """
    Logs access to project settings for audit purposes.
    """
    
    ACTION_CHOICES = [
        ('view', 'View Settings'),
        ('edit', 'Edit Settings'),
        ('access_denied', 'Access Denied'),
        ('permission_granted', 'Permission Granted'),
        ('permission_revoked', 'Permission Revoked'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='settings_access_logs',
        help_text=_('User who performed the action')
    )
    
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='settings_access_logs',
        help_text=_('Project whose settings were accessed')
    )
    
    field_name = models.CharField(
        _('field name'),
        max_length=50,
        choices=ProjectSettingsAccess.SETTINGS_FIELDS,
        help_text=_('Which settings field was accessed')
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
        db_table = 'settings_access_log'
        verbose_name = _('Settings Access Log')
        verbose_name_plural = _('Settings Access Logs')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'project', 'field_name']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['action']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.project.title} - {self.field_name} - {self.get_action_display()}"


class SettingsAccessTemplate(models.Model):
    """
    Templates for common settings access patterns.
    """
    
    TEMPLATE_TYPES = [
        ('annotator', 'Annotator Template'),
        ('manager', 'Manager Template'),
        ('viewer', 'Viewer Template'),
        ('admin', 'Admin Template'),
        ('custom', 'Custom Template'),
    ]
    
    name = models.CharField(
        _('template name'),
        max_length=100,
        help_text=_('Name of the access template')
    )
    
    template_type = models.CharField(
        _('template type'),
        max_length=20,
        choices=TEMPLATE_TYPES,
        help_text=_('Type of access template')
    )
    
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('Description of this access template')
    )
    
    # Default access levels for each field
    general_access = models.CharField(
        _('general access'),
        max_length=20,
        choices=ProjectSettingsAccess.ACCESS_LEVEL_CHOICES,
        default='read'
    )
    
    labeling_interface_access = models.CharField(
        _('labeling interface access'),
        max_length=20,
        choices=ProjectSettingsAccess.ACCESS_LEVEL_CHOICES,
        default='read'
    )
    
    annotation_access = models.CharField(
        _('annotation access'),
        max_length=20,
        choices=ProjectSettingsAccess.ACCESS_LEVEL_CHOICES,
        default='read'
    )
    
    model_access = models.CharField(
        _('model access'),
        max_length=20,
        choices=ProjectSettingsAccess.ACCESS_LEVEL_CHOICES,
        default='read'
    )
    
    predictions_access = models.CharField(
        _('predictions access'),
        max_length=20,
        choices=ProjectSettingsAccess.ACCESS_LEVEL_CHOICES,
        default='read'
    )
    
    cloud_storage_access = models.CharField(
        _('cloud storage access'),
        max_length=20,
        choices=ProjectSettingsAccess.ACCESS_LEVEL_CHOICES,
        default='read'
    )
    
    webhooks_access = models.CharField(
        _('webhooks access'),
        max_length=20,
        choices=ProjectSettingsAccess.ACCESS_LEVEL_CHOICES,
        default='read'
    )
    
    danger_zone_access = models.CharField(
        _('danger zone access'),
        max_length=20,
        choices=ProjectSettingsAccess.ACCESS_LEVEL_CHOICES,
        default='none'
    )
    
    is_active = models.BooleanField(
        _('is active'),
        default=True,
        help_text=_('Whether this template is currently active')
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_settings_templates',
        help_text=_('User who created this template')
    )
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        db_table = 'settings_access_template'
        verbose_name = _('Settings Access Template')
        verbose_name_plural = _('Settings Access Templates')
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"
    
    def apply_to_user_project(self, user, project, granted_by=None):
        """Apply this template to a user-project combination."""
        access, created = ProjectSettingsAccess.objects.get_or_create(
            user=user,
            project=project,
            defaults={
                'general_access': self.general_access,
                'labeling_interface_access': self.labeling_interface_access,
                'annotation_access': self.annotation_access,
                'model_access': self.model_access,
                'predictions_access': self.predictions_access,
                'cloud_storage_access': self.cloud_storage_access,
                'webhooks_access': self.webhooks_access,
                'danger_zone_access': self.danger_zone_access,
                'granted_by': granted_by,
                'is_active': True,
            }
        )
        
        if not created:
            # Update existing access
            access.general_access = self.general_access
            access.labeling_interface_access = self.labeling_interface_access
            access.annotation_access = self.annotation_access
            access.model_access = self.model_access
            access.predictions_access = self.predictions_access
            access.cloud_storage_access = self.cloud_storage_access
            access.webhooks_access = self.webhooks_access
            access.danger_zone_access = self.danger_zone_access
            access.granted_by = granted_by
            access.is_active = True
            access.save()
        
        return access








