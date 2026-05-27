"""Тести app menu — щоденне меню."""

from datetime import date, timedelta
from django.test import TestCase
from django.urls import reverse

from .models import DailyMenu


class MenuPageTests(TestCase):

    def setUp(self):
        self.today = date.today()
        self.today_menu = DailyMenu.objects.create(
            date=self.today,
            breakfast='Каша молочна',
            lunch='Борщ та котлета',
            snack='Сирники',
            is_published=True,
        )

    def test_menu_page_returns_200(self):
        response = self.client.get(reverse('menu:index'))
        self.assertEqual(response.status_code, 200)

    def test_today_menu_displayed(self):
        response = self.client.get(reverse('menu:index'))
        self.assertContains(response, 'Каша молочна')
        self.assertContains(response, 'Борщ та котлета')

    def test_unpublished_menu_not_displayed(self):
        # Створюємо завтрашнє меню але не публікуємо
        DailyMenu.objects.create(
            date=self.today + timedelta(days=1),
            breakfast='ТАЄМНИЙ СНІДАНОК',
            is_published=False,
        )
        response = self.client.get(reverse('menu:index'))
        self.assertNotContains(response, 'ТАЄМНИЙ СНІДАНОК')

    def test_date_param_changes_week(self):
        """Параметр ?date=YYYY-MM-DD має переключати тиждень."""
        far_date = self.today + timedelta(days=21)
        response = self.client.get(reverse('menu:index') + f'?date={far_date.isoformat()}')
        self.assertEqual(response.status_code, 200)


class DailyMenuModelTests(TestCase):

    def test_has_any_meal_true_when_any_field_set(self):
        m = DailyMenu(date=date.today(), breakfast='Каша')
        self.assertTrue(m.has_any_meal)

    def test_has_any_meal_false_when_all_empty(self):
        m = DailyMenu(date=date.today())
        self.assertFalse(m.has_any_meal)

    def test_unique_date_constraint(self):
        """В один день не може бути два меню."""
        from django.db import IntegrityError
        d = date(2030, 1, 1)
        DailyMenu.objects.create(date=d, breakfast='1')
        with self.assertRaises(IntegrityError):
            DailyMenu.objects.create(date=d, breakfast='2')
