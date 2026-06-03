# -*- coding: utf-8 -*-
"""Створює базові теги новин і призначає їх наявним новинам за ключовими словами.

Ідемпотентно: теги через get_or_create, .add() не дублює зв'язки.
"""
from django.db import migrations


TAGS = [
    ('Свято', 'svyato'),
    ('Безпека', 'bezpeka'),
    ('Харчування', 'harchuvannya'),
    ('Розвиток', 'rozvytok'),
    ('Батькам', 'batkam'),
    ('Конкурс', 'konkurs'),
    ('Адаптація', 'adaptatsiya'),
]

# (ключові слова у нижньому регістрі) -> slug тегу
RULES = [
    (['безпек'], 'bezpeka'),
    (['свят', 'ранок', 'випускн', 'новорічн', 'миколай', 'утренник'], 'svyato'),
    (['харчув', 'меню', 'їж', 'обід'], 'harchuvannya'),
    (['конкурс', 'змаган', 'переміг'], 'konkurs'),
    (['батьк', 'збор', 'майстер-клас', 'відкритих дверей'], 'batkam'),
    (['адаптац'], 'adaptatsiya'),
]


def seed(apps, schema_editor):
    NewsTag = apps.get_model('news', 'NewsTag')
    News = apps.get_model('news', 'News')

    tag_by_slug = {}
    for name, slug in TAGS:
        tag, _ = NewsTag.objects.get_or_create(slug=slug, defaults={'name': name})
        tag_by_slug[slug] = tag

    for n in News.objects.all():
        text = f'{n.title} {n.content}'.lower()
        assigned = {slug for keywords, slug in RULES if any(k in text for k in keywords)}
        if not assigned:
            assigned = {'rozvytok'}
        for slug in list(assigned)[:3]:
            n.tags.add(tag_by_slug[slug])


def unseed(apps, schema_editor):
    NewsTag = apps.get_model('news', 'NewsTag')
    NewsTag.objects.filter(slug__in=[s for _, s in TAGS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('news', '0003_newstag_news_tags'),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
