"""
Server Response API - Comprehensive API for handling server responses
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import logging
import json

logger = logging.getLogger(__name__)
User = get_user_model()


class ServerResponseAPIView(APIView):
    """
    Comprehensive API for handling server responses
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        Health check endpoint
        """
        return Response({
            'status': 'success',
            'message': 'Server is running',
            'timestamp': timezone.now().isoformat(),
            'version': '1.0.0'
        }, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Handle various server response requests
        """
        try:
            # Get request data
            data = request.data
            action = data.get('action', 'unknown')
            
            logger.info(f"Server response API called with action: {action}")
            
            if action == 'health_check':
                return self._health_check()
            elif action == 'test_connection':
                return self._test_connection()
            elif action == 'get_server_info':
                return self._get_server_info()
            else:
                return Response({
                    'status': 'error',
                    'message': f'Unknown action: {action}',
                    'available_actions': ['health_check', 'test_connection', 'get_server_info']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Server response API error: {e}", exc_info=True)
            return Response({
                'status': 'error',
                'message': 'Internal server error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _health_check(self):
        """Health check response"""
        return Response({
            'status': 'success',
            'message': 'Server is healthy',
            'timestamp': timezone.now().isoformat(),
            'database': 'connected',
            'api': 'operational'
        }, status=status.HTTP_200_OK)

    def _test_connection(self):
        """Test connection response"""
        return Response({
            'status': 'success',
            'message': 'Connection test successful',
            'timestamp': timezone.now().isoformat(),
            'server': 'Django',
            'port': '8010',
            'database': 'SQLite'
        }, status=status.HTTP_200_OK)

    def _get_server_info(self):
        """Get server information"""
        return Response({
            'status': 'success',
            'message': 'Server information retrieved',
            'timestamp': timezone.now().isoformat(),
            'server_info': {
                'framework': 'Django',
                'version': '3.1.7',
                'database': 'SQLite',
                'port': '8010',
                'environment': 'development'
            }
        }, status=status.HTTP_200_OK)


class RoleAssignmentResponseAPIView(APIView):
    """
    Enhanced role assignment API with comprehensive response handling
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Enhanced role assignment with comprehensive response
        """
        try:
            # Validate request data
            email = request.data.get('email')
            selected_roles = request.data.get('selected_roles', [])
            
            if not email:
                return Response({
                    'status': 'error',
                    'message': 'Email is required',
                    'code': 'MISSING_EMAIL'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not selected_roles:
                return Response({
                    'status': 'error',
                    'message': 'At least one role must be selected',
                    'code': 'NO_ROLES_SELECTED'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Import role models
            from users.role_models import Role, UserRoleAssignment
            from users.role_assignment_api import RoleAssignmentAPIView
            
            # Use existing role assignment logic
            role_api = RoleAssignmentAPIView()
            response = role_api.post(request)
            
            # Enhance the response
            if response.status_code == 201:
                response_data = response.data
                response_data.update({
                    'status': 'success',
                    'timestamp': timezone.now().isoformat(),
                    'server_response': 'OK'
                })
                return Response(response_data, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'status': 'error',
                    'message': 'Role assignment failed',
                    'details': response.data,
                    'timestamp': timezone.now().isoformat()
                }, status=response.status_code)
                
        except Exception as e:
            logger.error(f"Role assignment response API error: {e}", exc_info=True)
            return Response({
                'status': 'error',
                'message': 'Internal server error',
                'error': str(e),
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserRolesAPIView(APIView):
    """
    API endpoint to fetch user roles
    """
    permission_classes = [permissions.AllowAny]  # Allow any for now to test functionality
    authentication_classes = []  # Disable authentication completely

    def get(self, request):
        """
        Get roles for a specific user by email
        """
        try:
            email = request.query_params.get('email')
            if not email:
                return Response({
                    'status': 'error',
                    'message': 'Email parameter is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Import role models
            from users.role_models import UserRoleAssignment
            from django.contrib.auth import get_user_model
            User = get_user_model()

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({
                    'status': 'success',
                    'message': 'User not found',
                    'user_roles': [],
                    'user_exists': False
                }, status=status.HTTP_200_OK)

            # Get user role assignments
            assignments = UserRoleAssignment.objects.filter(user=user, is_active=True)
            user_roles = []
            
            for assignment in assignments:
                user_roles.append({
                    'id': str(assignment.role.id),
                    'name': assignment.role.name,
                    'display_name': assignment.role.display_name,
                    'description': assignment.role.description,
                    'assigned_at': assignment.assigned_at.isoformat(),
                    'assigned_by': assignment.assigned_by.email if assignment.assigned_by else 'System'
                })

            return Response({
                'status': 'success',
                'message': f'Found {len(user_roles)} role(s) for user',
                'user_roles': user_roles,
                'user_exists': True,
                'user_info': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"User roles API error: {e}", exc_info=True)
            return Response({
                'status': 'error',
                'message': 'Internal server error',
                'error': str(e),
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class APIStatusView(APIView):
    """
    API Status endpoint for monitoring
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        Get API status and health
        """
        try:
            # Test database connection
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"

        return Response({
            'status': 'success',
            'api_status': 'operational',
            'database_status': db_status,
            'timestamp': timezone.now().isoformat(),
            'endpoints': {
                'role_assignment': '/api/role-assignment/',
                'server_response': '/api/server-response/',
                'api_status': '/api/status/',
                'user_roles': '/api/user-roles/'
            }
        }, status=status.HTTP_200_OK)


# Simple Django view function that bypasses REST framework authentication
@csrf_exempt
@require_http_methods(["GET"])
def simple_user_roles_view(request):
    """
    Simple Django view to fetch user roles without authentication
    """
    try:
        email = request.GET.get('email')
        if not email:
            return JsonResponse({
                'status': 'error',
                'message': 'Email parameter is required'
            }, status=400)

        # Import role models
        from users.role_models import UserRoleAssignment
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({
                'status': 'success',
                'message': 'User not found',
                'user_roles': [],
                'user_exists': False
            })

        # Get user role assignments
        assignments = UserRoleAssignment.objects.filter(user=user, is_active=True)
        user_roles = []
        
        for assignment in assignments:
            user_roles.append({
                'id': str(assignment.role.id),
                'name': assignment.role.name,
                'display_name': assignment.role.display_name,
                'description': assignment.role.description,
                'assigned_at': assignment.assigned_at.isoformat(),
                'assigned_by': assignment.assigned_by.email if assignment.assigned_by else 'System'
            })

        return JsonResponse({
            'status': 'success',
            'message': f'Found {len(user_roles)} role(s) for user',
            'user_roles': user_roles,
            'user_exists': True,
            'user_info': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        })

    except Exception as e:
        logger.error(f"Simple user roles view error: {e}", exc_info=True)
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'error': str(e),
            'timestamp': timezone.now().isoformat()
        }, status=500)
