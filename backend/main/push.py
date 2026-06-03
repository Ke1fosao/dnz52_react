"""
Утиліти для відправки Web-Push сповіщень через pywebpush + VAPID.
"""
import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def _vapid_claims():
    email = getattr(settings, 'VAPID_ADMIN_EMAIL', '') or 'admin@example.com'
    return {'sub': f'mailto:{email}'}


def send_push(subscription, payload: dict) -> bool:
    """Надсилає одне push-сповіщення. Повертає True якщо успішно.
    При помилці 404/410 (підписка мертва) — деактивує її.
    """
    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.warning('pywebpush не встановлено — push не надіслано')
        return False

    private_key = getattr(settings, 'VAPID_PRIVATE_KEY', '')
    if not private_key:
        logger.warning('VAPID_PRIVATE_KEY не задано — push вимкнено')
        return False

    sub_info = {
        'endpoint': subscription.endpoint,
        'keys': {'p256dh': subscription.p256dh, 'auth': subscription.auth},
    }

    try:
        webpush(
            subscription_info=sub_info,
            data=json.dumps(payload),
            vapid_private_key=private_key,
            vapid_claims=_vapid_claims(),
            timeout=10,
        )
        return True
    except WebPushException as e:
        status = getattr(e.response, 'status_code', None)
        if status in (404, 410):
            # Підписка більше не дійсна — деактивуємо
            subscription.is_active = False
            subscription.save(update_fields=['is_active'])
            logger.info('Push-підписку %s деактивовано (HTTP %s)', subscription.pk, status)
        else:
            logger.error('Помилка push для %s: %s', subscription.pk, e)
        return False
    except Exception as e:
        logger.error('Несподівана помилка push: %s', e)
        return False


def send_to_all(title: str, body: str, url: str = '/news') -> int:
    """Надсилає сповіщення всім активним підписникам. Повертає кількість успішних."""
    from .models import PushSubscription

    payload = {'title': title, 'body': body, 'url': url, 'icon': '/pwa-192.png'}
    sent = 0
    for sub in PushSubscription.objects.filter(is_active=True):
        if send_push(sub, payload):
            sent += 1
    logger.info('Push надіслано %s підписникам', sent)
    return sent


def send_to_topic(topic: str, title: str, body: str, url: str = '/') -> int:
    """Надсилає лише тим, хто підписаний на тему `topic`.
    Підписки з порожнім списком тем отримують усі сповіщення (зворотна сумісність).
    """
    from .models import PushSubscription

    payload = {'title': title, 'body': body, 'url': url, 'icon': '/pwa-192.png'}
    sent = 0
    for sub in PushSubscription.objects.filter(is_active=True):
        topics = sub.topics or []
        if topics and topic not in topics:
            continue
        if send_push(sub, payload):
            sent += 1
    logger.info('Push (тема «%s») надіслано %s підписникам', topic, sent)
    return sent
