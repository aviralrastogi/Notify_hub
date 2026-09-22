from django.core.management.base import BaseCommand
from notifications.models import Trigger


class Command(BaseCommand):
    help = 'Seed default notification triggers'

    def handle(self, *args, **options):
        triggers = [
            {'name': 'Login', 'slug': 'login', 'description': 'User signs in on the website'},
            {'name': 'Logout', 'slug': 'logout', 'description': 'User signs out'},
            {'name': 'Not logged in 1 day', 'slug': 'inactive_1d', 'description': 'User has not visited for 24 hours'},
            {'name': 'Not logged in 1 week', 'slug': 'inactive_1w', 'description': 'User has not visited for 7 days'},
        ]
        for t in triggers:
            obj, created = Trigger.objects.get_or_create(slug=t['slug'], defaults=t)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created trigger: {t["name"]}'))
            else:
                self.stdout.write(f'Trigger already exists: {t["name"]}')
        self.stdout.write(self.style.SUCCESS('Done.'))
