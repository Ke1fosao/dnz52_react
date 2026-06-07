"""Тести app specialists: сторінки спеціалістів."""

from django.test import TestCase
from rest_framework.test import APIClient

from .models import SpecialistPage, Specialist


class SpecialistPageAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.page = SpecialistPage.objects.create(
            page_type='methodical',
            title='Методична робота',
            intro='Вступний текст методиста',
            description='Опис методичної роботи ЗДО',
        )
        Specialist.objects.create(
            page=self.page,
            full_name='Коваленко Надія Миколаївна',
            position='Вихователь-методист',
            experience='10 років',
            order=0,
        )

    def test_list_returns_200(self):
        response = self.client.get('/api/v1/specialists/')
        self.assertEqual(response.status_code, 200)

    def test_list_contains_page(self):
        response = self.client.get('/api/v1/specialists/')
        data = response.json()
        items = data if isinstance(data, list) else data.get('results', data)
        page_types = [i['page_type'] for i in items]
        self.assertIn('methodical', page_types)

    def test_retrieve_by_page_type(self):
        response = self.client.get('/api/v1/specialists/methodical/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['title'], 'Методична робота')
        self.assertIn('specialists', data)
        self.assertEqual(len(data['specialists']), 1)
        self.assertEqual(
            data['specialists'][0]['full_name'], 'Коваленко Надія Миколаївна'
        )

    def test_retrieve_invalid_type_returns_404(self):
        response = self.client.get('/api/v1/specialists/nonexistent/')
        self.assertEqual(response.status_code, 404)

    def test_page_type_display_field_present(self):
        response = self.client.get('/api/v1/specialists/methodical/')
        data = response.json()
        self.assertIn('page_type_display', data)
        self.assertEqual(data['page_type_display'], 'Методична робота')


class SpecialistPageModelTests(TestCase):
    def setUp(self):
        self.page = SpecialistPage.objects.create(
            page_type='music',
            title='Музичний керівник',
        )
        self.specialist = Specialist.objects.create(
            page=self.page,
            full_name='Шевченко Оксана',
            position='Музичний керівник',
        )

    def test_str_page(self):
        self.assertEqual(str(self.page), 'Музичний керівник')

    def test_str_specialist(self):
        self.assertIn('Шевченко Оксана', str(self.specialist))
