"""Тести app documents: категорії документів, документи, завантаження."""

from django.test import TestCase
from rest_framework.test import APIClient

from .models import DocumentCategory, Document


class DocumentCategoryAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = DocumentCategory.objects.create(
            name='Нормативні акти',
            slug='normatyvni-akty',
            order=0,
        )

    def test_list_returns_200(self):
        response = self.client.get('/api/v1/document-categories/')
        self.assertEqual(response.status_code, 200)

    def test_list_contains_category(self):
        response = self.client.get('/api/v1/document-categories/')
        data = response.json()
        items = data if isinstance(data, list) else data.get('results', data)
        slugs = [i['slug'] for i in items]
        self.assertIn('normatyvni-akty', slugs)

    def test_retrieve_by_slug(self):
        response = self.client.get(
            f'/api/v1/document-categories/{self.cat.slug}/'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['name'], 'Нормативні акти')


class DocumentAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = DocumentCategory.objects.create(
            name='Статути', slug='statut', order=0,
        )
        self.doc = Document.objects.create(
            title='Статут ЗДО №52',
            category=self.cat,
            file='documents/statut.pdf',
            description='Основний статутний документ',
            is_published=True,
        )
        # Непублікований — не має з'являтись у списку
        Document.objects.create(
            title='Чернетка документа',
            file='documents/draft.pdf',
            is_published=False,
        )

    def test_list_returns_200(self):
        response = self.client.get('/api/v1/documents/')
        self.assertEqual(response.status_code, 200)

    def test_list_shows_only_published(self):
        response = self.client.get('/api/v1/documents/')
        data = response.json()
        items = data.get('results', data) if isinstance(data, dict) else data
        titles = [i['title'] for i in items]
        self.assertIn('Статут ЗДО №52', titles)
        self.assertNotIn('Чернетка документа', titles)

    def test_retrieve_document(self):
        response = self.client.get(f'/api/v1/documents/{self.doc.pk}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['title'], 'Статут ЗДО №52')

    def test_filter_by_category(self):
        response = self.client.get(
            '/api/v1/documents/', {'category__slug': 'statut'}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        items = data.get('results', data) if isinstance(data, dict) else data
        self.assertTrue(len(items) >= 1)

    def test_track_download_increments(self):
        """POST /track_download/ збільшує лічильник завантажень."""
        initial = Document.objects.get(pk=self.doc.pk).downloads
        response = self.client.post(
            f'/api/v1/documents/{self.doc.pk}/track_download/'
        )
        self.assertEqual(response.status_code, 200)
        updated = Document.objects.get(pk=self.doc.pk).downloads
        self.assertEqual(updated, initial + 1)

    def test_search_by_title(self):
        response = self.client.get('/api/v1/documents/', {'search': 'Статут'})
        self.assertEqual(response.status_code, 200)
