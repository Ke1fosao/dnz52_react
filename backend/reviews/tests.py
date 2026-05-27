"""Тести app reviews — критичні бо там логіка анти-спаму."""

from django.test import TestCase
from django.urls import reverse

from .models import Review


class ReviewSubmissionTests(TestCase):

    def _form_data(self, **overrides):
        base = {
            'author':      'Марія',
            'child_group': 'Сонечко',
            'rating':      '5',
            'text':        'Чудовий садок, дуже дякуємо!',
            'website':     '',  # honeypot — порожнє для людей
        }
        base.update(overrides)
        return base

    def test_normal_submission_creates_review(self):
        """Звичайний валідний відгук створюється у БД зі статусом is_approved=False."""
        response = self.client.post(reverse('reviews:reviews_page'), self._form_data())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Review.objects.count(), 1)
        review = Review.objects.first()
        self.assertEqual(review.author, 'Марія')
        self.assertFalse(review.is_approved, 'Новий відгук має бути на модерації')

    def test_honeypot_blocks_bot(self):
        """Якщо приховане поле "website" заповнене — це бот, відгук НЕ створюється."""
        data = self._form_data(website='http://spam.example.com')
        self.client.post(reverse('reviews:reviews_page'), data)
        self.assertEqual(Review.objects.count(), 0)

    def test_empty_author_blocks_submission(self):
        data = self._form_data(author='')
        self.client.post(reverse('reviews:reviews_page'), data)
        self.assertEqual(Review.objects.count(), 0)

    def test_empty_text_blocks_submission(self):
        data = self._form_data(text='')
        self.client.post(reverse('reviews:reviews_page'), data)
        self.assertEqual(Review.objects.count(), 0)

    def test_invalid_rating_clamped_to_valid_range(self):
        """Якщо хтось підсуне rating=999 — має бути обмежено до 5."""
        data = self._form_data(rating='999')
        self.client.post(reverse('reviews:reviews_page'), data)
        review = Review.objects.first()
        self.assertIsNotNone(review)
        self.assertEqual(review.rating, 5)


class ReviewsListTests(TestCase):

    def setUp(self):
        for i in range(8):
            Review.objects.create(
                author=f'Користувач {i}',
                rating=5,
                text=f'Відгук {i}',
                is_approved=True,
            )

    def test_only_approved_reviews_shown(self):
        Review.objects.create(author='X', rating=3, text='Прихований', is_approved=False)
        response = self.client.get(reverse('reviews:reviews_page'))
        self.assertNotContains(response, 'Прихований')

    def test_pagination_works(self):
        """6 на сторінці — отже на 8 відгуків має бути 2 сторінки."""
        response = self.client.get(reverse('reviews:reviews_page'))
        self.assertContains(response, 'Сторінка')
        # На другій сторінці теж має бути 200
        response_p2 = self.client.get(reverse('reviews:reviews_page') + '?page=2')
        self.assertEqual(response_p2.status_code, 200)

    def test_filter_by_stars(self):
        Review.objects.create(author='Q', rating=3, text='3-зірковий', is_approved=True)
        response = self.client.get(reverse('reviews:reviews_page') + '?stars=3')
        self.assertContains(response, '3-зірковий')


class ReviewsSortingTests(TestCase):
    """Окремий клас тестів сортування — переконуємось що sort працює над УСІМ
    queryset, а не лише над поточною сторінкою."""

    def setUp(self):
        # Створюємо 13 відгуків з різними рейтингами щоб мати 3 сторінки по 6
        ratings = [5, 5, 5, 5, 4, 4, 4, 3, 3, 2, 2, 1, 1]
        for i, r in enumerate(ratings):
            Review.objects.create(
                author=f'Автор {i}',
                rating=r,
                text=f'Відгук {i} з рейтингом {r}',
                is_approved=True,
            )

    def _extract_ratings(self, response):
        """Витягуємо ratings з контексту page_obj — це найнадійніший спосіб."""
        return [r.rating for r in response.context['page_obj']]

    def test_lowest_sort_page1_returns_lowest_ratings(self):
        response = self.client.get(reverse('reviews:reviews_page') + '?sort=lowest')
        ratings = self._extract_ratings(response)
        # Page 1 має містити перші 6 найнижчих
        self.assertEqual(ratings, sorted(ratings), 'Сторінка 1 має бути відсортована за зростанням')
        # Перший рейтинг — найнижчий у БД (1★)
        self.assertEqual(ratings[0], 1)

    def test_lowest_sort_page2_continues_sort(self):
        response = self.client.get(reverse('reviews:reviews_page') + '?sort=lowest&page=2')
        ratings = self._extract_ratings(response)
        # Page 2 — НЕ повинна починатись з 1, бо 1★ уже на page 1
        self.assertNotEqual(ratings[0], 1)
        # Все ще відсортовано за зростанням всередині сторінки
        self.assertEqual(ratings, sorted(ratings))

    def test_lowest_sort_all_pages_globally_sorted(self):
        """Зливаємо всі сторінки і перевіряємо що весь масив відсортовано."""
        all_ratings = []
        for page in [1, 2, 3]:
            response = self.client.get(reverse('reviews:reviews_page') + f'?sort=lowest&page={page}')
            if response.context.get('page_obj'):
                all_ratings.extend(self._extract_ratings(response))
        # Усі 13 відгуків мають бути відсортовані глобально від низького до високого
        self.assertEqual(all_ratings, sorted(all_ratings),
                         'Sort=lowest має давати глобальний порядок через усі сторінки')

    def test_highest_sort_all_pages_globally_sorted(self):
        all_ratings = []
        for page in [1, 2, 3]:
            response = self.client.get(reverse('reviews:reviews_page') + f'?sort=highest&page={page}')
            if response.context.get('page_obj'):
                all_ratings.extend(self._extract_ratings(response))
        # Має бути від високого до низького
        self.assertEqual(all_ratings, sorted(all_ratings, reverse=True))


