from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.role_models import Role, UserRoleAssignment
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Fix role assignments for users created through signup'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
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
        
        self.stdout.write(f'Created/found roles: User, Client, Administrator')
        
        # Find users without any role assignments
        users_without_roles = User.objects.filter(
            userroleassignment__isnull=True
        ).exclude(email='dhaneshwari.tosscss@gmail.com')
        
        self.stdout.write(f'Found {users_without_roles.count()} users without role assignments')
        
        # Find users with only User role (likely created through signup)
        users_with_user_role = User.objects.filter(
            userroleassignment__role__name='User',
            userroleassignment__is_active=True
        ).exclude(email='dhaneshwari.tosscss@gmail.com')
        
        self.stdout.write(f'Found {users_with_user_role.count()} users with User role')
        
        # Assign Client role to users without roles or with only User role
        users_to_fix = users_without_roles.union(users_with_user_role).distinct()
        
        self.stdout.write(f'Total users to fix: {users_to_fix.count()}')
        
        for user in users_to_fix:
            self.stdout.write(f'Processing user: {user.email}')
            
            if not dry_run:
                # Remove existing User role assignments
                UserRoleAssignment.objects.filter(user=user, role__name='User').delete()
                
                # Assign Client role
                UserRoleAssignment.objects.get_or_create(
                    user=user,
                    role=client_role,
                    defaults={
                        'assigned_by': None,
                        'assigned_at': timezone.now(),
                        'is_active': True,
                        'notes': 'Fixed role assignment for signup user'
                    }
                )
                
                self.stdout.write(self.style.SUCCESS(f'✓ Assigned Client role to {user.email}'))
            else:
                self.stdout.write(f'  Would assign Client role to {user.email}')
        
        if not dry_run:
            self.stdout.write(self.style.SUCCESS(f'Successfully fixed roles for {users_to_fix.count()} users'))
        else:
            self.stdout.write(self.style.WARNING('Dry run completed. Use without --dry-run to apply changes'))
