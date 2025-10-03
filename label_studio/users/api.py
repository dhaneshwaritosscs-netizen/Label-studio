"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import logging

import drf_yasg.openapi as openapi
from core.permissions import ViewClassPermission, all_permissions
from django.utils.decorators import method_decorator
from drf_yasg.utils import no_body, swagger_auto_schema
from rest_framework import generics, viewsets
from django.db import DatabaseError
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from users.functions import check_avatar
from users.models import User
from users.serializers import UserSerializer, UserSerializerUpdate

logger = logging.getLogger(__name__)

_user_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'id': openapi.Schema(type=openapi.TYPE_INTEGER, description='User ID'),
        'first_name': openapi.Schema(type=openapi.TYPE_STRING, description='First name of the user'),
        'last_name': openapi.Schema(type=openapi.TYPE_STRING, description='Last name of the user'),
        'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username of the user'),
        'email': openapi.Schema(type=openapi.TYPE_STRING, description='Email of the user'),
        'avatar': openapi.Schema(type=openapi.TYPE_STRING, description='Avatar URL of the user'),
        'initials': openapi.Schema(type=openapi.TYPE_STRING, description='Initials of the user'),
        'phone': openapi.Schema(type=openapi.TYPE_STRING, description='Phone number of the user'),
        'allow_newsletters': openapi.Schema(
            type=openapi.TYPE_BOOLEAN, description='Whether the user allows newsletters'
        ),
    },
)


