"""
Signal handlers for user management
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from .role_models import Role, UserRoleAssignment

User = get_user_model()


@receiver(post_save, sender=User)
def assign_default_role_to_new_user(sender, instance, created, **kwargs):
    """
    Automatically assign appropriate role to new users when they are created.
    Skip if user is the admin email or if role is already assigned via API.
    """
    if created and instance.email != 'dhaneshwari.tosscss@gmail.com':
        # Skip if role is already assigned (e.g., via API)
        if UserRoleAssignment.objects.filter(user=instance, is_active=True).exists():
            return
            
        try:
            # Create default roles if they don't exist
            user_role, _ = Role.objects.get_or_create(
                name='User',
                defaults={
                    'display_name': 'User',
                    'description': 'Regular user role',
                    'role_type': 'system',
                    'is_active': True
                }
            )
            
            client_role, _ = Role.objects.get_or_create(
                name='Client',
                defaults={
                    'display_name': 'Client',
                    'description': 'Client user role',
                    'role_type': 'system',
                    'is_active': True
                }
            )
            
            admin_role, _ = Role.objects.get_or_create(
                name='Administrator',
                defaults={
                    'display_name': 'Administrator',
                    'description': 'Administrator role',
                    'role_type': 'system',
                    'is_active': True
                }
            )
            
            # For signup-created users, assign Client role by default
            # This ensures they have access to Assign Role page
            UserRoleAssignment.objects.get_or_create(
                user=instance,
                role=client_role,
                defaults={
                    'assigned_by': None,  # System assignment
                    'assigned_at': timezone.now(),
                    'is_active': True,
                    'notes': 'Default Client role assignment for signup user'
                }
            )
            
        except Exception as e:
            # Log error but don't fail user creation
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error assigning default role to user {instance.email}: {str(e)}')
