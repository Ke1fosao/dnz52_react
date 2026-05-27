"""Тести app news: список новин, деталі, лічильник переглядів."""

from django.test import TestCase
from django.urls import reverse

from .models import News, NewsCategory


class NewsListTests(TestCase):

    def setUp(self):
        self.cat = NewsCategory.objects.create(name='Свята', slug='svyata')
        for i in range(3):
            News.objects.create(
                title=f'Новина {i}', slug=f'novyna-{i}',
                content=f'Текст {i}', category=self.cat,
                is_published=True,
            )

    def test_news_list_returns_200(self):
        response = self.client.get(reverse('news:news_list'))
        self.assertEqual(response.status_code, 200)

    def test_news_list_shows_all_published(self):
        response = self.client.get(reverse('news:news_list'))
        for i in range(3):
            self.assertContains(response, f'Новина {i}')

    def test_unpublished_news_not_shown(self):
        News.objects.create(title='Прихована', slug='prykhovana', content='', is_published=False)
        response = self.client.get(reverse('news:news_list'))
        self.assertNotContains(response, 'Прихована')


class NewsDetailTests(TestCase):

    def setUp(self):
        self.news = News.objects.create(
            title='Цікава новина', slug='cikava',
            content='<p>Зміст новини</p>', is_published=True,
        )

    def test_news_detail_returns_200(self):
        response = self.client.get(reverse('news:news_detail', args=['cikava']))
        self.assertEqual(response.status_code, 200)

    def test_news_detail_shows_content(self):
        response = self.client.get(reverse('news:news_detail', args=['cikava']))
        self.assertContains(response, 'Зміст новини')

    def test_view_counter_increments(self):
        """Лічильник переглядів має збільшуватись на 1 при кожному заході."""
        initial = News.objects.get(pk=self.news.pk).views
        self.client.get(reverse('news:news_detail', args=['cikava']))
        self.client.get(reverse('news:news_detail', args=['cikava']))
        self.news.refresh_from_db()
        self.assertEqual(self.news.views, initial + 2)

    def test_unpublished_news_returns_404(self):
        News.objects.create(title='Чорновик', slug='draft-news', content='', is_published=False)
        response = self.client.get(reverse('news:news_detail', args=['draft-news']))
        self.assertEqual(response.status_code, 404)
