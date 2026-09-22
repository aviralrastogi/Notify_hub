import requests
from django.conf import settings


def _auth_header(api_key: str) -> str:
    if api_key.startswith('Key '):
        return api_key
    return f'Key {api_key}'


def send_webpush(title: str, body: str, player_id: str = None, segment: str = None) -> dict:
    """
    Send a Web Push notification via OneSignal REST API with clear human-readable error messages.
    """
    app_id = settings.ONESIGNAL_APP_ID
    api_key = settings.ONESIGNAL_REST_API_KEY

    if not app_id or not api_key:
        raise ValueError('OneSignal credentials not configured. Please set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY.')

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
        payload['included_segments'] = ['Total Subscriptions']

    response = requests.post(url, json=payload, headers=headers, timeout=15)

    if not response.ok:
        try:
            err_data = response.json()
            err_list = err_data.get('errors', [])
            err_str = ', '.join(err_list) if isinstance(err_list, list) else str(err_list)

            if response.status_code == 401 or 'invalid' in err_str.lower() or 'unauthorized' in err_str.lower():
                raise ValueError("OneSignal REST API Key is invalid. Please check ONESIGNAL_REST_API_KEY in environment variables.")

            raise ValueError(f"Web Push Error: {err_str or response.text}")
        except ValueError:
            raise
        except Exception:
            raise ValueError(f"Web Push Error (Status {response.status_code}): {response.text}")

    data = response.json()
    errors = data.get('errors', [])
    if errors:
        err_str = ', '.join(errors) if isinstance(errors, list) else str(errors)
        if 'All included players are not subscribed' in err_str:
            raise ValueError("No devices currently subscribed to Web Push. Please open your Dashboard and click 'Enable Push Notifications' first!")
        raise ValueError(f"Web Push Warning: {err_str}")

    return data