@method_decorator(
    name='update',
    decorator=swagger_auto_schema(
        tags=['Users'],
        x_fern_audiences=['internal'],
        operation_summary='Save user details',
        operation_description="""
    Save details for a specific user, such as their name or contact information, in Label Studio.
    """,
        manual_parameters=[
            openapi.Parameter(name='id', type=openapi.TYPE_INTEGER, in_=openapi.IN_PATH, description='User ID'),
        ],
        request_body=UserSerializer,
    ),
)
@method_decorator(
    name='list',
    decorator=swagger_auto_schema(
        tags=['Users'],
        x_fern_sdk_group_name='users',
        x_fern_sdk_method_name='list',
        x_fern_audiences=['public'],
        operation_summary='List users',
        operation_description='List the users that exist on the Label Studio server.',
    ),
)
@method_decorator(
    name='create',
    decorator=swagger_auto_schema(
        tags=['Users'],
        x_fern_sdk_group_name='users',
        x_fern_sdk_method_name='create',
        x_fern_audiences=['public'],
        operation_summary='Create new user',
        operation_description='Create a user in Label Studio.',
        request_body=_user_schema,
        responses={201: UserSerializer},
    ),
)
@method_decorator(
    name='retrieve',
    decorator=swagger_auto_schema(
        tags=['Users'],
        x_fern_sdk_group_name='users',
        x_fern_sdk_method_name='get',
        x_fern_audiences=['public'],
        operation_summary='Get user info',
        operation_description='Get info about a specific Label Studio user, based on the user ID.',
        manual_parameters=[
            openapi.Parameter(name='id', type=openapi.TYPE_INTEGER, in_=openapi.IN_PATH, description='User ID'),
        ],
        request_body=no_body,
        responses={200: UserSerializer},
    ),
)
@method_decorator(
    name='partial_update',
    decorator=swagger_auto_schema(
        tags=['Users'],
        x_fern_sdk_group_name='users',
        x_fern_sdk_method_name='update',
        x_fern_audiences=['public'],
        operation_summary='Update user details',
        operation_description="""
        Update details for a specific user, such as their name or contact information, in Label Studio.
        """,
        manual_parameters=[
            openapi.Parameter(name='id', type=openapi.TYPE_INTEGER, in_=openapi.IN_PATH, description='User ID'),
        ],
        request_body=_user_schema,
        responses={200: UserSerializer},
    ),
)
@method_decorator(
    name='destroy',
    decorator=swagger_auto_schema(
        tags=['Users'],
        x_fern_sdk_group_name='users',
        x_fern_sdk_method_name='delete',
        x_fern_audiences=['public'],
        operation_summary='Delete user',
        operation_description='Delete a specific Label Studio user.',
        manual_parameters=[
            openapi.Parameter(name='id', type=openapi.TYPE_INTEGER, in_=openapi.IN_PATH, description='User ID'),
        ],
        request_body=no_body,
    ),
)
class UserAPI(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_required = ViewClassPermission(
        GET=all_permissions.organizations_view,
        PUT=all_permissions.organizations_change,
        POST=all_permissions.organizations_view,
        PATCH=all_permissions.organizations_view,
        DELETE=all_permissions.organizations_view,
    )
    http_method_names = ['get', 'post', 'head', 'patch', 'delete']

    def _is_admin(self, user):
        # Check for specific admin email
        if user.email == 'dhaneshwari.tosscss@gmail.com':
            return True
        if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):
            return True
        try:
            from users.role_models import UserRoleAssignment
            # Check for both 'administrator' and 'admin' roles
            return UserRoleAssignment.objects.filter(
                user=user, 
                role__name__in=['administrator', 'admin'], 
                is_active=True
            ).exists()
        except Exception:
            return False
    
    def _is_client(self, user):
        # Check for specific client email
        if user.email == 'dhaneshwari.ttosscss@gmail.com':
            return True
        try:
            from users.role_models import UserRoleAssignment
            # Check for 'client' role
            return UserRoleAssignment.objects.filter(
                user=user, 
                role__name__iexact='client', 
                is_active=True
            ).exists()
        except Exception:
            return False

    def get_queryset(self):
        qs = User.objects.filter(organizations=self.request.user.active_organization)
        if self._is_admin(self.request.user):
            return qs
        try:
            return qs.filter(created_by=self.request.user)
        except DatabaseError:
            return qs

    @swagger_auto_schema(auto_schema=None, methods=['delete', 'post'])
    @action(detail=True, methods=['delete', 'post'], permission_required=all_permissions.avatar_any)
    def avatar(self, request, pk):
        if request.method == 'POST':
            avatar = check_avatar(request.FILES)
            request.user.avatar = avatar
            request.user.save()
            return Response({'detail': 'avatar saved'}, status=200)

        elif request.method == 'DELETE':
            request.user.avatar = None
            request.user.save()
            return Response(status=204)

    def get_serializer_class(self):
        if self.request.method in {'PUT', 'PATCH'}:
            return UserSerializerUpdate
        return super().get_serializer_class()

    def get_serializer_context(self):
        context = super(UserAPI, self).get_serializer_context()
        context['user'] = self.request.user
        return context

    def update(self, request, *args, **kwargs):
        return super(UserAPI, self).update(request, *args, **kwargs)

    def list(self, request, *args, **kwargs):
        return super(UserAPI, self).list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        return super(UserAPI, self).create(request, *args, **kwargs)

    def perform_create(self, serializer):
        from organizations.models import Organization

        extra = {}
        # For clients, tag creator
        if not self._is_admin(self.request.user):
            try:
                extra['created_by'] = self.request.user
            except Exception:
                pass

        instance = serializer.save(**extra)

        # Make sure the user is a member of the current organization so it shows up in memberships API
        org = getattr(self.request.user, 'active_organization', None)
        if org is None:
            try:
                org = Organization.find_by_user(self.request.user)
            except Exception:
                org = None
        if org is not None:
            try:
                org.add_user(instance)
            except Exception:
                pass
            # Ensure the created user has an active_organization set
            if getattr(instance, 'active_organization_id', None) is None:
                instance.active_organization = org
                try:
                    instance.save(update_fields=['active_organization'])
                except Exception:
                    instance.save()

    def retrieve(self, request, *args, **kwargs):
        return super(UserAPI, self).retrieve(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        result = super(UserAPI, self).partial_update(request, *args, **kwargs)

        # throw MethodNotAllowed if read-only fields are attempted to be updated
        read_only_fields = self.get_serializer_class().Meta.read_only_fields
        for field in read_only_fields:
            if field in request.data:
                raise MethodNotAllowed('PATCH', detail=f'Cannot update read-only field: {field}')

        # newsletters
        if 'allow_newsletters' in request.data:
            user = User.objects.get(id=request.user.id)  # we need an updated user
            request.user.advanced_json = {  # request.user instance will be unchanged in request all the time
                'email': user.email,
                'allow_newsletters': user.allow_newsletters,
                'update-notifications': 1,
                'new-user': 0,
            }
        return result

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def create_role_based(self, request):
        """
        Create a user with role-based permissions (Admin can create any, Client can create and sets created_by).
        """
        from organizations.models import Organization, OrganizationMember
        from django.db import transaction
        
        try:
            # Get the first organization
            org = Organization.objects.first()
            if not org:
                return Response(
                    {'error': 'No organization found'}, 
                    status=400
                )
            
            # Extract user data
            email = request.data.get('email', '').strip()
            first_name = request.data.get('first_name', '').strip()
            last_name = request.data.get('last_name', '').strip()
            role = request.data.get('role', 'User').strip()
            
            if not email:
                return Response(
                    {'error': 'Email is required'}, 
                    status=400
                )
            
            # Check if user already exists
            if User.objects.filter(email=email).exists():
                return Response(
                    {'error': 'User with this email already exists'}, 
                    status=400
                )
            
            with transaction.atomic():
                # Create the user
                user_data = {
                    'email': email,
                    'username': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'is_active': True,
                    'active_organization': org,
                }
                
                # Set created_by and role based on user permissions
                if not self._is_admin(request.user):
                    # Client creates user - set created_by to current user and force role to "User"
                    user_data['created_by'] = request.user
                    role = 'User'  # Clients can only create User role
                else:
                    # Admin can create any role - normalize role names
                    if role.lower() == 'admin':
                        role = 'Administrator'
                    elif role.lower() == 'client':
                        role = 'Client'
                    elif role.lower() == 'user':
                        role = 'User'
                
                new_user = User.objects.create(**user_data)
                
                # Assign role to the user
                try:
                    from users.role_models import UserRoleAssignment, Role
                    role_obj, created = Role.objects.get_or_create(name=role)
                    UserRoleAssignment.objects.create(
                        user=new_user,
                        role=role_obj,
                        is_active=True
                    )
                    logger.info(f"Assigned role '{role}' to user {new_user.id}")
                except Exception as e:
                    logger.warning(f"Could not assign role '{role}' to user {new_user.id}: {str(e)}")
                
                # Add user to the organization
                membership, created = OrganizationMember.objects.get_or_create(
                    user=new_user,
                    organization=org,
                    defaults={'deleted_at': None}
                )
                
                logger.info(f"Created user {new_user.id} ({email}) by {request.user.email} and added to organization {org.id}")
                
                return Response({
                    'id': new_user.id,
                    'email': new_user.email,
                    'first_name': new_user.first_name,
                    'last_name': new_user.last_name,
                    'username': new_user.username,
                    'active_organization': org.id,
                    'created_by': new_user.created_by_id,
                    'role': role,
                    'message': 'User created successfully'
                }, status=201)
                
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            return Response(
                {'error': f'Failed to create user: {str(e)}'}, 
                status=500
            )

    @action(detail=False, methods=['get'], permission_classes=[], authentication_classes=[])
    def list_all(self, request):
        """
        List users without authentication (for frontend display) with role-based filtering.
        """
        from organizations.models import OrganizationMember
        
        try:
            # Get pagination parameters
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 10))
            
            # Calculate offset
            offset = (page - 1) * page_size
            
            # Get all memberships first
            memberships_query = OrganizationMember.objects.filter(
                deleted_at__isnull=True
            ).select_related('user', 'organization')
            
            # Apply role-based filtering
            # For now, we'll show all users since we don't have authentication context
            # In a real implementation, you'd check the current user's role here
            # For testing purposes, we'll show all users
            
            # Get total count
            total_count = memberships_query.count()
            
            # Get paginated users with their organization memberships
            memberships = memberships_query.order_by('user__id')[offset:offset + page_size]
            
            users_data = []
            for membership in memberships:
                user = membership.user
                users_data.append({
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'username': user.username,
                        'is_active': user.is_active,
                        'created_by': user.created_by_id,  # Add created_by info
                    },
                    'organization': {
                        'id': membership.organization.id,
                        'title': membership.organization.title,
                    }
                })
            
            return Response({
                'results': users_data,
                'count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size,
                'message': 'Users retrieved successfully'
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error listing users: {str(e)}")
            return Response(
                {'error': f'Failed to list users: {str(e)}'}, 
                status=500
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def list_role_based(self, request):
        """
        List users with role-based filtering (Admin sees all, Client sees only their created users).
        """
        from organizations.models import OrganizationMember
        
        try:
            # Get pagination parameters
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 10))
            search_query = request.GET.get('search', '').strip()
            user_filter = request.GET.get('user_filter', 'All Users').strip()
            
            # Calculate offset
            offset = (page - 1) * page_size
            
            # Get all memberships first
            memberships_query = OrganizationMember.objects.filter(
                deleted_at__isnull=True
            ).select_related('user', 'organization')
            
            # Apply role-based filtering
            if self._is_admin(request.user):
                # Admin sees all users
                filtered_memberships = memberships_query
            else:
                # Client sees only users they created
                filtered_memberships = memberships_query.filter(user__created_by=request.user)
            
            # Apply search filtering if search query is provided
            if search_query:
                from django.db.models import Q
                filtered_memberships = filtered_memberships.filter(
                    Q(user__email__icontains=search_query) |
                    Q(user__first_name__icontains=search_query) |
                    Q(user__last_name__icontains=search_query) |
                    Q(user__username__icontains=search_query)
                )
            
            # Apply user status filtering
            if user_filter == "Active Users":
                from django.utils import timezone
                from datetime import timedelta
                seven_days_ago = timezone.now() - timedelta(days=7)
                
                # Users are active if they have recent activity OR joined recently
                from django.db.models import Q
                filtered_memberships = filtered_memberships.filter(
                    Q(user__last_activity__gte=seven_days_ago) |
                    Q(user__date_joined__gte=seven_days_ago)
                )
            elif user_filter == "Inactive Users":
                from django.utils import timezone
                from datetime import timedelta
                seven_days_ago = timezone.now() - timedelta(days=7)
                
                # Users are inactive if they have old activity AND joined more than 7 days ago
                from django.db.models import Q
                filtered_memberships = filtered_memberships.filter(
                    Q(user__last_activity__lt=seven_days_ago) |
                    Q(user__last_activity__isnull=True, user__date_joined__lt=seven_days_ago)
                )
            
            # Get total count
            total_count = filtered_memberships.count()
            
            # Get paginated users with their organization memberships
            memberships = filtered_memberships.order_by('user__id')[offset:offset + page_size]
            
            users_data = []
            for membership in memberships:
                user = membership.user
                users_data.append({
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'username': user.username,
                        'is_active': user.is_active,
                        'created_by': user.created_by_id,
                        'last_activity': user.last_activity.isoformat() if user.last_activity else None,
                        'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                    },
                    'organization': {
                        'id': membership.organization.id,
                        'title': membership.organization.title,
                    }
                })
            
            return Response({
                'results': users_data,
                'count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size,
                'user_role': 'admin' if self._is_admin(request.user) else 'client',
                'message': 'Users retrieved successfully'
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error listing users: {str(e)}")
            return Response(
                {'error': f'Failed to list users: {str(e)}'}, 
                status=500
            )


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        tags=['Users'],
        x_fern_sdk_group_name='users',
        x_fern_sdk_method_name='reset_token',
        x_fern_audiences=['public'],
        operation_summary='Reset user token',
        operation_description='Reset the user token for the current user.',
        request_body=no_body,
        responses={
            201: openapi.Response(
                description='User token response',
                schema=openapi.Schema(
                    description='User token',
                    type=openapi.TYPE_OBJECT,
                    properties={'token': openapi.Schema(description='Token', type=openapi.TYPE_STRING)},
                ),
            )
        },
    ),
)
class UserResetTokenAPI(APIView):
    parser_classes = (JSONParser, FormParser, MultiPartParser)
    queryset = User.objects.all()
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        token = user.reset_token()
        logger.debug(f'New token for user {user.pk} is {token.key}')
        return Response({'token': token.key}, status=201)


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['Users'],
        x_fern_sdk_group_name='users',
        x_fern_sdk_method_name='get_token',
        x_fern_audiences=['public'],
        operation_summary='Get user token',
        operation_description='Get a user token to authenticate to the API as the current user.',
        request_body=no_body,
        responses={
            200: openapi.Response(
                description='User token response',
                schema=openapi.Schema(
                    description='User token',
                    type=openapi.TYPE_OBJECT,
                    properties={'detail': openapi.Schema(description='Token', type=openapi.TYPE_STRING)},
                ),
            )
        },
    ),
)
class UserGetTokenAPI(APIView):
    parser_classes = (JSONParser,)
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        user = request.user
        token = Token.objects.get(user=user)
        return Response({'token': str(token)}, status=200)


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['Users'],
        x_fern_sdk_group_name='users',
        x_fern_sdk_method_name='whoami',
        x_fern_audiences=['public'],
        operation_summary='Retrieve my user',
        operation_description='Retrieve details of the account that you are using to access the API.',
        request_body=no_body,
        responses={200: UserSerializer},
    ),
)
class UserWhoAmIAPI(generics.RetrieveAPIView):
    parser_classes = (JSONParser, FormParser, MultiPartParser)
    queryset = User.objects.all()
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get(self, request, *args, **kwargs):
        return super(UserWhoAmIAPI, self).get(request, *args, **kwargs)

