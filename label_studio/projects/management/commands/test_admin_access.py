"""
Management command to test admin access to projects
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from projects.models import Project
from organizations.models import Organization

User = get_user_model()


class Command(BaseCommand):
    help = 'Test admin access to projects created by other users'

    def add_arguments(self, parser):
        parser.add_argument('--admin-email', type=str, help='Admin user email')
        parser.add_argument('--client-email', type=str, help='Client user email')

    def handle(self, *args, **options):
        admin_email = options.get('admin_email', 'admin@test.com')
        client_email = options.get('client_email', 'client@test.com')
        
        self.stdout.write(self.style.SUCCESS('Testing admin project access fix...'))
        
        # Get or create organization
        org, created = Organization.objects.get_or_create(
            title="Test Organization"
        )
        
        # Get or create admin user (staff)
        admin_user, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                'is_staff': True,
                'active_organization': org
            }
        )
        if not admin_user.is_staff:
            admin_user.is_staff = True
            admin_user.save()
        
        # Get or create client user
        client_user, created = User.objects.get_or_create(
            email=client_email,
            defaults={
                'is_staff': False,
                'active_organization': org
            }
        )
        
        # Create a test project owned by client
        project, created = Project.objects.get_or_create(
            title="Client Test Project",
            defaults={
                'description': 'Test project created by client',
                'organization': org,
                'created_by': client_user
            }
        )
        
        self.stdout.write(f"Created/found project: {project.title} (ID: {project.id})")
        self.stdout.write(f"Project owner: {project.created_by.email}")
        self.stdout.write(f"Admin user: {admin_user.email} (is_staff: {admin_user.is_staff})")
        
        # Test the queryset logic from ProjectAPI
        from projects.api import ProjectAPI
        
        # Simulate request for admin user
        class MockRequest:
            def __init__(self, user):
                self.user = user
                self.query_params = {}
        
        # Test admin access
        api_view = ProjectAPI()
        api_view.request = MockRequest(admin_user)
        
        admin_queryset = api_view.get_queryset()
        admin_can_access = admin_queryset.filter(id=project.id).exists()
        
        self.stdout.write(f"Admin can access client project: {admin_can_access}")
        
        # Test client access to their own project
        api_view.request = MockRequest(client_user)
        client_queryset = api_view.get_queryset()
        client_can_access = client_queryset.filter(id=project.id).exists()
        
        self.stdout.write(f"Client can access their own project: {client_can_access}")
        
        # Test admin role checking
        is_admin = api_view._is_user_admin()
        self.stdout.write(f"Client user detected as admin: {is_admin}")
        
        api_view.request = MockRequest(admin_user)
        is_admin = api_view._is_user_admin()
        self.stdout.write(f"Admin user detected as admin: {is_admin}")
        
        if admin_can_access and client_can_access and is_admin:
            self.stdout.write(self.style.SUCCESS('✅ Fix is working correctly!'))
            self.stdout.write(self.style.SUCCESS('- Admin can access any project'))
            self.stdout.write(self.style.SUCCESS('- Client can access their own project'))
            self.stdout.write(self.style.SUCCESS('- Admin role detection is working'))
        else:
            self.stdout.write(self.style.ERROR('❌ Fix needs adjustment'))
            if not admin_can_access:
                self.stdout.write(self.style.ERROR('- Admin cannot access client project'))
            if not client_can_access:
                self.stdout.write(self.style.ERROR('- Client cannot access their own project'))
            if not is_admin:
                self.stdout.write(self.style.ERROR('- Admin role detection failed'))
        
        self.stdout.write('')
        self.stdout.write('To test the API endpoint directly:')
        self.stdout.write(f'curl -H "Authorization: Token <admin-token>" http://localhost:8010/api/projects/{project.id}/')
        self.stdout.write(f'curl -X PATCH -H "Authorization: Token <admin-token>" -H "Content-Type: application/json" \\')
        self.stdout.write(f'  -d \'{{"title": "Updated by Admin", "description": "Admin updated this"}}\' \\')
        self.stdout.write(f'  http://localhost:8010/api/projects/{project.id}/')
