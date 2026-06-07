"""
Перевірка Cloudflare Turnstile-токена на стороні сервера.
Якщо TURNSTILE_SECRET_KEY не задано — перевірка пропускається (м'яке вимикання).
"""
import requests
from django.conf import settings


VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'


def verify_turnstile(token: str, remote_ip: str = '') -> bool:
    """Повертає True якщо токен валідний або ключ не налаштований."""
    secret = getattr(settings, 'TURNSTILE_SECRET_KEY', '')
    if not secret:
        return True  # опційний режим — без ключа captcha вимкнена

    if not token:
        return False

    try:
        resp = requests.post(
            VERIFY_URL,
            data={'secret': secret, 'response': token, 'remoteip': remote_ip},
            timeout=5,
        )
        data = resp.json()
        return bool(data.get('success'))
    except Exception:
        # мережева помилка — fail-open (не ламаємо форми через збій Cloudflare)
        return True
