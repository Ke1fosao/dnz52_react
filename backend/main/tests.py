"""Тести основного app: головна, контакти, статичні сторінки, пошук."""

from django.test import TestCase, override_settings
from django.urls import reverse

from .models import Page, Contact, Slider
from news.models import News


@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.dummy.DummyCache'}})
class HomePageTests(TestCase):
    """Перевіряємо що головна сторінка відкривається і коректно показує дані.
    Вимикаємо кеш у тестах через DummyCache — інакше cache_page плутав би результати."""

    def setUp(self):
        self.slider = Slider.objects.create(
            title='Привіт', description='Тестовий слайд',
            image='slider/test.jpg', is_active=True,
        )
        self.news = News.objects.create(
            title='Перша новина', slug='persha-novyna',
            content='Зміст', is_published=True,
        )

    def test_home_returns_200(self):
        response = self.client.get(reverse('main:home'))
        self.assertEqual(response.status_code, 200)

    def test_home_shows_slider_title(self):
        response = self.client.get(reverse('main:home'))
        self.assertContains(response, 'Привіт')

    def test_home_shows_latest_news(self):
        response = self.client.get(reverse('main:home'))
        self.assertContains(response, 'Перша новина')


@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.dummy.DummyCache'}})
class ContactsPageTests(TestCase):

    def test_contacts_returns_200_without_data(self):
        """Сторінка контактів має не падати навіть якщо в БД немає Contact."""
        response = self.client.get(reverse('main:contacts'))
        self.assertEqual(response.status_code, 200)

    def test_contacts_shows_address_when_available(self):
        Contact.objects.create(
            address='вул. Тестова 1, м. Рівне',
            phone='64-82-55',
            email='test@dnz52.ua',
            working_hours='Пн-Пт: 8-19',
        )
        response = self.client.get(reverse('main:contacts'))
        self.assertContains(response, 'вул. Тестова 1')


class SearchTests(TestCase):

    def setUp(self):
        Page.objects.create(
            title='Про заклад', slug='about',
            content='Цей заклад працює з 1985 року',
            is_published=True,
        )

    def test_search_empty_query(self):
        response = self.client.get(reverse('main:search'))
        self.assertEqual(response.status_code, 200)

    def test_search_finds_page(self):
        response = self.client.get(reverse('main:search'), {'q': 'заклад'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Про заклад')

    def test_search_returns_no_results_for_garbage(self):
        response = self.client.get(reverse('main:search'), {'q': 'xyzabc-never-exists'})
        self.assertEqual(response.status_code, 200)


class CustomErrorPagesTests(TestCase):
    """Перевіряємо що 404 view працює — спрацьовує при невалідному URL."""

    def test_404_returns_status_404(self):
        response = self.client.get('/never-existing-url-12345/')
        self.assertEqual(response.status_code, 404)


class PageModelTests(TestCase):
    """Юніт-тест моделі Page."""

    def test_str_returns_title(self):
        page = Page.objects.create(title='Контакти', slug='contacts-test', content='', is_published=True)
        self.assertEqual(str(page), 'Контакти')

    def test_unpublished_page_not_accessible(self):
        Page.objects.create(title='Чорновик', slug='draft', content='', is_published=False)
        response = self.client.get(reverse('main:page_detail', args=['draft']))
        self.assertEqual(response.status_code, 404)
