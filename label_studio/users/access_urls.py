"""
URL configuration for User Access Management API
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .access_api import (
    UserRoleViewSet, 
    UserAccessViewSet, 
    AccessLogViewSet, 
    ProjectAccessViewSet
)

# Create router for API endpoints
router = DefaultRouter()
router.register(r'roles', UserRoleViewSet, basename='user-role')
router.register(r'access', UserAccessViewSet, basename='user-access')
router.register(r'logs', AccessLogViewSet, basename='access-log')
router.register(r'project-access', ProjectAccessViewSet, basename='project-access')

urlpatterns = [
    path('api/access/', include(router.urls)),
]








