"""
Signal: при публікації НОВОЇ новини — надіслати web-push усім підписникам.
"""
import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import News

logger = logging.getLogger(__name__)


@receiver(post_save, sender=News)
def notify_subscribers_on_news(sender, instance: News, created, **kwargs):
    # Тільки для НОВИХ опублікованих новин (не при редагуванні)
    if not created or not instance.is_published:
        return
    try:
        from main.push import send_to_topic
        from django.utils.html import strip_tags

        body = strip_tags(instance.content or '')[:120]
        send_to_topic(
            'news',
            title=f'📰 {instance.title}',
            body=body or 'Нова новина у ЗДО №52',
            url=f'/news/{instance.slug}',
        )
    except Exception as e:
        # Не валимо збереження новини якщо push не вдався
        logger.error('Не вдалось надіслати push про новину: %s', e)
