import requests
from django.conf import settings


def send_email(to: str, subject: str, body: str) -> dict:
    """
    Send an email via Brevo (Sendinblue) transactional API with clear human-readable error messages.
    """
    api_key = settings.BREVO_API_KEY
    from_email = settings.BREVO_FROM_EMAIL
    from_name = getattr(settings, 'BREVO_FROM_NAME', 'Notification System')

    if not api_key or not from_email:
        raise ValueError('Email credentials not configured. Please set BREVO_API_KEY and BREVO_FROM_EMAIL.')

    url = 'https://api.brevo.com/v3/smtp/email'
    headers = {
        'api-key': api_key,
        'Content-Type': 'application/json',
    }
    payload = {
        'sender': {'name': from_name, 'email': from_email},
        'to': [{'email': to}],
        'subject': subject,
        'htmlContent': f'<p>{body}</p>',
        'textContent': body,
    }

    response = requests.post(url, json=payload, headers=headers, timeout=15)

    if not response.ok:
        try:
            err_data = response.json()
            err_msg = err_data.get('message', '')

            if response.status_code == 401 or 'unauthorized' in err_msg.lower():
                raise ValueError("Brevo API Key is invalid or expired. Please check your BREVO_API_KEY in environment variables.")

            if 'sender' in err_msg.lower() or 'not verified' in err_msg.lower():
                raise ValueError(f"Sender email '{from_email}' is not verified in Brevo. Please verify it in Brevo Senders settings.")

            raise ValueError(f"Email Error: {err_msg or response.text}")
        except ValueError:
            raise
        except Exception:
            raise ValueError(f"Email Error (Status {response.status_code}): {response.text}")

    return response.json()
