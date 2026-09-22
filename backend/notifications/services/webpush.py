import requests
from django.conf import settings


def _auth_header(api_key: str) -> str:
    if api_key.startswith('Key '):
        return api_key
    return f'Key {api_key}'


def send_webpush(title: str, body: str, player_id: str = None, segment: str = None) -> dict:
    """
    Send a Web Push notification via OneSignal REST API.
    player_id is the Web SDK v16 PushSubscription.id (subscription UUID).
    """
    app_id = settings.ONESIGNAL_APP_ID
    api_key = settings.ONESIGNAL_REST_API_KEY

    if not app_id or not api_key:
        raise ValueError('OneSignal credentials not configured (ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY)')

    url = 'https://api.onesignal.com/notifications'
    headers = {
        'Authorization': _auth_header(api_key),
        'Content-Type': 'application/json',
    }
    payload = {
        'app_id': app_id,
        'target_channel': 'push',
        'headings': {'en': title},
        'contents': {'en': body},
    }

    if player_id:
        payload['include_subscription_ids'] = [player_id]
    elif segment:
        payload['included_segments'] = [segment]
    else:
        payload['included_segments'] = ['All']

    response = requests.post(url, json=payload, headers=headers, timeout=15)
    response.raise_for_status()
    return response.json()
