from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from .models import Trigger, NotificationTemplate, WebPushSubscription, NotificationLog
from .serializers import (
    TriggerSerializer, NotificationTemplateSerializer,
    WebPushSubscriptionSerializer, NotificationLogSerializer, TestSendSerializer
)
from .services.trigger_dispatcher import fire_trigger
from .services.whatsapp import send_whatsapp
from .services.email_service import send_email
from .services.webpush import send_webpush

User = get_user_model()


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff


class TriggerViewSet(viewsets.ModelViewSet):
    queryset = Trigger.objects.prefetch_related('templates').all()
    serializer_class = TriggerSerializer
    permission_classes = [permissions.IsAdminUser]


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    queryset = NotificationTemplate.objects.select_related('trigger').all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        template = self.get_object()
        template.is_active = not template.is_active
        template.save(update_fields=['is_active'])
        return Response({'is_active': template.is_active})

    @action(detail=True, methods=['post'])
    def test_send(self, request, pk=None):
        template = self.get_object()
        serializer = TestSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        recipient = serializer.validated_data.get('recipient', '')

        try:
            if template.channel == 'whatsapp':
                result = send_whatsapp(
                    to=recipient or request.user.phone_number,
                    body=template.body,
                )
            elif template.channel == 'email':
                result = send_email(
                    to=recipient or request.user.email,
                    subject=template.subject or 'Test Notification',
                    body=template.body,
                )
            elif template.channel == 'webpush':
                target_player_id = recipient.strip() if recipient else ''
                # If user accidentally entered their App ID instead of subscription ID
                if target_player_id and target_player_id == settings.ONESIGNAL_APP_ID:
                    target_player_id = ''
                
                if not target_player_id:
                    # Look up user's active subscription in DB
                    sub = WebPushSubscription.objects.filter(user=request.user).order_by('-created_at').first()
                    if sub:
                        target_player_id = sub.onesignal_player_id
                    else:
                        # Fallback to any active subscription
                        any_sub = WebPushSubscription.objects.order_by('-created_at').first()
                        if any_sub:
                            target_player_id = any_sub.onesignal_player_id

                result = send_webpush(
                    title=template.subject or 'Test Notification',
                    body=template.body,
                    player_id=target_player_id or None,
                )
            else:
                return Response({'error': 'Unknown channel'}, status=400)

            NotificationLog.objects.create(
                template=template,
                trigger_slug=template.trigger.slug,
                channel=template.channel,
                recipient=recipient,
                status='test',
                response=str(result),
            )
            return Response({'success': True, 'result': result})
        except Exception as e:
            NotificationLog.objects.create(
                template=template,
                trigger_slug=template.trigger.slug,
                channel=template.channel,
                recipient=recipient,
                status='failed',
                response=str(e),
            )
            return Response({'success': False, 'error': str(e)}, status=500)


class FireTriggerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        slug = request.data.get('slug')
        if not slug:
            return Response({'error': 'slug required'}, status=400)
        try:
            result = fire_trigger(slug, request.user)
            return Response({'success': True, 'result': result})
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=500)


class WebPushSubscribeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        player_id = request.data.get('player_id')
        if not player_id:
            return Response({'error': 'player_id required'}, status=400)
        sub, created = WebPushSubscription.objects.get_or_create(
            onesignal_player_id=player_id,
            defaults={'user': request.user}
        )
        if not created:
            sub.user = request.user
            sub.save(update_fields=['user'])
        return Response(WebPushSubscriptionSerializer(sub).data, status=201 if created else 200)


class NotificationLogView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        logs = NotificationLog.objects.all()[:100]
        return Response(NotificationLogSerializer(logs, many=True).data)
