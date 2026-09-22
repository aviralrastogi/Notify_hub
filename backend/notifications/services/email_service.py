import requests
from django.conf import settings


def send_email(to: str, subject: str, body: str) -> dict:
    """
    Send an email via Brevo (Sendinblue) transactional API.
    https://developers.brevo.com/reference/sendtransacemail
    """
    api_key = settings.BREVO_API_KEY
    from_email = settings.BREVO_FROM_EMAIL
    from_name = getattr(settings, 'BREVO_FROM_NAME', 'Notification System')

    if not api_key or not from_email:
        raise ValueError('Brevo credentials not configured (BREVO_API_KEY, BREVO_FROM_EMAIL)')

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
    response.raise_for_status()
    return response.json()
