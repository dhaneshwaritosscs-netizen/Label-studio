"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import logging
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.models import User
from organizations.models import Organization, OrganizationMember
from core.permissions import all_permissions
from core.utils.common import load_func

logger = logging.getLogger(__name__)

ViewClassPermission = load_func('core.permissions.ViewClassPermission')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user_with_membership(request):
    """
    Create a new user and add them to the current user's active organization.
    This ensures the user appears in the Manage Users list.
    """
    try:
        # Get the current user's active organization
        current_user = request.user
        active_org = current_user.active_organization
        
        if not active_org:
            return Response(
                {'error': 'No active organization found for current user'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract user data from request
        email = request.data.get('email', '').strip()
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Create the user
            user_data = {
                'email': email,
                'username': email,  # Use email as username
                'first_name': first_name,
                'last_name': last_name,
                'is_active': True,
            }
            
            # Set created_by for non-admin users
            if not (current_user.is_superuser or current_user.is_staff):
                user_data['created_by'] = current_user
            
            new_user = User.objects.create(**user_data)
            
            # Add user to the active organization
            membership, created = OrganizationMember.objects.get_or_create(
                user=new_user,
                organization=active_org,
                defaults={'deleted_at': None}
            )
            
            # Set the user's active organization
            new_user.active_organization = active_org
            new_user.save(update_fields=['active_organization'])
            
            logger.info(f"Created user {new_user.id} ({email}) and added to organization {active_org.id}")
            
            return Response({
                'id': new_user.id,
                'email': new_user.email,
                'first_name': new_user.first_name,
                'last_name': new_user.last_name,
                'username': new_user.username,
                'active_organization': active_org.id,
                'created_by': new_user.created_by_id,
                'message': 'User created successfully'
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        return Response(
            {'error': f'Failed to create user: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user_with_permission_check(request, user_id):
    """
    Delete a user with proper permission checks.
    Admin can delete any user, Client can only delete users they created.
    """
    try:
        current_user = request.user
        target_user = User.objects.get(id=user_id)
        
        # Check permissions
        is_admin = current_user.is_superuser or current_user.is_staff
        is_creator = target_user.created_by_id == current_user.id
        
        if not (is_admin or is_creator):
            return Response(
                {'error': 'You do not have permission to delete this user'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        with transaction.atomic():
            # Soft delete organization memberships
            OrganizationMember.objects.filter(user=target_user).update(
                deleted_at=timezone.now()
            )
            
            # Delete the user
            target_user.delete()
            
            logger.info(f"Deleted user {user_id} by {current_user.id}")
            
            return Response(
                {'message': 'User deleted successfully'}, 
                status=status.HTTP_200_OK
            )
            
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {str(e)}")
        return Response(
            {'error': f'Failed to delete user: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
