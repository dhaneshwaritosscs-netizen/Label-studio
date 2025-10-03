from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Check if a user has a password set'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of the user to check')

    def handle(self, *args, **options):
        email = options['email']
        
        try:
            user = User.objects.get(email=email)
            self.stdout.write(f"User found: {user.email}")
            self.stdout.write(f"Has usable password: {user.has_usable_password()}")
            self.stdout.write(f"Password field: {user.password}")
            self.stdout.write(f"Created by: {user.created_by}")
            self.stdout.write(f"Is active: {user.is_active}")
            
            if user.has_usable_password():
                self.stdout.write(self.style.WARNING("User already has a password set"))
            else:
                self.stdout.write(self.style.SUCCESS("User has no password - can complete signup"))
                
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"User with email {email} does not exist"))
