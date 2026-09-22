from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'

    def ready(self):
        import sys
        # Don't start scheduler during management commands (migrate, shell, etc.)
        # Only start when actually running the web server
        if 'runserver' in sys.argv or 'gunicorn' in sys.argv[0] if sys.argv else False:
            from .scheduler import start_scheduler
            start_scheduler()
