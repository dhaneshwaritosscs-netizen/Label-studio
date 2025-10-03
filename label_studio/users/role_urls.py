"""
URL patterns for Role Management
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .role_assignment_api import RoleAssignmentAPIView, RoleAssignmentViewSet
from .role_api import RoleViewSet, UserRoleAssignmentViewSet
from .access_api import UserRoleViewSet, UserAccessViewSet
from .server_response_api import ServerResponseAPIView, RoleAssignmentResponseAPIView, APIStatusView, UserRolesAPIView, SimpleUserRolesAPIView, simple_user_roles_view

app_name = 'role_management'

# Create router for ViewSets
router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'assignments', RoleAssignmentViewSet, basename='role-assignment')
router.register(r'user-roles', UserRoleViewSet, basename='user-role')
router.register(r'user-access', UserAccessViewSet, basename='user-access')

urlpatterns = [
    # API endpoints
    path('api/role-assignment/', RoleAssignmentAPIView.as_view(), name='role-assignment'),
    path('api/', include(router.urls)),

    # Server Response API endpoints
    path('api/server-response/', ServerResponseAPIView.as_view(), name='server-response'),
    path('api/role-assignment-enhanced/', RoleAssignmentResponseAPIView.as_view(), name='role-assignment-enhanced'),
    path('api/status/', APIStatusView.as_view(), name='api-status'),
    path('api/user-roles/', UserRolesAPIView.as_view(), name='user-roles'),
    path('api/simple-user-roles/', SimpleUserRolesAPIView.as_view(), name='simple-user-roles'),
    path('api/simple-user-roles-function/', simple_user_roles_view, name='simple-user-roles-function'),

    # Additional endpoints
    path('api/roles/<int:pk>/users/', RoleViewSet.as_view({'get': 'users'}), name='role-users'),
    path('api/assignments/by-email/', RoleAssignmentViewSet.as_view({'get': 'by_email'}), name='assignments-by-email'),
    path('api/assignments/available-roles/', RoleAssignmentViewSet.as_view({'get': 'available_roles'}), name='available-roles'),
    path('api/assignments/<int:pk>/revoke/', RoleAssignmentViewSet.as_view({'post': 'revoke'}), name='revoke-assignment'),
    path('api/user-access/my-access/', UserAccessViewSet.as_view({'get': 'my_access'}), name='my-access'),
    path('api/user-access/check-permission/', UserAccessViewSet.as_view({'get': 'check_permission'}), name='check-permission'),
]
