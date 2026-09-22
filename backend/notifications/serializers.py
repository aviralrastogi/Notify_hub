from rest_framework import serializers
from .models import Trigger, NotificationTemplate, WebPushSubscription, NotificationLog


class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = ['id', 'trigger', 'channel', 'subject', 'body', 'is_active', 'created_at', 'updated_at']


class TriggerSerializer(serializers.ModelSerializer):
    templates = NotificationTemplateSerializer(many=True, read_only=True)

    class Meta:
        model = Trigger
        fields = ['id', 'name', 'slug', 'description', 'templates', 'created_at']


class WebPushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebPushSubscription
        fields = ['id', 'onesignal_player_id', 'created_at']


class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = '__all__'


class TestSendSerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=['whatsapp', 'email', 'webpush'])
    recipient = serializers.CharField(required=False, allow_blank=True, help_text='Phone/email/player_id')
