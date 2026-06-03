"""Signal: при створенні НОВОЇ опублікованої події — web-push підписникам теми «events»."""
import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Event

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Event)
def notify_subscribers_on_event(sender, instance: Event, created, **kwargs):
    if not created or not instance.is_published:
        return
    try:
        from main.push import send_to_topic
        from django.utils.html import strip_tags

        body = strip_tags(instance.description or '')[:120]
        send_to_topic(
            'events',
            title=f'📅 {instance.title}',
            body=body or f'Нова подія: {instance.start_date.strftime("%d.%m.%Y")}',
            url='/events',
        )
    except Exception as e:
        logger.error('Не вдалось надіслати push про подію: %s', e)
