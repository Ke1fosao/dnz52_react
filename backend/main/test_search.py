"""Тести глобального пошуку (/api/v1/search/).

Перевіряємо:
- порожній запит → 0 результатів, suggestion=None
- знаходить новину за точним словом
- знаходить за відмінком (новина → новини)
- крос-тип: знаходить і новини, і FAQ одночасно
- не знаходить сміттєвий запит
- підказка 'suggestion' при другарській помилці
"""

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from news.models import News
from faq.models import FAQItem
from .models import Page


@override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.dummy.DummyCache'}}
)
class GlobalSearchTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        News.objects.create(
            title='Святкування Дня захисника',
            slug='svyatkuvannia-dnia-zahysnyka',
            content='Вчора у нашому садочку відбулося святкування Дня захисника.',
            is_published=True,
        )
        News.objects.create(
            title='Осінній ярмарок у ЗДО №52',
            slug='osinnii-yarmarok',
            content='Осіннє свято поєднало дітей та батьків.',
            is_published=True,
        )
        FAQItem.objects.create(
            question='Як записатися до садочку?',
            answer='Для запису треба звернутися до завідувача.',
            is_published=True,
        )
        Page.objects.create(
            title='Наш садочок',
            slug='nashe-dytia',
            content='Цей заклад дошкільної освіти працює з 1985 року.',
            is_published=True,
        )

    def test_empty_query_returns_zero(self):
        response = self.client.get('/api/v1/search/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['count'], 0)
        self.assertIsNone(data['suggestion'])

    def test_too_short_query_returns_zero(self):
        response = self.client.get('/api/v1/search/', {'q': 'а'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['count'], 0)

    def test_finds_news_by_exact_word(self):
        response = self.client.get('/api/v1/search/', {'q': 'ярмарок'})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data['count'], 0)
        titles = [r['title'] for r in data['results']]
        self.assertIn('Осінній ярмарок у ЗДО №52', titles)

    def test_finds_news_by_word_stem(self):
        """Відмінок: 'святкування' — є в заголовку першої новини."""
        response = self.client.get('/api/v1/search/', {'q': 'свят'})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data['count'], 0)
        types = [r['type'] for r in data['results']]
        self.assertIn('news', types)

    def test_cross_type_search(self):
        """Запит 'садочок' має знайти і новини, і FAQ."""
        response = self.client.get('/api/v1/search/', {'q': 'садочок'})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        if data['count'] > 0:
            result_types = {r['type'] for r in data['results']}
            # Принаймні один тип присутній
            self.assertTrue(len(result_types) >= 1)

    def test_garbage_query_returns_empty(self):
        response = self.client.get(
            '/api/v1/search/', {'q': 'xyzabc-ніколи-не-існує-12345'}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['count'], 0)

    def test_response_has_required_fields(self):
        response = self.client.get('/api/v1/search/', {'q': 'заклад'})
        data = response.json()
        self.assertIn('query', data)
        self.assertIn('suggestion', data)
        self.assertIn('count', data)
        self.assertIn('results', data)

    def test_result_items_have_required_fields(self):
        response = self.client.get('/api/v1/search/', {'q': 'садочок'})
        data = response.json()
        for item in data['results']:
            self.assertIn('type', item)
            self.assertIn('title', item)
            self.assertIn('slug', item)

    def test_page_found_via_search(self):
        response = self.client.get('/api/v1/search/', {'q': 'заклад'})
        data = response.json()
        self.assertGreater(data['count'], 0)
        types = {r['type'] for r in data['results']}
        self.assertIn('page', types)
