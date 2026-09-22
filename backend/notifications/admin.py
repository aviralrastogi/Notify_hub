from django.contrib import admin
from .models import Trigger, NotificationTemplate, WebPushSubscription, NotificationLog


@admin.register(Trigger)
class TriggerAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'description', 'created_at']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['trigger', 'channel', 'is_active', 'updated_at']
    list_filter = ['channel', 'is_active', 'trigger']
    list_editable = ['is_active']


@admin.register(WebPushSubscription)
class WebPushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'onesignal_player_id', 'created_at']


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ['trigger_slug', 'channel', 'recipient', 'status', 'sent_at']
    list_filter = ['channel', 'status']
    readonly_fields = ['sent_at']
