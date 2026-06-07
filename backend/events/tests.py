"""Тести подій: API (список/деталі/iCal) + юніт-тести моделі.

API-частину переписано зі старих template-тестів (`reverse('events:...')`) під `/api/v1/events/`.
Юніт-тести моделі (is_past, color) збережено.
"""
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Event


class EventApiTests(APITestCase):
    def setUp(self):
        self.pub = Event.objects.create(
            title='День відкритих дверей', slug='den-vidkrytyh-dverei',
            start_date=timezone.now() + timedelta(days=5), is_published=True)
        self.hidden = Event.objects.create(
            title='Чернетка події', slug='chernetka-podii',
            start_date=timezone.now() + timedelta(days=2), is_published=False)

    def test_list_returns_200(self):
        r = self.client.get('/api/v1/events/')
        self.assertEqual(r.status_code, 200)

    def test_list_published_only(self):
        r = self.client.get('/api/v1/events/')
        slugs = [e['slug'] for e in r.data]  # events: pagination_class=None → список
        self.assertIn('den-vidkrytyh-dverei', slugs)
        self.assertNotIn('chernetka-podii', slugs)

    def test_detail_returns_200(self):
        r = self.client.get('/api/v1/events/den-vidkrytyh-dverei/')
        self.assertEqual(r.status_code, 200)

    def test_unpublished_detail_404(self):
        r = self.client.get('/api/v1/events/chernetka-podii/')
        self.assertEqual(r.status_code, 404)

    def test_ical_download(self):
        r = self.client.get('/api/v1/events/den-vidkrytyh-dverei/ical/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('BEGIN:VCALENDAR', r.content.decode('utf-8'))


class EventModelTests(TestCase):
    """Юніт-тести моделі (не залежать від API)."""

    def test_is_past_for_old_event(self):
        e = Event(title='Старий', slug='old', event_type='other',
                  start_date=timezone.now() - timedelta(days=10))
        self.assertTrue(e.is_past)

    def test_is_past_for_future_event(self):
        e = Event(title='Новий', slug='new', event_type='other',
                  start_date=timezone.now() + timedelta(days=10))
        self.assertFalse(e.is_past)

    def test_color_matches_event_type(self):
        e = Event(title='X', slug='x', event_type='morning', start_date=timezone.now())
        self.assertEqual(e.color, '#FF8FA3')
