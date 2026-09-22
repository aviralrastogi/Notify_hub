import threading
from django.conf import settings
from ..models import Trigger, NotificationTemplate, NotificationLog, WebPushSubscription
from .whatsapp import send_whatsapp
from .email_service import send_email
from .webpush import send_webpush


def _send_notification(template, user):
    """Send a single channel notification to a user."""
    try:
        if template.channel == 'whatsapp':
            phone = getattr(user, 'phone_number', '') or ''
            if not phone:
                return
            result = send_whatsapp(to=phone, body=template.body)
        elif template.channel == 'email':
            email = getattr(user, 'email', '') or ''
            if not email:
                return
            result = send_email(
                to=email,
                subject=template.subject or template.trigger.name,
                body=template.body,
            )
        elif template.channel == 'webpush':
            # Send to all subscriptions for this user
            subs = WebPushSubscription.objects.filter(user=user)
            for sub in subs:
                send_webpush(
                    title=template.subject or template.trigger.name,
                    body=template.body,
                    player_id=sub.onesignal_player_id,
                )
            result = f'sent to {subs.count()} subscriptions'
        else:
            return

        NotificationLog.objects.create(
            template=template,
            trigger_slug=template.trigger.slug,
            channel=template.channel,
            recipient=getattr(user, 'email', '') or '',
            status='sent',
            response=str(result),
        )
    except Exception as e:
        NotificationLog.objects.create(
            template=template,
            trigger_slug=template.trigger.slug if template.trigger else '',
            channel=template.channel,
            recipient='',
            status='failed',
            response=str(e),
        )
        print(f'Notification error [{template.channel}]: {e}')


def fire_trigger(slug, user):
    """Fire all active templates for a trigger slug for a user."""
    try:
        trigger = Trigger.objects.get(slug=slug)
    except Trigger.DoesNotExist:
        print(f'Trigger not found: {slug}')
        return {}

    templates = NotificationTemplate.objects.filter(trigger=trigger, is_active=True)
    results = {}
    for template in templates:
        # Send in a background thread to not block the request
        t = threading.Thread(target=_send_notification, args=(template, user), daemon=True)
        t.start()
        results[template.channel] = 'queued'

    return results
