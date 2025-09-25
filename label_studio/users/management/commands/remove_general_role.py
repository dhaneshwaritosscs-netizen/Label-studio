from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.role_models import Role, UserRoleAssignment

User = get_user_model()

class Command(BaseCommand):
    help = 'Remove general role from all users except specified admin email'

    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-email',
            type=str,
            default='dhaneshwari.tosscss@gmail.com',
            help='Email of admin user to keep general role (default: dhaneshwari.tosscss@gmail.com)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be removed without actually removing'
        )

    def handle(self, *args, **options):
        admin_email = options['admin_email']
        dry_run = options['dry_run']
        
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

        # Get all general role assignments except for admin
        general_assignments = UserRoleAssignment.objects.filter(
            role=general_role
        ).exclude(user=admin_user)

        total_assignments = general_assignments.count()
        
        if total_assignments == 0:
            self.stdout.write(self.style.SUCCESS("No general role assignments found to remove"))
            return

        self.stdout.write(f"\nFound {total_assignments} general role assignments to remove:")
        
        # Show users who will be affected
        for assignment in general_assignments:
            self.stdout.write(f"  - User: {assignment.user.email} (ID: {assignment.user.id})")
        
        if dry_run:
            self.stdout.write(self.style.WARNING(f"\nDRY RUN: Would remove {total_assignments} general role assignments"))
            self.stdout.write("Run without --dry-run to actually remove the assignments")
            return

        # Confirm before proceeding
        confirm = input(f"\nAre you sure you want to remove general role from {total_assignments} users? (yes/no): ")
        if confirm.lower() != 'yes':
            self.stdout.write("Operation cancelled")
            return

        # Remove the assignments
        removed_count = general_assignments.delete()[0]
        
        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully removed general role from {removed_count} users"))
        self.stdout.write(f"Admin user {admin_email} still has general role")
        
        # Verify admin still has the role
        admin_has_general = UserRoleAssignment.objects.filter(
            user=admin_user,
            role=general_role
        ).exists()
        
        if admin_has_general:
            self.stdout.write(self.style.SUCCESS("✓ Admin user still has general role"))
        else:
            self.stdout.write(self.style.ERROR("✗ Admin user does not have general role!"))
