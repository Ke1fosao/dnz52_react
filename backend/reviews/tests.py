"""API-тести відгуків: список (лише схвалені), антиспам, лайки.

Старі тести були під Django-template версію (`reverse('reviews:...')`, `page_obj`),
якої більше немає — сайт тепер React SPA + DRF API. Переписано під `/api/v1/reviews/`.
"""
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import Review


class ReviewListTests(APITestCase):
    def setUp(self):
        cache.clear()
        for i in range(5):
            Review.objects.create(author=f'Автор {i}', rating=5,
                                  text=f'Чудовий відгук номер {i}', is_approved=True)
        Review.objects.create(author='Прихований', rating=2,
                              text='Цей на модерації', is_approved=False)

    def test_list_returns_200(self):
        r = self.client.get('/api/v1/reviews/')
        self.assertEqual(r.status_code, 200)

    def test_only_approved_shown(self):
        r = self.client.get('/api/v1/reviews/')
        self.assertEqual(r.data['count'], 5)
        authors = [x['author'] for x in r.data['results']]
        self.assertNotIn('Прихований', authors)

    def test_filter_by_rating(self):
        Review.objects.create(author='Три', rating=3, text='Три зірочки', is_approved=True)
        r = self.client.get('/api/v1/reviews/?rating=3')
        self.assertTrue(all(x['rating'] == 3 for x in r.data['results']))

    def test_ordering_param_accepted(self):
        r = self.client.get('/api/v1/reviews/?ordering=rating')
        self.assertEqual(r.status_code, 200)


@override_settings(TURNSTILE_SECRET_KEY='', GEMINI_API_KEY='')
class ReviewCreateTests(APITestCase):
    """Створення відгуку + антиспам. Captcha й ШІ-модерацію вимкнено для детермінізму."""

    def setUp(self):
        cache.clear()

    def _data(self, **ov):
        d = {'author': 'Марія', 'child_group': 'Сонечко', 'rating': 5,
             'text': 'Чудовий садок, дуже дякуємо!', 'website': ''}
        d.update(ov)
        return d

    def test_valid_creates_unapproved(self):
        r = self.client.post('/api/v1/reviews/', self._data())
        self.assertEqual(r.status_code, 201)
        self.assertEqual(Review.objects.count(), 1)
        self.assertFalse(Review.objects.first().is_approved, 'Новий відгук — на модерації')

    def test_honeypot_blocks_bot(self):
        r = self.client.post('/api/v1/reviews/', self._data(website='http://spam.example'))
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Review.objects.count(), 0)

    def test_empty_author_blocked(self):
        r = self.client.post('/api/v1/reviews/', self._data(author=''))
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Review.objects.count(), 0)

    def test_short_text_blocked(self):
        r = self.client.post('/api/v1/reviews/', self._data(text='ок'))
        self.assertEqual(r.status_code, 400)

    def test_invalid_rating_rejected(self):
        r = self.client.post('/api/v1/reviews/', self._data(rating=999))
        self.assertEqual(r.status_code, 400)

    def test_rate_limit_blocks_quick_resubmission(self):
        self.client.post('/api/v1/reviews/', self._data())
        r2 = self.client.post('/api/v1/reviews/', self._data(author='Інша Людина'))
        self.assertEqual(r2.status_code, 429)


class ReviewVoteTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.review = Review.objects.create(author='Олена', rating=5,
                                            text='Просто чудово!', is_approved=True)

    def test_like_increments(self):
        r = self.client.post(f'/api/v1/reviews/{self.review.pk}/like/')
        self.assertEqual(r.status_code, 200)
        self.review.refresh_from_db()
        self.assertEqual(self.review.likes, 1)

    def test_dislike_increments(self):
        self.client.post(f'/api/v1/reviews/{self.review.pk}/dislike/')
        self.review.refresh_from_db()
        self.assertEqual(self.review.dislikes, 1)

    def test_like_unapproved_has_no_effect(self):
        hidden = Review.objects.create(author='X', rating=4, text='Прихований відгук', is_approved=False)
        self.client.post(f'/api/v1/reviews/{hidden.pk}/like/')
        hidden.refresh_from_db()
        self.assertEqual(hidden.likes, 0)
