"""Тести заявок на зарахування: публічне створення (+антиспам) і адмін-керування."""
from datetime import date

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import EnrollmentApplication


@override_settings(TURNSTILE_SECRET_KEY='')
class EnrollmentCreateTests(APITestCase):
    def setUp(self):
        cache.clear()

    def _data(self, **ov):
        d = {'child_name': 'Олег', 'child_birth_date': '2021-05-10', 'parent_name': 'Ірина',
             'phone': '+380501234567', 'desired_start': 'вересень 2026', 'note': '', 'website': ''}
        d.update(ov)
        return d

    def test_valid_creates_new(self):
        r = self.client.post('/api/v1/enrollment/', self._data(), format='json')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(EnrollmentApplication.objects.count(), 1)
        self.assertEqual(EnrollmentApplication.objects.first().status, EnrollmentApplication.Status.NEW)

    def test_honeypot_blocks_bot(self):
        r = self.client.post('/api/v1/enrollment/', self._data(website='http://spam'), format='json')
        self.assertEqual(r.status_code, 400)
        self.assertEqual(EnrollmentApplication.objects.count(), 0)

    def test_missing_child_name_blocked(self):
        r = self.client.post('/api/v1/enrollment/', self._data(child_name=''), format='json')
        self.assertEqual(r.status_code, 400)

    def test_rate_limit_second_blocked(self):
        self.client.post('/api/v1/enrollment/', self._data(), format='json')
        r2 = self.client.post('/api/v1/enrollment/', self._data(parent_name='Інша'), format='json')
        self.assertEqual(r2.status_code, 429)


class AdminEnrollmentTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user('admin', password='x', is_staff=True)
        self.app = EnrollmentApplication.objects.create(
            child_name='Тест', child_birth_date=date(2021, 1, 1), parent_name='Батько', phone='123456')

    def test_list_requires_auth(self):
        r = self.client.get('/api/v1/admin/enrollment/')
        self.assertIn(r.status_code, (401, 403))

    def test_admin_list_and_update_sets_handler(self):
        self.client.force_authenticate(self.admin)
        r = self.client.get('/api/v1/admin/enrollment/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 1)
        r2 = self.client.patch(f'/api/v1/admin/enrollment/{self.app.pk}/',
                               {'status': 'approved', 'admin_note': 'погоджено'}, format='json')
        self.assertEqual(r2.status_code, 200)
        self.app.refresh_from_db()
        self.assertEqual(self.app.status, 'approved')
        self.assertEqual(self.app.handled_by, self.admin)
        self.assertIsNotNone(self.app.handled_at)
