"""API-тести новин: список (лише live), деталі, лічильник переглядів, прев'ю чернеток.

Переписано зі старих template-тестів (`reverse('news:...')`) під `/api/v1/news/`.
"""
from django.core.cache import cache
from rest_framework.test import APITestCase

from .models import News


class NewsApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.pub = News.objects.create(
            title='Свято осені', slug='svjato-oseni',
            content='Текст новини про осіннє свято у садочку.',
            status=News.Status.PUBLISHED)
        self.draft = News.objects.create(
            title='Чернетка новини', slug='chernetka',
            content='Ще не готово до публікації', status=News.Status.DRAFT)

    def test_list_returns_200(self):
        r = self.client.get('/api/v1/news/')
        self.assertEqual(r.status_code, 200)

    def test_list_shows_published_only(self):
        r = self.client.get('/api/v1/news/')
        slugs = [n['slug'] for n in r.data['results']]
        self.assertIn('svjato-oseni', slugs)
        self.assertNotIn('chernetka', slugs)

    def test_detail_returns_200(self):
        r = self.client.get('/api/v1/news/svjato-oseni/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['title'], 'Свято осені')

    def test_draft_detail_is_preview(self):
        """Чернетку можна відкрити за прямим slug (прев'ю для адміна), з позначкою."""
        r = self.client.get('/api/v1/news/chernetka/')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data.get('is_preview'))

    def test_view_counter_increments_with_count_param(self):
        self.assertEqual(self.pub.views, 0)
        self.client.get('/api/v1/news/svjato-oseni/?count=1')
        self.pub.refresh_from_db()
        self.assertEqual(self.pub.views, 1)

    def test_view_counter_not_incremented_without_param(self):
        self.client.get('/api/v1/news/svjato-oseni/')
        self.pub.refresh_from_db()
        self.assertEqual(self.pub.views, 0)

    def test_view_counter_deduplicated_per_ip(self):
        """Повторний ?count=1 з того ж IP протягом 6 год НЕ накручує лічильник."""
        self.client.get('/api/v1/news/svjato-oseni/?count=1')
        self.client.get('/api/v1/news/svjato-oseni/?count=1')
        self.pub.refresh_from_db()
        self.assertEqual(self.pub.views, 1)
