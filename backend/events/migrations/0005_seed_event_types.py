from django.db import migrations

# Поточні типи (slug, назва з емодзі, колір) — зберігаємо як було, щоб
# наявні події не втратили відображення/колір після переходу на модель.
CHOICES = [
    ('morning',     '🎭 Ранок / Свято',        '#FF8FA3'),
    ('open_door',   '🚪 День відкритих дверей', '#4A90E2'),
    ('meeting',     '👥 Батьківські збори',     '#FFB84D'),
    ('competition', '🏆 Конкурс',               '#FFD93D'),
    ('workshop',    '🎨 Майстер-клас',          '#B388FF'),
    ('excursion',   '🚌 Екскурсія',             '#50E3C2'),
    ('sport',       '⚽ Спортивна подія',        '#38C2DD'),
    ('other',       '📌 Інше',                  '#7B8AA5'),
]


def seed(apps, schema_editor):
    EventType = apps.get_model('events', 'EventType')
    for i, (slug, name, color) in enumerate(CHOICES):
        EventType.objects.get_or_create(slug=slug, defaults={'name': name, 'color': color, 'order': i})


def unseed(apps, schema_editor):
    EventType = apps.get_model('events', 'EventType')
    EventType.objects.filter(slug__in=[c[0] for c in CHOICES]).delete()


class Migration(migrations.Migration):
    dependencies = [('events', '0004_eventtype')]
    operations = [migrations.RunPython(seed, unseed)]
