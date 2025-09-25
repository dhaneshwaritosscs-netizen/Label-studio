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
    Automatically assign client role to new users when they are created.
    Skip if user is the admin email.
    """
    if created and instance.email != 'dhaneshwari.tosscss@gmail.com':
        try:
            # Get client role
            client_role = Role.objects.get(name='client')
            
            # Assign client role to new user
            UserRoleAssignment.objects.get_or_create(
                user=instance,
                role=client_role,
                defaults={
                    'assigned_by': None,  # System assignment
                    'assigned_at': timezone.now(),
                    'is_active': True,
                    'notes': 'Default client role assignment for new user'
                }
            )
            
        except Role.DoesNotExist:
            # Client role doesn't exist yet, skip assignment
            pass
        except Exception as e:
            # Log error but don't fail user creation
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error assigning default role to user {instance.email}: {str(e)}')
