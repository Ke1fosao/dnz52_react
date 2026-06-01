from django.conf import settings
from django.db import models
from django.utils import timezone
from markdownx.models import MarkdownxField


class FAQCategory(models.Model):
    """Категорія для групування питань на сторінці FAQ."""
    name  = models.CharField('Назва', max_length=100)
    slug  = models.SlugField('URL', unique=True)
    icon  = models.CharField('Іконка (Bootstrap Icons)', max_length=80,
                               default='bi-question-circle-fill', blank=True)
    color = models.CharField('Колір (HEX)', max_length=7, default='#4A90E2', blank=True)
    order = models.IntegerField('Порядок', default=0)

    class Meta:
        verbose_name = 'Категорія FAQ'
        verbose_name_plural = 'Категорії FAQ'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class FAQItem(models.Model):
    """Питання-відповідь. Один запис = один пункт."""
    question = models.CharField('Питання', max_length=400)
    answer   = MarkdownxField('Відповідь',
                              help_text='Підтримує форматування: жирний, посилання тощо.')
    category = models.ForeignKey(
        FAQCategory, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='items',
        verbose_name='Категорія',
    )
    order = models.IntegerField('Порядок', default=0)
    is_published = models.BooleanField('Опубліковано', default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Питання'
        verbose_name_plural = 'Питання-відповіді'
        ordering = ['order', 'id']

    def __str__(self):
        return self.question


class FAQQuestionSubmission(models.Model):
    """Запитання надіслане відвідувачем сайту коли він НЕ знайшов відповіді у FAQ.
       Адміністрація бачить ці запитання в адмінці і телефонує батькам для відповіді.

       Робочий процес (status):
           NEW       — щойно надійшло, ніхто ще не дзвонив
           IN_PROGRESS — адмін уже передзвонив, питання в процесі вирішення
           CALLBACK  — треба передзвонити повторно. Обов'язково ставимо callback_date
           DONE      — все вирішено, питання закрите
    """

    class Status(models.TextChoices):
        NEW         = 'new',         '🆕 Нове'
        IN_PROGRESS = 'in_progress', '👀 В обробці'
        CALLBACK    = 'callback',    '📞 Передзвонити'
        DONE        = 'done',        '✅ Оброблено'

    # --- Дані які надіслав відвідувач ---
    name     = models.CharField("Імʼя батька / опікуна", max_length=100)
    phone    = models.CharField('Контактний телефон',     max_length=50)
    question = models.TextField('Текст запитання', max_length=2000)
    created_at = models.DateTimeField('Надіслано', auto_now_add=True)

    # --- Поля для обробки ---
    status = models.CharField(
        'Статус', max_length=20,
        choices=Status.choices, default=Status.NEW,
        help_text='Через який етап обробки проходить це запитання.',
    )
    callback_date = models.DateField(
        'Дата повторного дзвінка', null=True, blank=True,
        help_text='Обов’язково заповніть якщо статус «Передзвонити». '
                  'Підкаже коли саме треба зателефонувати батькам.',
    )

    handled_at = models.DateTimeField('Дата закриття', null=True, blank=True,
                                      help_text='Проставляється автоматично коли статус стає «Оброблено».')
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='handled_faq_questions',
        verbose_name='Хто обробив',
    )
    admin_note = models.TextField(
        'Нотатка адміністратора', blank=True,
        help_text='Коротко: про що говорили, що відповіли, коли передзвонили, результат.'
    )

    class Meta:
        verbose_name = 'Запитання від відвідувача'
        verbose_name_plural = 'Запитання від батьків (надіслані з сайту)'
        # Сортуємо так щоб термінові були зверху:
        # спершу NEW і CALLBACK, потім IN_PROGRESS, потім DONE
        ordering = ['status', 'callback_date', '-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['callback_date']),
        ]

    def __str__(self):
        icons = {
            self.Status.NEW:         '🆕',
            self.Status.IN_PROGRESS: '👀',
            self.Status.CALLBACK:    '📞',
            self.Status.DONE:        '✅',
        }
        icon = icons.get(self.status, '❔')
        return f'{icon} {self.name} ({self.created_at.strftime("%d.%m.%Y") if self.created_at else "—"})'

    # ----- Допоміжні властивості -----

    @property
    def is_handled(self) -> bool:
        """Зворотня сумісність зі старим кодом. True якщо запитання закрите."""
        return self.status == self.Status.DONE

    @property
    def is_overdue(self) -> bool:
        """True якщо статус «Передзвонити» а дата вже минула — отже треба терміново."""
        if self.status != self.Status.CALLBACK or not self.callback_date:
            return False
        return self.callback_date < timezone.localdate()
