from datetime import timedelta
from django.utils import timezone
from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore


def check_inactive_users():
    """Check for users who haven't logged in and fire inactive triggers."""
    try:
        from django.contrib.auth import get_user_model
        from .services.trigger_dispatcher import fire_trigger

        User = get_user_model()
        now = timezone.now()

        one_day_ago = now - timedelta(days=1)
        one_week_ago = now - timedelta(days=7)

        # Users inactive for exactly 1 day (between 24h and 25h ago)
        users_1d = User.objects.filter(
            last_active__lte=one_day_ago,
            last_active__gte=one_day_ago - timedelta(hours=1),
        )
        for user in users_1d:
            fire_trigger('inactive_1d', user)

        # Users inactive for exactly 1 week (between 7 and 7.041 days ago)
        users_1w = User.objects.filter(
            last_active__lte=one_week_ago,
            last_active__gte=one_week_ago - timedelta(hours=1),
        )
        for user in users_1w:
            fire_trigger('inactive_1w', user)

    except Exception as e:
        print(f'Scheduler error: {e}')


def start_scheduler():
    try:
        scheduler = BackgroundScheduler()
        scheduler.add_jobstore(DjangoJobStore(), 'default')
        scheduler.add_job(
            check_inactive_users,
            trigger='interval',
            hours=1,
            id='check_inactive_users',
            replace_existing=True,
        )
        scheduler.start()
        print('APScheduler started.')
    except Exception as e:
        print(f'Scheduler start error: {e}')
