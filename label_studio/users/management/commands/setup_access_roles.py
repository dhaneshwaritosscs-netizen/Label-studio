"""
Management command to set up default user access roles.
"""

from django.core.management.base import BaseCommand
from users.access_models import UserRole


class Command(BaseCommand):
    help = 'Set up default user access roles'

    def handle(self, *args, **options):
        """Create default roles if they don't exist."""
        
        default_roles = [
            {
                'name': 'admin',
                'display_name': 'Administrator',
                'description': 'Full system access with all permissions',
                'permissions': {
                    'can_create_projects': True,
                    'can_delete_projects': True,
                    'can_manage_users': True,
                    'can_assign_roles': True,
                    'can_access_admin': True,
                    'can_view_all_data': True,
                    'can_export_data': True,
                    'can_import_data': True,
                    'can_manage_organizations': True,
                    'can_access_api': True,
                }
            },
            {
                'name': 'manager',
                'display_name': 'Manager',
                'description': 'Project management and user coordination',
                'permissions': {
                    'can_create_projects': True,
                    'can_delete_projects': False,
                    'can_manage_users': False,
                    'can_assign_roles': False,
                    'can_access_admin': False,
                    'can_view_all_data': True,
                    'can_export_data': True,
                    'can_import_data': True,
                    'can_manage_organizations': False,
                    'can_access_api': True,
                }
            },
            {
                'name': 'annotator',
                'display_name': 'Annotator',
                'description': 'Can create annotations and work on projects',
                'permissions': {
                    'can_create_projects': False,
                    'can_delete_projects': False,
                    'can_manage_users': False,
                    'can_assign_roles': False,
                    'can_access_admin': False,
                    'can_view_all_data': False,
                    'can_export_data': False,
                    'can_import_data': False,
                    'can_manage_organizations': False,
                    'can_access_api': True,
                    'can_create_annotations': True,
                    'can_edit_annotations': True,
                    'can_delete_own_annotations': True,
                }
            },
            {
                'name': 'viewer',
                'display_name': 'Viewer',
                'description': 'Read-only access to view projects and data',
                'permissions': {
                    'can_create_projects': False,
                    'can_delete_projects': False,
                    'can_manage_users': False,
                    'can_assign_roles': False,
                    'can_access_admin': False,
                    'can_view_all_data': False,
                    'can_export_data': False,
                    'can_import_data': False,
                    'can_manage_organizations': False,
                    'can_access_api': False,
                    'can_view_projects': True,
                    'can_view_annotations': True,
                }
            },
            {
                'name': 'guest',
                'display_name': 'Guest',
                'description': 'Limited access for temporary users',
                'permissions': {
                    'can_create_projects': False,
                    'can_delete_projects': False,
                    'can_manage_users': False,
                    'can_assign_roles': False,
                    'can_access_admin': False,
                    'can_view_all_data': False,
                    'can_export_data': False,
                    'can_import_data': False,
                    'can_manage_organizations': False,
                    'can_access_api': False,
                    'can_view_limited_projects': True,
                }
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for role_data in default_roles:
            role, created = UserRole.objects.get_or_create(
                name=role_data['name'],
                defaults={
                    'display_name': role_data['display_name'],
                    'description': role_data['description'],
                    'permissions': role_data['permissions'],
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created role: {role.display_name}')
                )
            else:
                # Update existing role if needed
                if (role.display_name != role_data['display_name'] or 
                    role.description != role_data['description'] or 
                    role.permissions != role_data['permissions']):
                    
                    role.display_name = role_data['display_name']
                    role.description = role_data['description']
                    role.permissions = role_data['permissions']
                    role.is_active = True
                    role.save()
                    
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'Updated role: {role.display_name}')
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(f'Role already exists: {role.display_name}')
                    )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSetup complete! Created {created_count} roles, updated {updated_count} roles.'
            )
        )








