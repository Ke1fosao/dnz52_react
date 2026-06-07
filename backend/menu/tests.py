"""Тести меню: API (сьогодні/тиждень) + юніт-тести моделі.

API-частину переписано зі старих template-тестів (`reverse('menu:index')`) під `/api/v1/menu/`.
Юніт-тести моделі (has_any_meal, унікальність дати) збережено.
"""
from datetime import date

from django.test import TestCase
from rest_framework.test import APITestCase

from .models import DailyMenu


class MenuApiTests(APITestCase):
    def setUp(self):
        self.today = date.today()
        DailyMenu.objects.create(date=self.today, breakfast='Каша молочна',
                                 lunch='Борщ та котлета', is_published=True)

    def test_today_returns_menu(self):
        r = self.client.get('/api/v1/menu/today/')
        self.assertEqual(r.status_code, 200)
        self.assertIsNotNone(r.data['menu'])
        self.assertEqual(r.data['menu']['breakfast'], 'Каша молочна')

    def test_week_returns_menus(self):
        r = self.client.get('/api/v1/menu/week/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('menus', r.data)
        self.assertTrue(any(m['breakfast'] == 'Каша молочна' for m in r.data['menus']))

    def test_week_invalid_start_returns_400(self):
        r = self.client.get('/api/v1/menu/week/?start=notadate')
        self.assertEqual(r.status_code, 400)

    def test_unpublished_menu_not_in_today(self):
        DailyMenu.objects.filter(date=self.today).update(is_published=False)
        r = self.client.get('/api/v1/menu/today/')
        self.assertIsNone(r.data['menu'])


class DailyMenuModelTests(TestCase):
    """Юніт-тести моделі (не залежать від API)."""

    def test_has_any_meal_true_when_any_field_set(self):
        m = DailyMenu(date=date.today(), breakfast='Каша')
        self.assertTrue(m.has_any_meal)

    def test_has_any_meal_false_when_all_empty(self):
        m = DailyMenu(date=date.today())
        self.assertFalse(m.has_any_meal)

    def test_unique_date_constraint(self):
        from django.db import IntegrityError
        d = date(2030, 1, 1)
        DailyMenu.objects.create(date=d, breakfast='1')
        with self.assertRaises(IntegrityError):
            DailyMenu.objects.create(date=d, breakfast='2')
