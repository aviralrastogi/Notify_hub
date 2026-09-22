import requests
from django.conf import settings


def send_whatsapp(to: str, body: str) -> dict:
    """
    Send a WhatsApp message via Meta Cloud API with clear human-readable error messages.
    """
    phone_number_id = (settings.PHONE_NUMBER_ID or '').strip()
    access_token = (settings.WHATSAPP_ACCESS_TOKEN or '').strip()

    if not phone_number_id or not access_token:
        raise ValueError('WhatsApp credentials not configured. Please set PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.')

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
    
    if not response.ok:
        try:
            err_data = response.json().get('error', {})
            err_msg = err_data.get('message', '')
            err_code = err_data.get('code')
            subcode = err_data.get('error_subcode')

            # Expired or invalid token (OAuthException 190)
            if err_code == 190 or subcode == 463 or response.status_code == 401:
                raise ValueError(
                    "WhatsApp Access Token has expired! Please generate a new temporary token from Meta for Developers (WhatsApp > API Setup) and update your WHATSAPP_ACCESS_TOKEN."
                )
            
            # Recipient not in sandbox list
            if err_code == 131030:
                raise ValueError(
                    f"Recipient {to} is not in your Meta WhatsApp sandbox list. Please add this phone number in Meta Developers > WhatsApp > API Setup > Recipient list."
                )

            # 24-hour window policy
            if err_code == 131047:
                raise ValueError(
                    "24-hour conversation window is closed. Send 'Hi' to your Meta test number from WhatsApp first, or set the template text to 'hello_world'."
                )

            raise ValueError(f"WhatsApp Error: {err_msg or response.text}")
        except ValueError:
            raise
        except Exception:
            raise ValueError(f"WhatsApp Error (Status {response.status_code}): {response.text}")

    return response.json()
