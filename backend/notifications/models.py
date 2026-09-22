from django.db import models
from django.conf import settings


class Trigger(models.Model):
    name = models.CharField(max_length=100)  # e.g. "Login"
    slug = models.SlugField(unique=True)     # e.g. "login"
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class NotificationTemplate(models.Model):
    CHANNEL_CHOICES = [
        ('whatsapp', 'WhatsApp'),
        ('email', 'Email'),
        ('webpush', 'Web Push'),
    ]

    trigger = models.ForeignKey(Trigger, on_delete=models.CASCADE, related_name='templates')
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    subject = models.CharField(max_length=255, blank=True)  # email subject
    body = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('trigger', 'channel')]
        ordering = ['trigger', 'channel']

    def __str__(self):
        return f"{self.trigger.name} - {self.channel}"


class WebPushSubscription(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='push_subscriptions'
    )
    onesignal_player_id = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.onesignal_player_id[:20]}"


class NotificationLog(models.Model):
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('test', 'Test'),
    ]
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True)
    trigger_slug = models.CharField(max_length=100)
    channel = models.CharField(max_length=20)
    recipient = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    response = models.TextField(blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f"{self.trigger_slug}/{self.channel} → {self.status}"
