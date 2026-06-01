from django.db import models
from django.urls import reverse
from simple_history.models import HistoricalRecords


class DailyMenu(models.Model):
    """Меню на конкретний день для всіх груп закладу.
       Поля «II сніданок» та «Вечеря» необовʼязкові — вечеря лише для чергових
       груп з режимом 12 годин."""
    date = models.DateField('Дата', unique=True)

    breakfast        = models.TextField('🥣 Сніданок',         blank=True)
    second_breakfast = models.TextField('🍎 II сніданок',       blank=True,
                                          help_text='Часто це фрукт або сік. Необовʼязково.')
    lunch            = models.TextField('🍲 Обід',             blank=True)
    snack            = models.TextField('🥨 Полуденок',        blank=True)
    dinner           = models.TextField('🥛 Вечеря',           blank=True,
                                          help_text='Для чергових груп (12 годин). Необовʼязково.')

    note = models.CharField(
        'Примітка дня', max_length=300, blank=True,
        help_text='Наприклад: «Святкове меню до Дня матері» або позначення алергенів.'
    )
    is_published = models.BooleanField('Опубліковано', default=True)
    created_at = models.DateTimeField('Створено', auto_now_add=True)
    updated_at = models.DateTimeField('Оновлено', auto_now=True)

    history = HistoricalRecords()

    class Meta:
        verbose_name = 'Меню на день'
        verbose_name_plural = 'Денні меню'
        ordering = ['-date']
        indexes = [models.Index(fields=['date'])]

    def __str__(self):
        return f"Меню на {self.date.strftime('%d.%m.%Y')}"

    def get_absolute_url(self):
        return f"/menu?date={self.date.isoformat()}"

    @property
    def has_any_meal(self):
        return any([
            self.breakfast, self.second_breakfast,
            self.lunch, self.snack, self.dinner,
        ])


class MenuTemplate(models.Model):
    """Шаблон меню за днем тижня — використовується як ОСНОВА коли на конкретну
    дату немає окремого DailyMenu. Заповнюєте один раз (Пн-Пт) — і воно
    показується щотижня автоматично, без потреби копіювати.

    DailyMenu на конкретну дату завжди має пріоритет над шаблоном.
    """
    WEEKDAY_CHOICES = [
        (0, 'Понеділок'),
        (1, 'Вівторок'),
        (2, 'Середа'),
        (3, 'Четвер'),
        (4, "П'ятниця"),
        (5, 'Субота'),
        (6, 'Неділя'),
    ]

    weekday = models.IntegerField('День тижня', choices=WEEKDAY_CHOICES, unique=True)

    breakfast        = models.TextField('🥣 Сніданок',   blank=True)
    second_breakfast = models.TextField('🍎 II сніданок', blank=True)
    lunch            = models.TextField('🍲 Обід',       blank=True)
    snack            = models.TextField('🥨 Полуденок',  blank=True)
    dinner           = models.TextField('🥛 Вечеря',     blank=True)
    note             = models.CharField('Примітка', max_length=300, blank=True)

    is_active = models.BooleanField('Використовувати як основу', default=True,
                                     help_text='Якщо вимкнено — цей день шаблону не показується.')

    class Meta:
        verbose_name = 'Шаблон меню (день тижня)'
        verbose_name_plural = '📋 Шаблон меню (тиждень-основа)'
        ordering = ['weekday']

    def __str__(self):
        return f'Шаблон: {self.get_weekday_display()}'

    @property
    def has_any_meal(self):
        return any([
            self.breakfast, self.second_breakfast,
            self.lunch, self.snack, self.dinner,
        ])
