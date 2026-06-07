"""Тести app gallery: категорії альбомів, альбоми, фото."""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import GalleryCategory, GalleryAlbum, GalleryPhoto


class GalleryCategoryAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = GalleryCategory.objects.create(
            name='Свята',
            slug='sviata',
            icon='bi-balloon-fill',
            color='#4A90E2',
            order=0,
        )

    def test_list_returns_200(self):
        response = self.client.get('/api/v1/gallery/categories/')
        self.assertEqual(response.status_code, 200)

    def test_list_contains_category(self):
        response = self.client.get('/api/v1/gallery/categories/')
        data = response.json()
        # Без пагінації — список або результат з ключем results
        items = data if isinstance(data, list) else data.get('results', data)
        names = [i['name'] for i in items]
        self.assertIn('Свята', names)

    def test_retrieve_by_slug(self):
        response = self.client.get(f'/api/v1/gallery/categories/{self.cat.slug}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['slug'], 'sviata')


class GalleryAlbumAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = GalleryCategory.objects.create(
            name='Заняття', slug='zaniattia', order=0,
        )
        self.album = GalleryAlbum.objects.create(
            title='Осінній ярмарок',
            slug='osinni-yarmarok',
            description='Фото з осіннього ярмарку',
            cover='gallery/covers/test.jpg',
            category=self.cat,
            is_published=True,
        )
        # Непублікований альбом — не має потрапити до списку
        GalleryAlbum.objects.create(
            title='Чернетка',
            slug='chernietka',
            cover='gallery/covers/draft.jpg',
            is_published=False,
        )
        GalleryPhoto.objects.create(
            album=self.album,
            image='gallery/photos/test.jpg',
            title='Фото 1',
            order=0,
        )

    def test_list_returns_200(self):
        response = self.client.get('/api/v1/gallery/albums/')
        self.assertEqual(response.status_code, 200)

    def test_list_shows_only_published(self):
        response = self.client.get('/api/v1/gallery/albums/')
        data = response.json()
        items = data.get('results', data) if isinstance(data, dict) else data
        slugs = [i['slug'] for i in items]
        self.assertIn('osinni-yarmarok', slugs)
        self.assertNotIn('chernietka', slugs)

    def test_detail_returns_photos(self):
        response = self.client.get(f'/api/v1/gallery/albums/{self.album.slug}/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['title'], 'Осінній ярмарок')
        self.assertIn('photos', data)
        self.assertEqual(len(data['photos']), 1)

    def test_filter_by_category(self):
        response = self.client.get(
            '/api/v1/gallery/albums/',
            {'category__slug': 'zaniattia'},
        )
        self.assertEqual(response.status_code, 200)

    def test_unpublished_album_not_found(self):
        response = self.client.get('/api/v1/gallery/albums/chernietka/')
        self.assertEqual(response.status_code, 404)
