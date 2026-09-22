import requests
from django.conf import settings


def send_whatsapp(to: str, body: str) -> dict:
    """
    Send a WhatsApp message via Meta Cloud API.
    `to` should be a phone number in international format, e.g. '919876543210'
    (no + prefix for the API).
    """
    phone_number_id = settings.PHONE_NUMBER_ID
    access_token = settings.WHATSAPP_ACCESS_TOKEN

    if not phone_number_id or not access_token:
        raise ValueError('WhatsApp credentials not configured (PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN)')

    # Normalize: remove + if present
    to = to.lstrip('+')

    url = f'https://graph.facebook.com/v17.0/{phone_number_id}/messages'
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
    }
    clean_body = body.strip().lower()
    if clean_body in ('hello_world', 'helloworld', 'hello world'):
        payload = {
            'messaging_product': 'whatsapp',
            'to': to,
            'type': 'template',
            'template': {
                'name': 'hello_world',
                'language': {'code': 'en_US'},
            },
        }
    else:
        payload = {
            'messaging_product': 'whatsapp',
            'to': to,
            'type': 'text',
            'text': {'body': body},
        }

    response = requests.post(url, json=payload, headers=headers, timeout=15)
    response.raise_for_status()
    return response.json()
