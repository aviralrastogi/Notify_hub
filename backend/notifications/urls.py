from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TriggerViewSet, NotificationTemplateViewSet,
    FireTriggerView, WebPushSubscribeView, NotificationLogView, ConfigStatusView
)

router = DefaultRouter()
router.register(r'triggers', TriggerViewSet, basename='trigger')
router.register(r'templates', NotificationTemplateViewSet, basename='template')

urlpatterns = [
    path('', include(router.urls)),
    path('fire-trigger/', FireTriggerView.as_view(), name='fire-trigger'),
    path('webpush/subscribe/', WebPushSubscribeView.as_view(), name='webpush-subscribe'),
    path('logs/', NotificationLogView.as_view(), name='notification-logs'),
    path('config-status/', ConfigStatusView.as_view(), name='config-status'),
]
