from django.db import models
from django.urls import reverse
from django.utils import timezone
from markdownx.models import MarkdownxField


class EventType(models.Model):
    """Тип події (редагований довідник). Event.event_type зберігає slug."""
    slug = models.SlugField('Код (slug)', max_length=40, unique=True)
    name = models.CharField('Назва', max_length=120,
                            help_text='Можна з емодзі на початку, напр. «🎭 Ранок / Свято».')
    color = models.CharField('Колір (HEX)', max_length=7, default='#7B8AA5')
    order = models.IntegerField('Порядок', default=0)

    class Meta:
        verbose_name = 'Тип події'
        verbose_name_plural = 'Типи подій'
        ordering = ['order', 'id']

    def __str__(self):
        return self.name


class Event(models.Model):
    """Подія календаря — ранки, дні відкритих дверей, батьківські збори тощо."""

    EVENT_TYPE_CHOICES = [
        ('morning',    '🎭 Ранок / Свято'),
        ('open_door',  '🚪 День відкритих дверей'),
        ('meeting',    '👥 Батьківські збори'),
        ('competition','🏆 Конкурс'),
        ('workshop',   '🎨 Майстер-клас'),
        ('excursion',  '🚌 Екскурсія'),
        ('sport',      '⚽ Спортивна подія'),
        ('other',      '📌 Інше'),
    ]

    EVENT_COLORS = {
        'morning':     '#FF8FA3',
        'open_door':   '#4A90E2',
        'meeting':     '#FFB84D',
        'competition': '#FFD93D',
        'workshop':    '#B388FF',
        'excursion':   '#50E3C2',
        'sport':       '#38C2DD',
        'other':       '#7B8AA5',
    }

    title       = models.CharField('Назва події', max_length=200)
    slug        = models.SlugField('URL', unique=True)
    event_type  = models.CharField('Тип події', max_length=20,
                                     choices=EVENT_TYPE_CHOICES, default='other')
    description = MarkdownxField('Опис', blank=True)
    start_date  = models.DateTimeField('Початок (дата і час)')
    end_date    = models.DateTimeField('Закінчення', blank=True, null=True,
                                         help_text='Залиште порожнім якщо подія однієї дати.')
    location    = models.CharField('Місце проведення', max_length=200, blank=True,
                                     default='ЗДО №52, м. Рівне')
    image       = models.ImageField('Зображення', upload_to='events/', blank=True, null=True)
    group       = models.ForeignKey(
        'groups.Group', on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name='Конкретна група (якщо подія тільки для однієї)',
        related_name='events',
    )
    is_published = models.BooleanField('Опубліковано', default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Подія'
        verbose_name_plural = 'Події'
        ordering = ['start_date']

    def __str__(self):
        return f'{self.title} — {self.start_date.strftime("%d.%m.%Y")}'

    def get_absolute_url(self):
        return reverse('events:event_detail', args=[self.slug])

    @classmethod
    def _type_map(cls):
        """{slug: (name, color)} з EventType — кешується (інвалідація сигналом)."""
        from django.core.cache import cache
        m = cache.get('event_type_map')
        if m is None:
            m = {t.slug: (t.name, t.color) for t in EventType.objects.all()}
            cache.set('event_type_map', m, 600)
        return m

    @property
    def color(self):
        nc = self._type_map().get(self.event_type)
        return nc[1] if nc else self.EVENT_COLORS.get(self.event_type, '#7B8AA5')

    @property
    def type_label(self):
        """Назва типу: спершу з EventType, інакше — зі старих choices, інакше сам slug."""
        nc = self._type_map().get(self.event_type)
        if nc:
            return nc[0]
        return dict(self.EVENT_TYPE_CHOICES).get(self.event_type, self.event_type)

    @property
    def is_past(self):
        """Чи подія вже минула."""
        ref = self.end_date or self.start_date
        return ref < timezone.now()

    @property
    def is_today(self):
        return self.start_date.date() == timezone.now().date()

    @property
    def is_multiday(self):
        return bool(self.end_date) and self.end_date.date() != self.start_date.date()


# Інвалідуємо кеш мапи типів при зміні EventType
from django.db.models.signals import post_save, post_delete  # noqa: E402
from django.dispatch import receiver  # noqa: E402


@receiver([post_save, post_delete], sender=EventType)
def _clear_event_type_cache(**kwargs):
    from django.core.cache import cache
    cache.delete('event_type_map')
