"""
Tests for Role Assignment API
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from .role_models import Role, UserRoleAssignment

User = get_user_model()


class RoleAssignmentAPITestCase(APITestCase):
    """Test cases for Role Assignment API"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='admin@example.com',
            password='testpass123',
            username='admin'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        
        # Create test roles
        self.role1 = Role.objects.create(
            name='labeling-interface',
            display_name='Labeling Interface',
            description='Access to labeling tools and interface',
            created_by=self.user
        )
        self.role2 = Role.objects.create(
            name='annotation',
            display_name='Annotation',
            description='Create and manage annotations',
            created_by=self.user
        )
    
    def test_assign_roles_to_existing_user(self):
        """Test assigning roles to an existing user"""
        # Create a test user
        test_user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            username='testuser'
        )
        
        url = reverse('role-assignment')
        data = {
            'email': 'test@example.com',
            'selected_roles': ['labeling-interface', 'annotation']
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['user']['email'], 'test@example.com')
        self.assertEqual(len(response.data['assigned_roles']), 2)
        
        # Verify role assignments were created
        assignments = UserRoleAssignment.objects.filter(user=test_user, is_active=True)
        self.assertEqual(assignments.count(), 2)
    
    def test_assign_roles_to_new_user(self):
        """Test assigning roles to a new user (creates user)"""
        url = reverse('role-assignment')
        data = {
            'email': 'newuser@example.com',
            'selected_roles': ['labeling-interface']
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['user']['email'], 'newuser@example.com')
        self.assertFalse(response.data['user']['user_exists'])
        
        # Verify user was created
        new_user = User.objects.get(email='newuser@example.com')
        self.assertIsNotNone(new_user)
        
        # Verify role assignment was created
        assignment = UserRoleAssignment.objects.get(user=new_user, role=self.role1)
        self.assertTrue(assignment.is_active)
    
    def test_assign_roles_invalid_email(self):
        """Test assigning roles with invalid email"""
        url = reverse('role-assignment')
        data = {
            'email': 'invalid-email',
            'selected_roles': ['labeling-interface']
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_assign_roles_no_roles_selected(self):
        """Test assigning roles with no roles selected"""
        url = reverse('role-assignment')
        data = {
            'email': 'test@example.com',
            'selected_roles': []
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_assign_roles_invalid_role(self):
        """Test assigning roles with invalid role"""
        url = reverse('role-assignment')
        data = {
            'email': 'test@example.com',
            'selected_roles': ['invalid-role']
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_assign_roles_unauthorized(self):
        """Test assigning roles without authentication"""
        self.client.credentials()  # Remove authentication
        
        url = reverse('role-assignment')
        data = {
            'email': 'test@example.com',
            'selected_roles': ['labeling-interface']
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RoleModelTestCase(TestCase):
    """Test cases for Role models"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='admin@example.com',
            password='testpass123',
            username='admin'
        )
    
    def test_create_role(self):
        """Test creating a role"""
        role = Role.objects.create(
            name='test-role',
            display_name='Test Role',
            description='A test role',
            created_by=self.user
        )
        
        self.assertEqual(role.name, 'test-role')
        self.assertEqual(role.display_name, 'Test Role')
        self.assertTrue(role.is_active)
        self.assertEqual(role.created_by, self.user)
    
    def test_role_str_representation(self):
        """Test role string representation"""
        role = Role.objects.create(
            name='test-role',
            display_name='Test Role',
            created_by=self.user
        )
        
        expected_str = "Test Role (test-role)"
        self.assertEqual(str(role), expected_str)
    
    def test_user_role_assignment(self):
        """Test user role assignment"""
        role = Role.objects.create(
            name='test-role',
            display_name='Test Role',
            created_by=self.user
        )
        
        test_user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            username='testuser'
        )
        
        assignment = UserRoleAssignment.objects.create(
            user=test_user,
            role=role,
            assigned_by=self.user
        )
        
        self.assertEqual(assignment.user, test_user)
        self.assertEqual(assignment.role, role)
        self.assertEqual(assignment.assigned_by, self.user)
        self.assertTrue(assignment.is_active)
    
    def test_revoke_role_assignment(self):
        """Test revoking a role assignment"""
        role = Role.objects.create(
            name='test-role',
            display_name='Test Role',
            created_by=self.user
        )
        
        test_user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            username='testuser'
        )
        
        assignment = UserRoleAssignment.objects.create(
            user=test_user,
            role=role,
            assigned_by=self.user
        )
        
        # Revoke the assignment
        assignment.revoke(revoked_by=self.user)
        
        self.assertFalse(assignment.is_active)
        self.assertIsNotNone(assignment.revoked_at)
        self.assertEqual(assignment.revoked_by, self.user)
