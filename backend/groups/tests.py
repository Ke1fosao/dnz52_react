"""Тести app groups: групи та персонал груп."""

from django.test import TestCase
from rest_framework.test import APIClient

from gallery.models import GalleryAlbum, GalleryCategory
from .models import Group, GroupStaff


class GroupAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        cat = GalleryCategory.objects.create(
            name='Групи', slug='hrupy-kat', order=0,
        )
        album = GalleryAlbum.objects.create(
            title='Альбом Сонечко',
            slug='albom-sonechko',
            cover='gallery/covers/sun.jpg',
            category=cat,
            is_published=True,
        )
        self.group = Group.objects.create(
            name='Сонечко',
            slug='sonechko',
            age_group='junior',
            motto='Ми маленьке Сонечко!',
            description='Молодша група дітей 3–4 роки.',
            color='#FFCC00',
            album=album,
            order=1,
            is_published=True,
        )
        GroupStaff.objects.create(
            group=self.group,
            role='teacher',
            full_name='Іваненко Ірина Петрівна',
            experience='5 років',
        )
        # Непублікована група
        Group.objects.create(
            name='Прихована',
            slug='pryhована',
            is_published=False,
            order=99,
        )

    def test_list_returns_200(self):
        response = self.client.get('/api/v1/groups/')
        self.assertEqual(response.status_code, 200)

    def test_list_shows_only_published(self):
        response = self.client.get('/api/v1/groups/')
        data = response.json()
        items = data if isinstance(data, list) else data.get('results', data)
        names = [i['name'] for i in items]
        self.assertIn('Сонечко', names)
        self.assertNotIn('Прихована', names)

    def test_list_contains_age_group_field(self):
        response = self.client.get('/api/v1/groups/')
        data = response.json()
        items = data if isinstance(data, list) else data.get('results', data)
        group_data = next((i for i in items if i['slug'] == 'sonechko'), None)
        self.assertIsNotNone(group_data)
        self.assertIn('age_group', group_data)
        self.assertEqual(group_data['age_group'], 'junior')

    def test_retrieve_by_slug(self):
        response = self.client.get(f'/api/v1/groups/{self.group.slug}/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['name'], 'Сонечко')
        self.assertIn('staff', data)
        self.assertEqual(len(data['staff']), 1)
        self.assertEqual(data['staff'][0]['full_name'], 'Іваненко Ірина Петрівна')

    def test_filter_by_age_group(self):
        response = self.client.get('/api/v1/groups/', {'age_group': 'junior'})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        items = data if isinstance(data, list) else data.get('results', data)
        self.assertTrue(all(i['age_group'] == 'junior' for i in items))

    def test_unpublished_group_not_found(self):
        response = self.client.get('/api/v1/groups/pryhована/')
        self.assertEqual(response.status_code, 404)


class GroupModelTests(TestCase):
    def setUp(self):
        self.group = Group.objects.create(
            name='Зірочка',
            slug='zirochka',
            order=0,
            is_published=True,
        )
        GroupStaff.objects.create(
            group=self.group, role='teacher', full_name='Вчителька',
        )
        GroupStaff.objects.create(
            group=self.group, role='assistant', full_name='Помічниця',
        )

    def test_get_teachers(self):
        teachers = list(self.group.get_teachers())
        self.assertEqual(len(teachers), 1)
        self.assertEqual(teachers[0].full_name, 'Вчителька')

    def test_get_assistants(self):
        assistants = list(self.group.get_assistants())
        self.assertEqual(len(assistants), 1)
        self.assertEqual(assistants[0].full_name, 'Помічниця')

    def test_str(self):
        self.assertEqual(str(self.group), 'Зірочка')
