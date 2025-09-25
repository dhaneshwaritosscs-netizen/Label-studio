"""
Test admin access to all projects
"""
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from projects.models import Project
from organizations.models import Organization

User = get_user_model()


class AdminProjectAccessTest(TestCase):
    """Test that admin users can access and edit any project"""
    
    def setUp(self):
        """Set up test data"""
        # Create organization
        self.organization = Organization.objects.create(
            title="Test Organization"
        )
        
        # Create admin user (staff)
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            is_staff=True
        )
        self.admin_user.active_organization = self.organization
        self.admin_user.save()
        
        # Create client user (non-staff)
        self.client_user = User.objects.create_user(
            email='client@test.com',
            password='testpass123',
            is_staff=False
        )
        self.client_user.active_organization = self.organization
        self.client_user.save()
        
        # Create another client user
        self.client_user2 = User.objects.create_user(
            email='client2@test.com',
            password='testpass123',
            is_staff=False
        )
        self.client_user2.active_organization = self.organization
        self.client_user2.save()
        
        # Create projects
        self.admin_project = Project.objects.create(
            title="Admin Project",
            description="Created by admin",
            organization=self.organization,
            created_by=self.admin_user
        )
        
        self.client_project = Project.objects.create(
            title="Client Project",
            description="Created by client",
            organization=self.organization,
            created_by=self.client_user
        )
        
        self.client2_project = Project.objects.create(
            title="Client 2 Project",
            description="Created by client 2",
            organization=self.organization,
            created_by=self.client_user2
        )
        
        self.api_client = APIClient()
    
    def test_admin_can_view_all_projects(self):
        """Test that admin can view all projects in organization"""
        self.api_client.force_authenticate(user=self.admin_user)
        
        # Admin should be able to view any project
        for project in [self.admin_project, self.client_project, self.client2_project]:
            url = reverse('api:projects:project-detail', kwargs={'pk': project.pk})
            response = self.api_client.get(url)
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['id'], project.id)
            self.assertEqual(response.data['title'], project.title)
    
    def test_admin_can_edit_any_project(self):
        """Test that admin can edit any project, including those created by clients"""
        self.api_client.force_authenticate(user=self.admin_user)
        
        # Admin should be able to edit client's project
        url = reverse('api:projects:project-detail', kwargs={'pk': self.client_project.pk})
        data = {
            'title': 'Updated by Admin',
            'description': 'Admin updated this client project'
        }
        
        response = self.api_client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated by Admin')
        self.assertEqual(response.data['description'], 'Admin updated this client project')
        
        # Verify in database
        self.client_project.refresh_from_db()
        self.assertEqual(self.client_project.title, 'Updated by Admin')
        self.assertEqual(self.client_project.description, 'Admin updated this client project')
    
    def test_client_cannot_edit_other_client_project(self):
        """Test that client users cannot edit projects created by other clients"""
        self.api_client.force_authenticate(user=self.client_user)
        
        # Client should not be able to edit another client's project
        url = reverse('api:projects:project-detail', kwargs={'pk': self.client2_project.pk})
        data = {
            'title': 'Unauthorized Edit Attempt',
            'description': 'This should fail'
        }
        
        response = self.api_client.patch(url, data, format='json')
        
        # Should return 404 (not found) because queryset filters out projects not owned by user
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_client_can_edit_own_project(self):
        """Test that client users can edit their own projects"""
        self.api_client.force_authenticate(user=self.client_user)
        
        # Client should be able to edit their own project
        url = reverse('api:projects:project-detail', kwargs={'pk': self.client_project.pk})
        data = {
            'title': 'Updated by Owner',
            'description': 'Client updated their own project'
        }
        
        response = self.api_client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated by Owner')
        self.assertEqual(response.data['description'], 'Client updated their own project')
        
        # Verify in database
        self.client_project.refresh_from_db()
        self.assertEqual(self.client_project.title, 'Updated by Owner')
        self.assertEqual(self.client_project.description, 'Client updated their own project')
    
    def test_client_cannot_view_other_client_project(self):
        """Test that client users cannot view projects created by other clients"""
        self.api_client.force_authenticate(user=self.client_user)
        
        # Client should not be able to view another client's project
        url = reverse('api:projects:project-detail', kwargs={'pk': self.client2_project.pk})
        response = self.api_client.get(url)
        
        # Should return 404 because queryset filters out projects not owned by user
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_admin_can_delete_any_project(self):
        """Test that admin can delete any project"""
        self.api_client.force_authenticate(user=self.admin_user)
        
        # Create a temporary project for deletion test
        temp_project = Project.objects.create(
            title="Temp Project",
            description="For deletion test",
            organization=self.organization,
            created_by=self.client_user2
        )
        
        # Admin should be able to delete any project
        url = reverse('api:projects:project-detail', kwargs={'pk': temp_project.pk})
        response = self.api_client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify project is deleted
        with self.assertRaises(Project.DoesNotExist):
            Project.objects.get(pk=temp_project.pk)
    
    def test_client_cannot_delete_other_client_project(self):
        """Test that client users cannot delete projects created by other clients"""
        self.api_client.force_authenticate(user=self.client_user)
        
        # Client should not be able to delete another client's project
        url = reverse('api:projects:project-detail', kwargs={'pk': self.client2_project.pk})
        response = self.api_client.delete(url)
        
        # Should return 404 because queryset filters out projects not owned by user
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Verify project still exists
        self.assertTrue(Project.objects.filter(pk=self.client2_project.pk).exists())


