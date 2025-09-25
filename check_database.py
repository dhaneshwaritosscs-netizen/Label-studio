#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'label_studio.settings')
django.setup()

from django.db import connection

def check_role_tables():
    """Check if role tables exist in the database"""
    cursor = connection.cursor()
    
    # Check for role-related tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%role%';")
    role_tables = cursor.fetchall()
    
    print("=== Role Tables in Database ===")
    if role_tables:
        for table in role_tables:
            print(f"✓ {table[0]}")
    else:
        print("No role tables found")
    
    # Check all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    all_tables = cursor.fetchall()
    
    print("\n=== All Tables in Database ===")
    for table in all_tables:
        print(f"- {table[0]}")
    
    # Check if we can import the role models
    try:
        from users.role_models import Role, UserRoleAssignment, RolePermission, RoleAssignmentLog
        print("\n=== Role Models Import ===")
        print("✓ Role model imported successfully")
        print("✓ UserRoleAssignment model imported successfully")
        print("✓ RolePermission model imported successfully")
        print("✓ RoleAssignmentLog model imported successfully")
        
        # Try to create a test role
        test_role = Role.objects.create(
            name='test-role',
            display_name='Test Role',
            description='A test role for verification',
            role_type='custom'
        )
        print(f"✓ Test role created with ID: {test_role.id}")
        
        # Clean up test role
        test_role.delete()
        print("✓ Test role deleted")
        
    except Exception as e:
        print(f"\n❌ Error importing role models: {e}")

if __name__ == "__main__":
    check_role_tables()
