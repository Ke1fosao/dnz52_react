"""Тести app events — календар подій."""

from datetime import timedelta
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .models import Event


class EventsCalendarTests(TestCase):

    def setUp(self):
        self.future = Event.objects.create(
            title='Майбутній ранок', slug='future-morning',
            event_type='morning',
            start_date=timezone.now() + timedelta(days=5),
            is_published=True,
        )
        self.past = Event.objects.create(
            title='Минула подія', slug='past-event',
            event_type='other',
            start_date=timezone.now() - timedelta(days=10),
            is_published=True,
        )

    def test_calendar_returns_200(self):
        response = self.client.get(reverse('events:calendar'))
        self.assertEqual(response.status_code, 200)

    def test_calendar_year_month_navigation(self):
        """Параметри ?year=&month= не повинні крашити сторінку."""
        response = self.client.get(reverse('events:calendar') + '?year=2027&month=3')
        self.assertEqual(response.status_code, 200)

    def test_calendar_invalid_month_falls_back(self):
        """Невалідний місяць не повинен крашити — має повернути дефолт."""
        response = self.client.get(reverse('events:calendar') + '?year=abc&month=99')
        self.assertEqual(response.status_code, 200)

    def test_unpublished_event_not_shown(self):
        Event.objects.create(
            title='ПРИХОВАНА подія', slug='hidden-event',
            event_type='other',
            start_date=timezone.now() + timedelta(days=2),
            is_published=False,
        )
        response = self.client.get(reverse('events:calendar'))
        self.assertNotContains(response, 'ПРИХОВАНА подія')


class EventDetailTests(TestCase):

    def setUp(self):
        self.event = Event.objects.create(
            title='Випускний', slug='vypusknyi',
            event_type='morning',
            description='<p>Опис випускного ранку</p>',
            start_date=timezone.now() + timedelta(days=14),
            is_published=True,
        )

    def test_event_detail_returns_200(self):
        response = self.client.get(self.event.get_absolute_url())
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Випускний')
        self.assertContains(response, 'Опис випускного ранку')

    def test_unpublished_event_returns_404(self):
        Event.objects.create(
            title='Чорновик', slug='draft-event',
            event_type='other',
            start_date=timezone.now(),
            is_published=False,
        )
        response = self.client.get(reverse('events:event_detail', args=['draft-event']))
        self.assertEqual(response.status_code, 404)


class EventModelTests(TestCase):

    def test_is_past_for_old_event(self):
        e = Event(
            title='Старий', slug='old', event_type='other',
            start_date=timezone.now() - timedelta(days=10),
        )
        self.assertTrue(e.is_past)

    def test_is_past_for_future_event(self):
        e = Event(
            title='Новий', slug='new', event_type='other',
            start_date=timezone.now() + timedelta(days=10),
        )
        self.assertFalse(e.is_past)

    def test_color_matches_event_type(self):
        e = Event(title='X', slug='x', event_type='morning', start_date=timezone.now())
        self.assertEqual(e.color, '#FF8FA3')
