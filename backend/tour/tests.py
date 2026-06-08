"""Тести віртуального туру: публічний список + адмін-CRUD."""
import tempfile
from io import BytesIO

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.test import APITestCase

from .models import TourStop

_TMP_MEDIA = tempfile.mkdtemp()


def make_image(name='stop.png'):
    buf = BytesIO()
    Image.new('RGB', (20, 20), (70, 130, 180)).save(buf, 'PNG')
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type='image/png')


@override_settings(MEDIA_ROOT=_TMP_MEDIA)
class TourPublicTests(APITestCase):
    def setUp(self):
        TourStop.objects.create(title='Музична зала', description='Світла зала', image=make_image(), order=1, is_published=True)
        TourStop.objects.create(title='Чернетка зупинки', image=make_image('d.png'), order=2, is_published=False)

    def test_list_returns_published_only(self):
        r = self.client.get('/api/v1/tour/')
        self.assertEqual(r.status_code, 200)
        titles = [s['title'] for s in r.data]
        self.assertIn('Музична зала', titles)
        self.assertNotIn('Чернетка зупинки', titles)


@override_settings(MEDIA_ROOT=_TMP_MEDIA)
class AdminTourTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user('admin', password='x', is_staff=True)

    def test_requires_auth(self):
        r = self.client.get('/api/v1/admin/tour/')
        self.assertIn(r.status_code, (401, 403))

    def test_admin_create_and_list(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post('/api/v1/admin/tour/', {
            'title': 'Спортивна зала', 'description': 'Активні ігри',
            'image': make_image(), 'order': 0, 'is_published': True,
        }, format='multipart')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(TourStop.objects.count(), 1)
        r2 = self.client.get('/api/v1/admin/tour/')
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(len(r2.data), 1)
