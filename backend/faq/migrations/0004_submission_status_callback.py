"""Міграція: замість булевого is_handled робимо 4-значний статус
+ дата повторного дзвінка (callback_date).

   Кроки:
   1. Додаємо поле status (CharField з choices) — за замовч. 'new'.
   2. Додаємо поле callback_date (DateField, null=True).
   3. RunPython: переносимо існуючі дані
        is_handled=True  -> status='done'
        is_handled=False -> status='new'
   4. Видаляємо старе поле is_handled.
   5. Оновлюємо індекси і ordering.
"""

from django.db import migrations, models


def migrate_handled_to_status(apps, schema_editor):
    """Переносимо дані з булевого поля is_handled у нове статусне поле."""
    Submission = apps.get_model('faq', 'FAQQuestionSubmission')
    # is_handled ще існує (видалимо в наступній операції) — використовуємо
    Submission.objects.filter(is_handled=True).update(status='done')
    Submission.objects.filter(is_handled=False).update(status='new')


def revert_status_to_handled(apps, schema_editor):
    """Зворотній прохід — потрібен Django щоб міграцію можна було відкотити."""
    Submission = apps.get_model('faq', 'FAQQuestionSubmission')
    Submission.objects.filter(status='done').update(is_handled=True)
    Submission.objects.exclude(status='done').update(is_handled=False)


class Migration(migrations.Migration):

    dependencies = [
        ('faq', '0003_faqquestionsubmission'),
    ]

    operations = [
        # --- 1. Додаємо нові поля ---
        migrations.AddField(
            model_name='faqquestionsubmission',
            name='status',
            field=models.CharField(
                choices=[
                    ('new', '🆕 Нове'),
                    ('in_progress', '👀 В обробці'),
                    ('callback', '📞 Передзвонити'),
                    ('done', '✅ Оброблено'),
                ],
                default='new',
                help_text='Через який етап обробки проходить це запитання.',
                max_length=20,
                verbose_name='Статус',
            ),
        ),
        migrations.AddField(
            model_name='faqquestionsubmission',
            name='callback_date',
            field=models.DateField(
                blank=True, null=True,
                help_text='Обов’язково заповніть якщо статус «Передзвонити». '
                          'Підкаже коли саме треба зателефонувати батькам.',
                verbose_name='Дата повторного дзвінка',
            ),
        ),

        # --- 2. Переносимо дані ---
        migrations.RunPython(migrate_handled_to_status, revert_status_to_handled),

        # --- 3. ВАЖЛИВО: SQLite не дає видалити поле доки існує індекс на нього.
        #         Тому спершу прибираємо старий індекс по is_handled.
        migrations.RemoveIndex(
            model_name='faqquestionsubmission',
            name='faq_faqques_is_hand_6f6848_idx',
        ),

        # --- 4. Тепер можна видалити старе поле is_handled ---
        migrations.RemoveField(
            model_name='faqquestionsubmission',
            name='is_handled',
        ),

        # --- 5. Оновлюємо help_text та інші мета-поля ---
        migrations.AlterField(
            model_name='faqquestionsubmission',
            name='handled_at',
            field=models.DateTimeField(
                blank=True, null=True,
                help_text='Проставляється автоматично коли статус стає «Оброблено».',
                verbose_name='Дата закриття',
            ),
        ),
        migrations.AlterField(
            model_name='faqquestionsubmission',
            name='admin_note',
            field=models.TextField(
                blank=True,
                help_text='Коротко: про що говорили, що відповіли, коли передзвонили, результат.',
                verbose_name='Нотатка адміністратора',
            ),
        ),

        # --- 6. Додаємо два нові індекси ---
        migrations.AddIndex(
            model_name='faqquestionsubmission',
            index=models.Index(fields=['status', 'created_at'], name='faq_faqques_status_idx'),
        ),
        migrations.AddIndex(
            model_name='faqquestionsubmission',
            index=models.Index(fields=['callback_date'], name='faq_faqques_callbck_idx'),
        ),

        # --- 6. Оновлюємо ordering і назву ---
        migrations.AlterModelOptions(
            name='faqquestionsubmission',
            options={
                'ordering': ['status', 'callback_date', '-created_at'],
                'verbose_name': 'Запитання від відвідувача',
                'verbose_name_plural': 'Запитання від батьків (надіслані з сайту)',
            },
        ),
    ]
