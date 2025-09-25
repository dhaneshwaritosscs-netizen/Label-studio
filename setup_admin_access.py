#!/usr/bin/env python
"""
Script to set up admin access for dhaneshwari.tosscss@gmail.com
and client access for other users.
"""

import os
import sys
import django

# Add the project directory to Python path
project_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_dir)

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'label_studio.settings.label_studio')
django.setup()

from django.core.management import call_command

def setup_admin_access():
    """Set up admin access for specific email and client access for others."""
    
    print("Setting up role-based access system...")
    print("=" * 50)
    
    try:
        # Run the management command to set up default admin
        call_command('setup_default_admin', admin_email='dhaneshwari.tosscss@gmail.com')
        
        print("\n" + "=" * 50)
        print("✅ Setup completed successfully!")
        print("\nRole Assignment Summary:")
        print("- dhaneshwari.tosscss@gmail.com → ADMIN access")
        print("- All other users → CLIENT access")
        print("\nUsers will automatically get their assigned roles when they log in.")
        
    except Exception as e:
        print(f"❌ Error during setup: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    success = setup_admin_access()
    sys.exit(0 if success else 1)
