"""Тести ШІ-чату (/api/v1/chat/). Реальні виклики Gemini замокані."""
from unittest.mock import patch

from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from main.models import Page


class ChatApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        Page.objects.create(
            title='Батькам', slug='parents',
            content='Документи для зарахування: заява, копія свідоцтва про народження.',
            is_published=True)

    @override_settings(GEMINI_API_KEY='test-key')
    def test_returns_answer_and_sources(self):
        with patch('main.ai.answer_question', return_value='Потрібна заява і копія свідоцтва.') as mock:
            r = self.client.post('/api/v1/chat/',
                                 {'question': 'які документи потрібні для зарахування?'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data['available'])
        self.assertEqual(r.data['answer'], 'Потрібна заява і копія свідоцтва.')
        mock.assert_called_once()

    @override_settings(GEMINI_API_KEY='test-key')
    def test_graceful_on_ai_error(self):
        from main import ai
        with patch('main.ai.answer_question', side_effect=ai.AIError('недоступно')):
            r = self.client.post('/api/v1/chat/', {'question': 'привіт садочок'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['sources'], [])

    @override_settings(GEMINI_API_KEY='')
    def test_fallback_when_not_configured(self):
        r = self.client.post('/api/v1/chat/', {'question': 'привіт'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.data['available'])

    def test_short_question_rejected(self):
        r = self.client.post('/api/v1/chat/', {'question': ''}, format='json')
        self.assertEqual(r.status_code, 400)
