"""Тести app faq."""

from datetime import timedelta

from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from .models import FAQCategory, FAQItem, FAQQuestionSubmission


@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.dummy.DummyCache'}})
class FAQPageTests(TestCase):

    def setUp(self):
        self.cat = FAQCategory.objects.create(name='Харчування', slug='food-test', order=1)
        self.q1 = FAQItem.objects.create(
            question='Скільки разів годують?', answer='<p>Чотири рази</p>',
            category=self.cat, is_published=True, order=1,
        )

    def test_faq_page_returns_200(self):
        response = self.client.get(reverse('faq:index'))
        self.assertEqual(response.status_code, 200)

    def test_faq_shows_question(self):
        response = self.client.get(reverse('faq:index'))
        self.assertContains(response, 'Скільки разів годують?')

    def test_unpublished_question_not_shown(self):
        FAQItem.objects.create(
            question='ПРИХОВАНЕ ПИТАННЯ', answer='', is_published=False,
        )
        response = self.client.get(reverse('faq:index'))
        self.assertNotContains(response, 'ПРИХОВАНЕ ПИТАННЯ')

    def test_seeded_data_present(self):
        """Перевіряємо що seed-міграція створила базові FAQ."""
        # Має бути хоча б 1 категорія "Зарахування і документи"
        self.assertTrue(FAQCategory.objects.filter(slug='enrollment').exists())
        # І хоча б одне питання про документи
        self.assertTrue(FAQItem.objects.filter(question__icontains='документи').exists())


@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.dummy.DummyCache'}})
class FAQSubmissionTests(TestCase):
    """Тести форми надсилання запитань — критичні бо там захист від спаму."""

    def _form_data(self, **overrides):
        base = {
            'name':     'Марія Петренко',
            'phone':    '067 123 45 67',
            'question': 'Чи можна привезти дитину о 8:30 а не о 8:00?',
            'website':  '',  # honeypot
        }
        base.update(overrides)
        return base

    def test_valid_submission_creates_record(self):
        response = self.client.post(reverse('faq:index'), self._form_data())
        # Має бути редірект (302) — це Post-Redirect-Get pattern
        self.assertEqual(response.status_code, 302)
        self.assertEqual(FAQQuestionSubmission.objects.count(), 1)
        record = FAQQuestionSubmission.objects.first()
        self.assertEqual(record.name, 'Марія Петренко')
        self.assertEqual(record.status, FAQQuestionSubmission.Status.NEW,
                         'Нове запитання має одразу отримати статус NEW')
        self.assertFalse(record.is_handled, 'Нове запитання має бути НЕ оброблене')

    def test_honeypot_blocks_bot(self):
        data = self._form_data(website='http://spam.example.com')
        self.client.post(reverse('faq:index'), data)
        self.assertEqual(FAQQuestionSubmission.objects.count(), 0)

    def test_invalid_phone_blocks_submission(self):
        data = self._form_data(phone='123')  # короткий номер
        self.client.post(reverse('faq:index'), data)
        self.assertEqual(FAQQuestionSubmission.objects.count(), 0)

    def test_short_question_blocks_submission(self):
        data = self._form_data(question='Як?')  # коротше 10 символів
        self.client.post(reverse('faq:index'), data)
        self.assertEqual(FAQQuestionSubmission.objects.count(), 0)

    def test_empty_name_blocks_submission(self):
        data = self._form_data(name='')
        self.client.post(reverse('faq:index'), data)
        self.assertEqual(FAQQuestionSubmission.objects.count(), 0)

    def test_rate_limit_blocks_quick_resubmission(self):
        """Якщо вже надіслав запитання — друге протягом 5 хв блокується."""
        self.client.post(reverse('faq:index'), self._form_data())
        self.assertEqual(FAQQuestionSubmission.objects.count(), 1)
        # Друге надсилання одразу — має заблокувати
        self.client.post(reverse('faq:index'), self._form_data(question='Інше запитання теж дуже цікаве'))
        self.assertEqual(FAQQuestionSubmission.objects.count(), 1, 'Rate-limit має блокувати друге запитання')

    def test_phone_with_dashes_and_spaces_accepted(self):
        """Поле телефону приймає різні формати — головне ≥7 цифр."""
        data = self._form_data(phone='+38 (067) 123-45-67')
        self.client.post(reverse('faq:index'), data)
        self.assertEqual(FAQQuestionSubmission.objects.count(), 1)


class FAQQuestionSubmissionModelTests(TestCase):

    def test_str_shows_status_icon_for_each_status(self):
        """__str__ повертає різну іконку для кожного зі статусів."""
        Status = FAQQuestionSubmission.Status
        s = FAQQuestionSubmission.objects.create(
            name='Тест', phone='1234567', question='?' * 15,
        )
        self.assertIn('🆕', str(s))

        s.status = Status.IN_PROGRESS
        s.save()
        self.assertIn('👀', str(s))

        s.status = Status.CALLBACK
        s.save()
        self.assertIn('📞', str(s))

        s.status = Status.DONE
        s.save()
        self.assertIn('✅', str(s))

    def test_is_handled_property_reflects_done_status(self):
        """is_handled = True тільки коли статус DONE."""
        Status = FAQQuestionSubmission.Status
        s = FAQQuestionSubmission.objects.create(
            name='Тест', phone='1234567', question='?' * 15,
        )
        self.assertFalse(s.is_handled)
        s.status = Status.DONE
        s.save()
        self.assertTrue(s.is_handled)

    def test_is_overdue_when_callback_date_in_past(self):
        """Прострочений дзвінок: статус CALLBACK + дата минула."""
        Status = FAQQuestionSubmission.Status
        today = timezone.localdate()

        # Прострочений
        overdue = FAQQuestionSubmission.objects.create(
            name='Прострочений', phone='1234567', question='?' * 15,
            status=Status.CALLBACK, callback_date=today - timedelta(days=2),
        )
        self.assertTrue(overdue.is_overdue)

        # Сьогодні — НЕ прострочений
        today_one = FAQQuestionSubmission.objects.create(
            name='Сьогодні', phone='1234567', question='?' * 15,
            status=Status.CALLBACK, callback_date=today,
        )
        self.assertFalse(today_one.is_overdue)

        # Майбутнє — НЕ прострочений
        future = FAQQuestionSubmission.objects.create(
            name='Майбутнє', phone='1234567', question='?' * 15,
            status=Status.CALLBACK, callback_date=today + timedelta(days=3),
        )
        self.assertFalse(future.is_overdue)

        # NEW з датою у минулому — НЕ прострочений (бо не CALLBACK)
        new_with_date = FAQQuestionSubmission.objects.create(
            name='Нове', phone='1234567', question='?' * 15,
            status=Status.NEW, callback_date=today - timedelta(days=5),
        )
        self.assertFalse(new_with_date.is_overdue)
