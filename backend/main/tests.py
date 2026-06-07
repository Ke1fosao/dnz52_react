"""Тести основного app: API контактів, сторінок, слайдера + юніт-тест моделі Page.

Переписано зі старих template-тестів (`reverse('main:home')` тощо) під `/api/v1/`.
Пошук покрито окремо у `main/test_search.py`.
"""
from django.test import TestCase
from rest_framework.test import APITestCase

from .models import Page, Contact, Slider


class ContactsApiTests(APITestCase):
    def test_contacts_returns_200_without_data(self):
        r = self.client.get('/api/v1/contacts/')
        self.assertEqual(r.status_code, 200)

    def test_contacts_shows_address(self):
        Contact.objects.create(address='вул. Тестова 1, м. Рівне', phone='64-82-55',
                               email='test@dnz52.ua', working_hours='Пн-Пт: 8-19')
        r = self.client.get('/api/v1/contacts/')
        self.assertTrue(any('Тестова' in (c.get('address') or '') for c in r.data))


class SliderApiTests(APITestCase):
    def test_sliders_returns_200(self):
        Slider.objects.create(title='Привіт', description='Тестовий слайд',
                              image='slider/test.jpg', is_active=True)
        r = self.client.get('/api/v1/sliders/')
        self.assertEqual(r.status_code, 200)


class PageApiTests(APITestCase):
    def setUp(self):
        Page.objects.create(title='Про заклад', slug='pro-zaklad-test',
                            content='Інформація про садок.', is_published=True)
        Page.objects.create(title='Чернетка', slug='draft-page-test',
                            content='...', is_published=False)

    def test_published_page_200(self):
        r = self.client.get('/api/v1/pages/pro-zaklad-test/')
        self.assertEqual(r.status_code, 200)

    def test_unpublished_page_404(self):
        r = self.client.get('/api/v1/pages/draft-page-test/')
        self.assertEqual(r.status_code, 404)


class PageModelTests(TestCase):
    def test_str_returns_title(self):
        page = Page.objects.create(title='Контакти', slug='contacts-model-test',
                                   content='', is_published=True)
        self.assertEqual(str(page), 'Контакти')
