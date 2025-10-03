"""
Management command to delete all projects from client users except admin user.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from projects.models import Project
from users.role_models import Role, UserRoleAssignment
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Delete all projects from client users except admin user (dhaneshwari.tosscss@gmail.com)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-email',
            type=str,
            default='dhaneshwari.tosscss@gmail.com',
            help='Email address of admin user whose projects should be preserved'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion (required for actual deletion)'
        )

    def handle(self, *args, **options):
        """Delete projects from client users while preserving admin projects."""
        
        admin_email = options['admin_email']
        dry_run = options['dry_run']
        confirm = options['confirm']
        
        self.stdout.write(
            self.style.WARNING(
                f'Starting project deletion process...\n'
                f'Admin email to preserve: {admin_email}\n'
                f'Dry run: {dry_run}\n'
                f'Confirmed: {confirm}'
            )
        )
        
        # Safety check
        if not dry_run and not confirm:
            self.stdout.write(
                self.style.ERROR(
                    'ERROR: This command will permanently delete projects!\n'
                    'Use --dry-run to see what would be deleted first.\n'
                    'Use --confirm to actually perform the deletion.'
                )
            )
            return
        
        try:
            # Get admin user
            admin_user = self.get_admin_user(admin_email)
            
            # Get all client users (users with client role or users who are not admin)
            client_users = self.get_client_users(admin_user)
            
            # Get projects to delete
            projects_to_delete = self.get_projects_to_delete(client_users)
            
            # Show summary
            self.show_deletion_summary(admin_user, client_users, projects_to_delete)
            
            if dry_run:
                self.stdout.write(
                    self.style.SUCCESS('DRY RUN COMPLETE - No projects were actually deleted')
                )
                return
            
            # Perform actual deletion
            if confirm:
                self.perform_deletion(projects_to_delete)
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during deletion process: {str(e)}')
            )
            logger.error(f'Error in delete_client_projects command: {str(e)}')

    def get_admin_user(self, admin_email):
        """Get the admin user."""
        try:
            admin_user = User.objects.get(email=admin_email)
            self.stdout.write(
                self.style.SUCCESS(f'Found admin user: {admin_user.email} (ID: {admin_user.id})')
            )
            return admin_user
        except User.DoesNotExist:
            raise Exception(f'Admin user with email {admin_email} not found!')

    def get_client_users(self, admin_user):
        """Get all client users (users who are not the admin)."""
        
        # Get all users except the admin user
        client_users = User.objects.exclude(email=admin_user.email)
        
        self.stdout.write(
            self.style.SUCCESS(f'Found {client_users.count()} client users')
        )
        
        return client_users

    def get_projects_to_delete(self, client_users):
        """Get all projects created by client users."""
        
        # Get projects created by client users
        projects_to_delete = Project.objects.filter(
            created_by__in=client_users
        ).select_related('created_by', 'organization')
        
        self.stdout.write(
            self.style.SUCCESS(f'Found {projects_to_delete.count()} projects to delete')
        )
        
        return projects_to_delete

    def show_deletion_summary(self, admin_user, client_users, projects_to_delete):
        """Show summary of what will be deleted."""
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write('DELETION SUMMARY')
        self.stdout.write('='*60)
        
        # Admin user info
        admin_projects = Project.objects.filter(created_by=admin_user)
        self.stdout.write(
            f'ADMIN USER (PRESERVED): {admin_user.email}\n'
            f'  - User ID: {admin_user.id}\n'
            f'  - Projects created: {admin_projects.count()}\n'
            f'  - Status: PRESERVED ✅'
        )
        
        # Client users info
        self.stdout.write(f'\nCLIENT USERS (PROJECTS WILL BE DELETED):')
        for user in client_users[:10]:  # Show first 10 users
            user_projects = Project.objects.filter(created_by=user)
            self.stdout.write(
                f'  - {user.email} (ID: {user.id}) - Projects: {user_projects.count()}'
            )
        
        if client_users.count() > 10:
            self.stdout.write(f'  ... and {client_users.count() - 10} more client users')
        
        # Projects to delete
        self.stdout.write(f'\nPROJECTS TO DELETE: {projects_to_delete.count()}')
        for project in projects_to_delete[:10]:  # Show first 10 projects
            self.stdout.write(
                f'  - Project ID: {project.id} - "{project.title}" - Created by: {project.created_by.email}'
            )
        
        if projects_to_delete.count() > 10:
            self.stdout.write(f'  ... and {projects_to_delete.count() - 10} more projects')
        
        self.stdout.write('='*60)

    def perform_deletion(self, projects_to_delete):
        """Perform the actual deletion of projects."""
        
        self.stdout.write(
            self.style.WARNING('Starting project deletion...')
        )
        
        deleted_count = 0
        error_count = 0
        
        with transaction.atomic():
            for project in projects_to_delete:
                try:
                    project_title = project.title
                    project_creator = project.created_by.email
                    project_id = project.id
                    
                    # Delete the project (this will cascade to related objects)
                    project.delete()
                    
                    deleted_count += 1
                    self.stdout.write(
                        f'  ✅ Deleted project "{project_title}" (ID: {project_id}) by {project_creator}'
                    )
                    
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(
                            f'  ❌ Error deleting project {project.id}: {str(e)}'
                        )
                    )
                    logger.error(f'Error deleting project {project.id}: {str(e)}')
        
        # Final summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write('DELETION COMPLETE')
        self.stdout.write('='*60)
        self.stdout.write(f'Projects successfully deleted: {deleted_count}')
        if error_count > 0:
            self.stdout.write(f'Errors encountered: {error_count}')
        self.stdout.write('='*60)
        
        if deleted_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully deleted {deleted_count} projects from client users!'
                )
            )
        
        if error_count > 0:
            self.stdout.write(
                self.style.ERROR(
                    f'Encountered {error_count} errors during deletion. Check logs for details.'
                )
            )
