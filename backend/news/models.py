from django.db import models
from django.utils import timezone
from markdownx.models import MarkdownxField
from simple_history.models import HistoricalRecords


class NewsCategory(models.Model):
    """Категорії новин"""
    name = models.CharField('Назва', max_length=100)
    slug = models.SlugField('URL', unique=True)

    class Meta:
        verbose_name = 'Категорія новин'
        verbose_name_plural = 'Категорії новин'

    def __str__(self):
        return self.name


class News(models.Model):
    """Новини та оголошення"""

    class Status(models.TextChoices):
        DRAFT     = 'draft',     '📝 Чернетка'
        PUBLISHED = 'published', '✅ Опубліковано'
        SCHEDULED = 'scheduled', '⏰ Заплановано'

    title = models.CharField('Заголовок', max_length=200)
    slug = models.SlugField('URL', unique=True)
    category = models.ForeignKey(NewsCategory, on_delete=models.SET_NULL, null=True, verbose_name='Категорія')
    content = MarkdownxField('Контент')
    image = models.ImageField('Зображення', upload_to='news/', blank=True, null=True)
    created_at = models.DateTimeField('Дата публікації', auto_now_add=True)
    updated_at = models.DateTimeField('Дата оновлення', auto_now=True)

    # Workflow: чернетки + запланована публікація
    status = models.CharField(
        'Статус', max_length=12, choices=Status.choices, default=Status.PUBLISHED,
        help_text='Чернетка — не видно на сайті. Заплановано — зʼявиться у вказану дату.',
    )
    publish_at = models.DateTimeField(
        'Опублікувати о', null=True, blank=True,
        help_text='Лише для статусу «Заплановано»: дата і час автоматичної появи на сайті.',
    )

    # Застаріле поле — лишаємо для зворотної сумісності (синхронізується зі status)
    is_published = models.BooleanField('Опубліковано', default=True, editable=False)
    views = models.IntegerField('Перегляди', default=0)

    history = HistoricalRecords()

    class Meta:
        verbose_name = 'Новина'
        verbose_name_plural = 'Новини'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Синхронізуємо старе is_published зі status (для сумісності з sitemaps тощо)
        self.is_published = (self.status == self.Status.PUBLISHED) or (
            self.status == self.Status.SCHEDULED
            and self.publish_at is not None
            and self.publish_at <= timezone.now()
        )
        super().save(*args, **kwargs)

    @property
    def is_live(self) -> bool:
        """Чи новина зараз має бути видимою на сайті."""
        if self.status == self.Status.PUBLISHED:
            return True
        if self.status == self.Status.SCHEDULED and self.publish_at:
            return self.publish_at <= timezone.now()
        return False