class ReviewsLikeSortTests(TestCase):
    """Тести нового сортування за лайками / дизлайками."""

    def setUp(self):
        # Три відгуки з різною кількістю лайків
        self.few_likes = Review.objects.create(
            author='A', rating=5, text='Мало лайків', is_approved=True,
            likes=1, dislikes=5,
        )
        self.many_likes = Review.objects.create(
            author='B', rating=4, text='Багато лайків', is_approved=True,
            likes=15, dislikes=0,
        )
        self.medium = Review.objects.create(
            author='C', rating=3, text='Середньо', is_approved=True,
            likes=7, dislikes=2,
        )

    def test_most_liked_sort_orders_by_likes_desc(self):
        response = self.client.get(reverse('reviews:reviews_page') + '?sort=most_liked')
        ratings_by_text = [r.text for r in response.context['page_obj']]
        # «Багато лайків» (15) має бути першим, «Мало лайків» (1) — останнім
        self.assertEqual(ratings_by_text[0], 'Багато лайків')
        self.assertEqual(ratings_by_text[-1], 'Мало лайків')

    def test_most_disliked_sort_orders_by_dislikes_desc(self):
        response = self.client.get(reverse('reviews:reviews_page') + '?sort=most_disliked')
        ratings_by_text = [r.text for r in response.context['page_obj']]
        # «Мало лайків» має 5 дизлайків — найбільше — має бути першим
        self.assertEqual(ratings_by_text[0], 'Мало лайків')
        # «Багато лайків» має 0 дизлайків — останнім
        self.assertEqual(ratings_by_text[-1], 'Багато лайків')

    def test_invalid_sort_falls_back_to_newest(self):
        response = self.client.get(reverse('reviews:reviews_page') + '?sort=somethingbad')
        self.assertEqual(response.status_code, 200)
        # Перший має бути найновіший (наш `medium` створений останнім у setUp бо C)
        self.assertEqual(response.context['sort'], 'newest')


class ReviewVotingTests(TestCase):
    """Тести голосування 👍 / 👎 за відгуки."""

    def setUp(self):
        self.review = Review.objects.create(
            author='Олена', rating=5, text='Чудово!', is_approved=True,
        )

    def test_like_increments_counter(self):
        url = reverse('reviews:vote_review', args=[self.review.pk, 'like'])
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.review.refresh_from_db()
        self.assertEqual(self.review.likes, 1)
        self.assertEqual(self.review.dislikes, 0)

    def test_dislike_increments_counter(self):
        url = reverse('reviews:vote_review', args=[self.review.pk, 'dislike'])
        self.client.post(url)
        self.review.refresh_from_db()
        self.assertEqual(self.review.dislikes, 1)
        self.assertEqual(self.review.likes, 0)

    def test_cannot_vote_twice_in_same_session(self):
        """Захист — повторне голосування через ту саму сесію відхиляється."""
        url = reverse('reviews:vote_review', args=[self.review.pk, 'like'])
        self.client.post(url)        # перший голос
        response = self.client.post(url)  # другий голос
        self.assertEqual(response.status_code, 400)
        self.review.refresh_from_db()
        self.assertEqual(self.review.likes, 1, 'Лічильник не має збільшитись повторно')

    def test_cannot_vote_for_unpublished(self):
        hidden = Review.objects.create(
            author='X', rating=4, text='Прихований', is_approved=False,
        )
        url = reverse('reviews:vote_review', args=[hidden.pk, 'like'])
        response = self.client.post(url)
        self.assertEqual(response.status_code, 404)

    def test_invalid_action_returns_400(self):
        url = reverse('reviews:vote_review', args=[self.review.pk, 'love'])
        response = self.client.post(url)
        self.assertEqual(response.status_code, 400)

    def test_get_method_not_allowed(self):
        """Голосувати можна тільки POST-ом (захист від CSRF / випадкових GET)."""
        url = reverse('reviews:vote_review', args=[self.review.pk, 'like'])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 405)  # Method Not Allowed

    def test_response_returns_updated_counts(self):
        url = reverse('reviews:vote_review', args=[self.review.pk, 'like'])
        response = self.client.post(url)
        data = response.json()
        self.assertTrue(data.get('ok'))
        self.assertEqual(data.get('likes'), 1)
        self.assertEqual(data.get('your_vote'), 'like')
