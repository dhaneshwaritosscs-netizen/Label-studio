"""
Management command to set up default project settings access templates.
"""

from django.core.management.base import BaseCommand
from users.project_settings_access import SettingsAccessTemplate


class Command(BaseCommand):
    help = 'Set up default project settings access templates'

    def handle(self, *args, **options):
        """Create default templates if they don't exist."""
        
        default_templates = [
            {
                'name': 'Annotator Access',
                'template_type': 'annotator',
                'description': 'Standard access for annotators - can view most settings but limited write access',
                'general_access': 'read',
                'labeling_interface_access': 'read',
                'annotation_access': 'write',
                'model_access': 'read',
                'predictions_access': 'read',
                'cloud_storage_access': 'read',
                'webhooks_access': 'none',
                'danger_zone_access': 'none',
            },
            {
                'name': 'Manager Access',
                'template_type': 'manager',
                'description': 'Manager access - can modify most settings except danger zone',
                'general_access': 'write',
                'labeling_interface_access': 'write',
                'annotation_access': 'write',
                'model_access': 'write',
                'predictions_access': 'write',
                'cloud_storage_access': 'write',
                'webhooks_access': 'write',
                'danger_zone_access': 'read',
            },
            {
                'name': 'Viewer Access',
                'template_type': 'viewer',
                'description': 'Read-only access for viewing project settings',
                'general_access': 'read',
                'labeling_interface_access': 'read',
                'annotation_access': 'read',
                'model_access': 'read',
                'predictions_access': 'read',
                'cloud_storage_access': 'read',
                'webhooks_access': 'read',
                'danger_zone_access': 'none',
            },
            {
                'name': 'Admin Access',
                'template_type': 'admin',
                'description': 'Full administrative access to all project settings',
                'general_access': 'admin',
                'labeling_interface_access': 'admin',
                'annotation_access': 'admin',
                'model_access': 'admin',
                'predictions_access': 'admin',
                'cloud_storage_access': 'admin',
                'webhooks_access': 'admin',
                'danger_zone_access': 'admin',
            },
            {
                'name': 'Guest Access',
                'template_type': 'guest',
                'description': 'Limited access for temporary or guest users',
                'general_access': 'read',
                'labeling_interface_access': 'read',
                'annotation_access': 'read',
                'model_access': 'none',
                'predictions_access': 'none',
                'cloud_storage_access': 'none',
                'webhooks_access': 'none',
                'danger_zone_access': 'none',
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for template_data in default_templates:
            template, created = SettingsAccessTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults={
                    'template_type': template_data['template_type'],
                    'description': template_data['description'],
                    'general_access': template_data['general_access'],
                    'labeling_interface_access': template_data['labeling_interface_access'],
                    'annotation_access': template_data['annotation_access'],
                    'model_access': template_data['model_access'],
                    'predictions_access': template_data['predictions_access'],
                    'cloud_storage_access': template_data['cloud_storage_access'],
                    'webhooks_access': template_data['webhooks_access'],
                    'danger_zone_access': template_data['danger_zone_access'],
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created template: {template.name}')
                )
            else:
                # Update existing template if needed
                needs_update = False
                for field, value in template_data.items():
                    if field not in ['name'] and getattr(template, field) != value:
                        setattr(template, field, value)
                        needs_update = True
                
                if needs_update:
                    template.is_active = True
                    template.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'Updated template: {template.name}')
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(f'Template already exists: {template.name}')
                    )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSetup complete! Created {created_count} templates, updated {updated_count} templates.'
            )
        )








