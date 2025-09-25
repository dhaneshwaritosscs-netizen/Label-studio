"""
URL configuration for Project Settings Access Management API
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .project_settings_access_api import (
    ProjectSettingsAccessViewSet,
    SettingsAccessLogViewSet,
    SettingsAccessTemplateViewSet
)

# Create router for API endpoints
router = DefaultRouter()
router.register(r'project-settings-access', ProjectSettingsAccessViewSet, basename='project-settings-access')
router.register(r'settings-access-logs', SettingsAccessLogViewSet, basename='settings-access-logs')
router.register(r'settings-access-templates', SettingsAccessTemplateViewSet, basename='settings-access-templates')

urlpatterns = [
    path('api/access/', include(router.urls)),
]








