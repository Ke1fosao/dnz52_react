from django.db import models
from django.urls import reverse
from django.utils import timezone
from markdownx.models import MarkdownxField


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

    @property
    def color(self):
        return self.EVENT_COLORS.get(self.event_type, '#7B8AA5')

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
