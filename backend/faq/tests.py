"""Тести FAQ: API (список/лайк/запит + антиспам) + юніт-тести моделі.

API-частину переписано зі старих template-тестів (`reverse('faq:index')`) під `/api/v1/faq/`.
Юніт-тести моделі FAQQuestionSubmission збережено (вони не залежали від шаблонів).
"""
from datetime import timedelta

from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import FAQCategory, FAQItem, FAQQuestionSubmission


class FAQListTests(APITestCase):
    def setUp(self):
        cache.clear()
        cat = FAQCategory.objects.create(name='Загальні', slug='zagalni-test')
        FAQItem.objects.create(category=cat, question='Який режим роботи?',
                               answer='З 7:00 до 19:00', is_published=True)
        FAQItem.objects.create(category=cat, question='Приховане питання?',
                               answer='...', is_published=False)

    def test_list_published_only(self):
        r = self.client.get('/api/v1/faq/')
        self.assertEqual(r.status_code, 200)
        questions = [it['question'] for g in r.data for it in g['items']]
        self.assertIn('Який режим роботи?', questions)
        self.assertNotIn('Приховане питання?', questions)

    def test_like_increments(self):
        item = FAQItem.objects.create(question='Що взяти в садок?',
                                      answer='Змінний одяг', is_published=True)
        r = self.client.post(f'/api/v1/faq/items/{item.pk}/like/')
        self.assertEqual(r.status_code, 200)
        item.refresh_from_db()
        self.assertEqual(item.likes, 1)

    def test_like_unpublished_404(self):
        item = FAQItem.objects.create(question='X', answer='Y', is_published=False)
        r = self.client.post(f'/api/v1/faq/items/{item.pk}/like/')
        self.assertEqual(r.status_code, 404)


@override_settings(TURNSTILE_SECRET_KEY='')
class FAQAskTests(APITestCase):
    def setUp(self):
        cache.clear()

    def _data(self, **ov):
        d = {'name': 'Ірина', 'phone': '+380501234567',
             'question': 'Чи є вільні місця у молодшій групі?', 'website': ''}
        d.update(ov)
        return d

    def test_valid_creates_submission(self):
        r = self.client.post('/api/v1/faq/ask/', self._data())
        self.assertEqual(r.status_code, 201)
        self.assertEqual(FAQQuestionSubmission.objects.count(), 1)

    def test_honeypot_blocks_bot(self):
        r = self.client.post('/api/v1/faq/ask/', self._data(website='spam'))
        self.assertEqual(r.status_code, 400)
        self.assertEqual(FAQQuestionSubmission.objects.count(), 0)

    def test_short_name_blocked(self):
        r = self.client.post('/api/v1/faq/ask/', self._data(name='І'))
        self.assertEqual(r.status_code, 400)

    def test_short_phone_blocked(self):
        r = self.client.post('/api/v1/faq/ask/', self._data(phone='12'))
        self.assertEqual(r.status_code, 400)

    def test_rate_limit_blocks_quick_resubmission(self):
        self.client.post('/api/v1/faq/ask/', self._data())
        r2 = self.client.post('/api/v1/faq/ask/', self._data(question='Ще одне довге запитання?'))
        self.assertEqual(r2.status_code, 429)


class FAQQuestionSubmissionModelTests(TestCase):
    """Юніт-тести моделі (не залежать від API/шаблонів)."""

    def test_str_shows_status_icon_for_each_status(self):
        Status = FAQQuestionSubmission.Status
        s = FAQQuestionSubmission.objects.create(name='Тест', phone='1234567', question='?' * 15)
        self.assertIn('🆕', str(s))
        s.status = Status.IN_PROGRESS; s.save()
        self.assertIn('👀', str(s))
        s.status = Status.CALLBACK; s.save()
        self.assertIn('📞', str(s))
        s.status = Status.DONE; s.save()
        self.assertIn('✅', str(s))

    def test_is_handled_property_reflects_done_status(self):
        Status = FAQQuestionSubmission.Status
        s = FAQQuestionSubmission.objects.create(name='Тест', phone='1234567', question='?' * 15)
        self.assertFalse(s.is_handled)
        s.status = Status.DONE; s.save()
        self.assertTrue(s.is_handled)

    def test_is_overdue_when_callback_date_in_past(self):
        Status = FAQQuestionSubmission.Status
        today = timezone.localdate()
        overdue = FAQQuestionSubmission.objects.create(
            name='Прострочений', phone='1234567', question='?' * 15,
            status=Status.CALLBACK, callback_date=today - timedelta(days=2))
        self.assertTrue(overdue.is_overdue)
        future = FAQQuestionSubmission.objects.create(
            name='Майбутнє', phone='1234567', question='?' * 15,
            status=Status.CALLBACK, callback_date=today + timedelta(days=3))
        self.assertFalse(future.is_overdue)
        new_with_date = FAQQuestionSubmission.objects.create(
            name='Нове', phone='1234567', question='?' * 15,
            status=Status.NEW, callback_date=today - timedelta(days=5))
        self.assertFalse(new_with_date.is_overdue)
