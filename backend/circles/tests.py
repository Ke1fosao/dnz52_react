"""Тести app circles: гуртки, переваги, розклад занять."""

from django.test import TestCase
from rest_framework.test import APIClient

from documents.models import Document, DocumentCategory
from .models import Circle, CircleBenefit, CircleSession


class CircleAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.circle = Circle.objects.create(
            name='Англійська для малят',
            slug='english-for-kids',
            tagline='Перші слова англійською через гру',
            leader='Петренко Юлія',
            age_group='5–6 років',
            schedule='Вт, Чт 15:30',
            duration='25 хв',
            format='Групові заняття',
            price='Безкоштовно',
            icon='bi-alphabet',
            color='#2ECC71',
            goal='Розвиток мовлення через гру.',
            description='Ознайомлення з англійською мовою.',
            is_featured=True,
            order=1,
            is_published=True,
        )
        CircleBenefit.objects.create(
            circle=self.circle,
            icon='bi-translate',
            title='Мовлення',
            text='Розвиваємо мовні навички',
            order=0,
        )
        CircleSession.objects.create(
            circle=self.circle,
            day='Вівторок',
            time='15:30',
            note='Старша група',
            order=0,
        )
        # Непублікований гурток
        Circle.objects.create(
            name='Приховано',
            slug='pryhovanyi-hurtok',
            goal='.',
            description='.',
            is_published=False,
        )

    def test_list_returns_200(self):
        response = self.client.get('/api/v1/circles/')
        self.assertEqual(response.status_code, 200)

    def test_list_shows_only_published(self):
        response = self.client.get('/api/v1/circles/')
        data = response.json()
        items = data if isinstance(data, list) else data.get('results', data)
        slugs = [i['slug'] for i in items]
        self.assertIn('english-for-kids', slugs)
        self.assertNotIn('pryhovanyi-hurtok', slugs)

    def test_list_contains_is_featured_field(self):
        response = self.client.get('/api/v1/circles/')
        data = response.json()
        items = data if isinstance(data, list) else data.get('results', data)
        circle = next(
            (i for i in items if i['slug'] == 'english-for-kids'), None
        )
        self.assertIsNotNone(circle)
        self.assertTrue(circle['is_featured'])

    def test_retrieve_by_slug(self):
        response = self.client.get(
            f'/api/v1/circles/{self.circle.slug}/'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['name'], 'Англійська для малят')
        self.assertIn('benefits', data)
        self.assertEqual(len(data['benefits']), 1)
        self.assertIn('sessions', data)
        self.assertEqual(len(data['sessions']), 1)
        self.assertEqual(data['sessions'][0]['day'], 'Вівторок')

    def test_unpublished_circle_not_found(self):
        response = self.client.get('/api/v1/circles/pryhovanyi-hurtok/')
        self.assertEqual(response.status_code, 404)


class CircleModelTests(TestCase):
    def setUp(self):
        self.circle = Circle.objects.create(
            name='Танці',
            slug='tantsi',
            goal='Розвивати пластику.',
            description='Хореографічний гурток.',
            is_published=True,
        )

    def test_str(self):
        self.assertEqual(str(self.circle), 'Танці')

    def test_benefit_str(self):
        benefit = CircleBenefit.objects.create(
            circle=self.circle,
            title='Координація',
            order=0,
        )
        self.assertIn('Координація', str(benefit))

    def test_session_str(self):
        session = CircleSession.objects.create(
            circle=self.circle,
            day='Понеділок',
            time='16:00',
            order=0,
        )
        self.assertIn('Понеділок', str(session))
