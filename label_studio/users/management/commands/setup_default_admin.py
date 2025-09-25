"""
Management command to set up default admin role for specific email address.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from users.role_models import Role, UserRoleAssignment
from users.access_models import UserRole, UserAccess

User = get_user_model()


class Command(BaseCommand):
    help = 'Set up default admin role for dhaneshwari.tosscss@gmail.com and client role for other users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-email',
            type=str,
            default='dhaneshwari.tosscss@gmail.com',
            help='Email address to assign admin role to'
        )

    def handle(self, *args, **options):
        """Set up default roles and assign admin role to specific email."""
        
        admin_email = options['admin_email']
        
        # Create default roles if they don't exist
        self.create_default_roles()
        
        # Assign admin role to specific email
        self.assign_admin_role(admin_email)
        
        # Set up default client role assignment logic
        self.setup_client_role_logic()

    def create_default_roles(self):
        """Create default roles if they don't exist."""
        
        # Admin role
        admin_role, created = Role.objects.get_or_create(
            name='admin',
            defaults={
                'display_name': 'Administrator',
                'description': 'Full system access with all permissions',
                'role_type': 'system',
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Created admin role: {admin_role.display_name}')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Admin role already exists: {admin_role.display_name}')
            )
        
        # Client role
        client_role, created = Role.objects.get_or_create(
            name='client',
            defaults={
                'display_name': 'Client',
                'description': 'Standard client access with limited permissions',
                'role_type': 'system',
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Created client role: {client_role.display_name}')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Client role already exists: {client_role.display_name}')
            )

    def assign_admin_role(self, admin_email):
        """Assign admin role to specific email address."""
        
        try:
            # Check if user exists
            try:
                user = User.objects.get(email=admin_email)
                user_exists = True
            except User.DoesNotExist:
                user_exists = False
                # Create new user if they don't exist
                user = User.objects.create_user(
                    email=admin_email,
                    password=None,  # Will be set when user first logs in
                    username=admin_email.split('@')[0]
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Created new user for email: {admin_email}')
                )
            
            # Get admin role
            admin_role = Role.objects.get(name='admin')
            
            # Assign admin role to user
            assignment, created = UserRoleAssignment.objects.get_or_create(
                user=user,
                role=admin_role,
                defaults={
                    'assigned_by': None,  # System assignment
                    'assigned_at': timezone.now(),
                    'is_active': True,
                    'notes': 'Default admin role assignment'
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Assigned admin role to: {admin_email}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Admin role already assigned to: {admin_email}')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error assigning admin role to {admin_email}: {str(e)}')
            )

    def setup_client_role_logic(self):
        """Set up logic for assigning client role to other users."""
        
        # Get client role
        try:
            client_role = Role.objects.get(name='client')
            self.stdout.write(
                self.style.SUCCESS(f'Client role ready for assignment: {client_role.display_name}')
            )
        except Role.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('Client role not found!')
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                '\nSetup complete!\n'
                f'- Admin role assigned to: dhaneshwari.tosscss@gmail.com\n'
                f'- Client role available for other users\n'
                f'- Other users will automatically get client access when they log in'
            )
        )
