"""
Admin interface for User Access Management
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .access_models import UserRole, UserAccess, AccessLog, ProjectAccess


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'display_name', 'is_active', 'user_count', 'created_at']
    list_filter = ['is_active', 'name', 'created_at']
    search_fields = ['name', 'display_name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'display_name', 'description', 'is_active')
        }),
        ('Permissions', {
            'fields': ('permissions',),
            'description': 'Define what this role can do in JSON format'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_count(self, obj):
        """Show how many users have this role."""
        count = obj.users.count()
        if count > 0:
            url = reverse('admin:users_useraccess_changelist') + f'?role__id__exact={obj.id}'
            return format_html('<a href="{}">{} users</a>', url, count)
        return '0 users'
    user_count.short_description = 'Users with this role'


@admin.register(UserAccess)
class UserAccessAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'status', 'access_valid', 'last_access', 'created_at']
    list_filter = ['status', 'role', 'created_at', 'last_access']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['access_token', 'created_at', 'updated_at', 'last_access']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'role', 'status')
        }),
        ('Permissions', {
            'fields': ('permissions',),
            'description': 'Custom permissions for this user (overrides role permissions)'
        }),
        ('Access Control', {
            'fields': ('access_token', 'access_expires_at', 'last_access')
        }),
        ('Audit Information', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def access_valid(self, obj):
        """Show if the user's access is currently valid."""
        is_valid = obj.is_access_valid()
        if is_valid:
            return format_html('<span style="color: green;">✓ Valid</span>')
        else:
            return format_html('<span style="color: red;">✗ Invalid</span>')
    access_valid.short_description = 'Access Status'
    
    def save_model(self, request, obj, form, change):
        """Set created_by when creating a new access profile."""
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(AccessLog)
class AccessLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'ip_address', 'timestamp']
    list_filter = ['action', 'timestamp', 'ip_address']
    search_fields = ['user__username', 'user__email', 'ip_address']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('Action Information', {
            'fields': ('user', 'action', 'details')
        }),
        ('Request Information', {
            'fields': ('ip_address', 'user_agent')
        }),
        ('Timestamp', {
            'fields': ('timestamp',)
        }),
    )
    
    def has_add_permission(self, request):
        """Prevent manual addition of access logs."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Prevent modification of access logs."""
        return False


@admin.register(ProjectAccess)
class ProjectAccessAdmin(admin.ModelAdmin):
    list_display = ['user', 'project', 'access_level', 'is_active', 'access_valid', 'granted_at']
    list_filter = ['access_level', 'is_active', 'granted_at', 'expires_at']
    search_fields = ['user__username', 'user__email', 'project__title']
    readonly_fields = ['granted_at']
    
    fieldsets = (
        ('Access Information', {
            'fields': ('user', 'project', 'access_level', 'is_active')
        }),
        ('Grant Information', {
            'fields': ('granted_by', 'granted_at', 'expires_at')
        }),
    )
    
    def access_valid(self, obj):
        """Show if the project access is currently valid."""
        is_valid = obj.is_valid()
        if is_valid:
            return format_html('<span style="color: green;">✓ Valid</span>')
        else:
            return format_html('<span style="color: red;">✗ Invalid</span>')
    access_valid.short_description = 'Access Status'
    
    def save_model(self, request, obj, form, change):
        """Set granted_by when creating new project access."""
        if not change:  # Creating new object
            obj.granted_by = request.user
        super().save_model(request, obj, form, change)








