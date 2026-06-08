from django.conf import settings
from django.db import models


class EnrollmentApplication(models.Model):
    """Онлайн-заявка батьків на зарахування дитини до садочка."""

    class Status(models.TextChoices):
        NEW = 'new', '🆕 Нова'
        PROCESSING = 'processing', '👀 В обробці'
        APPROVED = 'approved', '✅ Схвалено'
        REJECTED = 'rejected', '🚫 Відхилено'
        DONE = 'done', '🏁 Завершено'

    child_name = models.CharField("Ім'я дитини", max_length=150)
    child_birth_date = models.DateField('Дата народження дитини')
    parent_name = models.CharField("Ім'я батька / матері", max_length=150)
    phone = models.CharField('Телефон', max_length=50)
    email = models.EmailField('Email', blank=True)
    desired_start = models.CharField(
        'Бажаний початок відвідування', max_length=100, blank=True,
        help_text='Напр. «вересень 2026» або конкретна дата.')
    note = models.TextField('Додаткова інформація', blank=True)

    status = models.CharField('Статус', max_length=12, choices=Status.choices, default=Status.NEW)
    admin_note = models.TextField('Нотатка адміністрації', blank=True)
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        verbose_name='Опрацював')
    handled_at = models.DateTimeField('Дата опрацювання', null=True, blank=True)
    created_at = models.DateTimeField('Створено', auto_now_add=True)

    class Meta:
        verbose_name = 'Заявка на зарахування'
        verbose_name_plural = 'Заявки на зарахування'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['status', '-created_at'])]

    def __str__(self):
        return f'{self.child_name} — {self.get_status_display()}'
