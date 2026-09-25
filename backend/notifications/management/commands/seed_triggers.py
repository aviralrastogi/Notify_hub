from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from notifications.models import Trigger, NotificationTemplate

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed default notification triggers, templates, and admin user'

    def handle(self, *args, **options):
        # 1. Ensure admin user exists with is_staff=True
        admin_user, created = User.objects.get_or_create(username='admin', defaults={'email': 'admin@notifyhub.com'})
        admin_user.set_password('admin123')
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        self.stdout.write(self.style.SUCCESS('Admin user ready (admin / admin123)'))

        # 2. Seed triggers
        triggers = [
            {'name': 'Login', 'slug': 'login', 'description': 'User signs in on the website'},
            {'name': 'Logout', 'slug': 'logout', 'description': 'User signs out'},
            {'name': 'Not logged in 1 day', 'slug': 'inactive_1d', 'description': 'User has not visited for 24 hours'},
            {'name': 'Not logged in 1 week', 'slug': 'inactive_1w', 'description': 'User has not visited for 7 days'},
        ]
        default_templates = {
            'whatsapp': 'Hello {{username}}, this is a notification from NotifyHub for {{trigger}}.',
            'email': 'Hi {{username}},\n\nThis is an automated notification regarding: {{trigger}}.\n\nBest regards,\nNotifyHub Team',
            'webpush': 'NotifyHub: {{trigger}} event detected for {{username}}'
        }
        for t in triggers:
            obj, created = Trigger.objects.get_or_create(slug=t['slug'], defaults=t)
            for channel, body in default_templates.items():
                subject = f"NotifyHub: {obj.name}" if channel == 'email' else ''
                NotificationTemplate.objects.get_or_create(
                    trigger=obj,
                    channel=channel,
                    defaults={'body': body, 'subject': subject, 'is_active': True}
                )
            self.stdout.write(self.style.SUCCESS(f'Trigger and templates ready: {t["name"]}'))
        self.stdout.write(self.style.SUCCESS('Seeding complete.'))

