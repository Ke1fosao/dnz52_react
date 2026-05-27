"""Декілька зразкових подій щоб календар не був порожній одразу після деплою."""

from datetime import datetime, timedelta
from django.db import migrations
from django.utils import timezone
from django.utils.text import slugify


def seed(apps, schema_editor):
    Event = apps.get_model('events', 'Event')
    now = timezone.now().replace(second=0, microsecond=0)

    samples = [
        {
            'title':      'День відкритих дверей',
            'event_type': 'open_door',
            'days_from_now': 7,
            'time':       (10, 0),
            'description': '<p>Запрошуємо майбутніх вихованців та їхніх батьків '
                            'познайомитися з нашим закладом, побачити групи, поспілкуватися '
                            'з педагогами. Захід триватиме приблизно 2 години.</p>',
        },
        {
            'title':      'Батьківські збори (середні групи)',
            'event_type': 'meeting',
            'days_from_now': 14,
            'time':       (18, 0),
            'description': '<p>Підсумкові батьківські збори. Розглянемо результати '
                            'року, плани на літо, питання харчування. Присутність батьків '
                            'обовʼязкова.</p>',
        },
        {
            'title':      'Випускний ранок',
            'event_type': 'morning',
            'days_from_now': 28,
            'time':       (10, 30),
            'description': '<p>Святкове прощання з нашими випускниками — майбутніми '
                            'першокласниками. Святкова програма, виступи дітей, чаювання.</p>',
        },
        {
            'title':      'Конкурс малюнків «Моя сім\'я»',
            'event_type': 'competition',
            'days_from_now': 3,
            'time':       (15, 0),
            'description': '<p>Фінальне підведення підсумків конкурсу малюнків. '
                            'Нагородження переможців, виставка робіт.</p>',
        },
        {
            'title':      'Майстер-клас «Творимо весну»',
            'event_type': 'workshop',
            'days_from_now': -5,
            'time':       (16, 0),
            'description': '<p>Майстер-клас для батьків і дітей за участю вихователів. '
                            'Виготовлення весняних композицій з природних матеріалів.</p>',
        },
    ]

    for s in samples:
        when = (now + timedelta(days=s['days_from_now'])).replace(
            hour=s['time'][0], minute=s['time'][1]
        )
        # slugify з ASCII-only часто повертає порожнє для кирилиці —
        # тоді робимо безпечний fallback з типу + дати
        slug = slugify(s['title'], allow_unicode=False)
        if not slug or len(slug) < 3:
            slug = f"{s['event_type']}-{when.strftime('%Y%m%d')}"
        Event.objects.get_or_create(
            slug=slug,
            defaults={
                'title':       s['title'],
                'event_type':  s['event_type'],
                'description': s['description'],
                'start_date':  when,
            },
        )


def unseed(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed, reverse_code=unseed),
    ]
