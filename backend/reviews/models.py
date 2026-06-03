from django.db import models


class Review(models.Model):
    RATING_CHOICES = [(i, '★' * i) for i in range(1, 6)]

    author      = models.CharField("Ім'я", max_length=100)
    child_group = models.CharField('Група дитини', max_length=100, blank=True)
    rating      = models.IntegerField('Оцінка', choices=RATING_CHOICES, default=5)
    text        = models.TextField('Відгук')
    created_at  = models.DateTimeField('Дата', auto_now_add=True)
    is_approved = models.BooleanField('Опубліковано', default=False)

    # Реакції відвідувачів сайту — лічильники голосів
    likes    = models.PositiveIntegerField('👍 Лайків',    default=0)
    dislikes = models.PositiveIntegerField('👎 Дизлайків', default=0)

    # Офіційна відповідь закладу — якщо заповнено, показується під відгуком
    admin_reply = models.TextField(
        'Відповідь адміністрації', blank=True,
        help_text='Якщо заповнено — публічно показується під відгуком як офіційна відповідь закладу.',
    )

    class Meta:
        verbose_name = 'Відгук'
        verbose_name_plural = 'Відгуки'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.author} — {self.rating}★'
