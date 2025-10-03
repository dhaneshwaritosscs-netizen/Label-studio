from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Reset a user password to allow signup completion'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of the user to reset')
        parser.add_argument('--confirm', action='store_true', help='Confirm the reset operation')

    def handle(self, *args, **options):
        email = options['email']
        confirm = options['confirm']
        
        try:
            user = User.objects.get(email=email)
            self.stdout.write(f"User found: {user.email}")
            self.stdout.write(f"Current password status: {user.has_usable_password()}")
            
            if not confirm:
                self.stdout.write(self.style.WARNING("Use --confirm flag to actually reset the password"))
                return
                
            # Clear the password field to allow signup
            user.password = ''
            user.save()
            
            self.stdout.write(self.style.SUCCESS(f"Password reset for user {email}"))
            self.stdout.write("User can now complete signup process")
                
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"User with email {email} does not exist"))
