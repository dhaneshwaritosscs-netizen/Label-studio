from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.role_models import Role, UserRoleAssignment

User = get_user_model()

class Command(BaseCommand):
    help = 'Assign general role to admin user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-email',
            type=str,
            default='dhaneshwari.tosscss@gmail.com',
            help='Email of admin user to assign general role (default: dhaneshwari.tosscss@gmail.com)'
        )

    def handle(self, *args, **options):
        admin_email = options['admin_email']
        
        try:
            # Get the general role
            general_role = Role.objects.get(name='general')
            self.stdout.write(f"Found general role: {general_role.name} (ID: {general_role.id})")
        except Role.DoesNotExist:
            self.stdout.write(self.style.WARNING("General role does not exist in database"))
            return

        # Get admin user
        try:
            admin_user = User.objects.get(email=admin_email)
            self.stdout.write(f"Found admin user: {admin_user.email} (ID: {admin_user.id})")
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Admin user with email {admin_email} not found"))
            return

        # Assign general role to admin
        assignment, created = UserRoleAssignment.objects.get_or_create(
            user=admin_user,
            role=general_role,
            defaults={
                'assigned_by': admin_user,
                'assigned_at': 'now',
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f"Successfully assigned general role to {admin_email}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"General role already assigned to {admin_email}"))