@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        tags=['Users'],
        operation_summary='Send email notification',
        operation_description='Send email notification to a user',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'to': openapi.Schema(type=openapi.TYPE_STRING, description='Recipient email address'),
                'subject': openapi.Schema(type=openapi.TYPE_STRING, description='Email subject'),
                'message': openapi.Schema(type=openapi.TYPE_STRING, description='Email message content'),
            },
            required=['to', 'subject', 'message']
        ),
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={'success': openapi.Schema(type=openapi.TYPE_BOOLEAN)},
            ),
            400: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={'error': openapi.Schema(type=openapi.TYPE_STRING)},
            ),
        },
    ),
)
class SendEmailAPI(APIView):
    """
    API view for sending email notifications
    """
    parser_classes = (JSONParser,)
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        """
        Send email notification
        """
        try:
            to_email = request.data.get('to')
            subject = request.data.get('subject')
            message = request.data.get('message')
            
            if not to_email or not subject or not message:
                return Response(
                    {'error': 'Missing required fields: to, subject, message'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Send email using Django's send_mail
            from django.core.mail import send_mail
            from django.conf import settings
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                fail_silently=False,
            )
            
            logger.info(f"Email sent successfully to {to_email}")
            
            return Response(
                {'success': True, 'message': f'Email sent successfully to {to_email}'},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return Response(
                {'error': f'Failed to send email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