class AdminRoleProjectAccessTest(TestCase):
    """Test admin access using custom role system"""
    
    def setUp(self):
        """Set up test data with custom roles"""
        # Create organization
        self.organization = Organization.objects.create(
            title="Test Organization"
        )
        
        # Create admin user with custom role (not staff)
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            is_staff=False  # Not Django staff, but has admin role
        )
        self.admin_user.active_organization = self.organization
        self.admin_user.save()
        
        # Create client user
        self.client_user = User.objects.create_user(
            email='client@test.com',
            password='testpass123',
            is_staff=False
        )
        self.client_user.active_organization = self.organization
        self.client_user.save()
        
        # Create roles and assignments if role system is available
        try:
            from users.role_models import Role, UserRoleAssignment
            
            # Create admin role
            self.admin_role, created = Role.objects.get_or_create(
                name='admin',
                defaults={
                    'display_name': 'Administrator',
                    'description': 'Full access admin role',
                    'role_type': 'system'
                }
            )
            
            # Assign admin role to admin user
            UserRoleAssignment.objects.get_or_create(
                user=self.admin_user,
                role=self.admin_role,
                defaults={'is_active': True}
            )
            
            self.role_system_available = True
        except ImportError:
            self.role_system_available = False
        
        # Create projects
        self.client_project = Project.objects.create(
            title="Client Project",
            description="Created by client",
            organization=self.organization,
            created_by=self.client_user
        )
        
        self.api_client = APIClient()
    
    @pytest.mark.skipif(not hasattr(User, 'role_assignments'), 
                       reason="Custom role system not available")
    def test_custom_admin_role_can_edit_any_project(self):
        """Test that users with admin role (not Django staff) can edit any project"""
        if not self.role_system_available:
            self.skipTest("Custom role system not available")
            
        self.api_client.force_authenticate(user=self.admin_user)
        
        # Admin role user should be able to edit client's project
        url = reverse('api:projects:project-detail', kwargs={'pk': self.client_project.pk})
        data = {
            'title': 'Updated by Role Admin',
            'description': 'Role-based admin updated this project'
        }
        
        response = self.api_client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated by Role Admin')
        
        # Verify in database
        self.client_project.refresh_from_db()
        self.assertEqual(self.client_project.title, 'Updated by Role Admin')
