"""Тести модуля ШІ (main.ai).

ПРАВИЛО: ніяких реальних мережевих викликів. Усі `requests.post` замокані.
Перевіряємо поведінку moderate_review, generate_text, is_configured, _generate:
- is_configured при наявності/відсутності ключа
- moderate_review парсить JSON-вердикт (safe + reason)
- moderate_review кидає AIError при невалідному JSON
- generate_text повертає HTML-рядок
- _generate здійснює фолбек при 429 до наступної моделі
- _generate кидає AIError якщо всі моделі недоступні
- _generate кидає AIError якщо GEMINI_API_KEY не задано
"""

import json
import unittest
from unittest.mock import patch, MagicMock

from django.test import TestCase, override_settings


class IsConfiguredTests(TestCase):
    @override_settings(GEMINI_API_KEY='test-key-123')
    def test_is_configured_true_when_key_set(self):
        from main.ai import is_configured
        self.assertTrue(is_configured())

    @override_settings(GEMINI_API_KEY='')
    def test_is_configured_false_when_no_key(self):
        from main.ai import is_configured
        self.assertFalse(is_configured())


class ModerateReviewTests(TestCase):
    """Тести функції moderate_review з мок-відповідями Gemini."""

    def _make_gemini_response(self, payload: dict, status_code: int = 200):
        """Будує мок-об'єкт відповіді Gemini."""
        mock_resp = MagicMock()
        mock_resp.status_code = status_code
        text_content = json.dumps(payload)
        mock_resp.json.return_value = {
            'candidates': [{
                'content': {
                    'parts': [{'text': text_content}]
                }
            }]
        }
        mock_resp.text = f'HTTP {status_code}'
        return mock_resp

    @override_settings(
        GEMINI_API_KEY='fake-key',
        GEMINI_MODELS=['gemini-test-model'],
    )
    @patch('requests.post')
    def test_moderate_safe_review(self, mock_post):
        mock_post.return_value = self._make_gemini_response(
            {'safe': True, 'reason': 'Звичайний позитивний відгук'}
        )
        from main.ai import moderate_review
        safe, reason = moderate_review('Чудовий садочок!')
        self.assertTrue(safe)
        self.assertIn('позитивний', reason)

    @override_settings(
        GEMINI_API_KEY='fake-key',
        GEMINI_MODELS=['gemini-test-model'],
    )
    @patch('requests.post')
    def test_moderate_unsafe_review(self, mock_post):
        mock_post.return_value = self._make_gemini_response(
            {'safe': False, 'reason': 'Містить образливу лексику'}
        )
        from main.ai import moderate_review
        safe, reason = moderate_review('Жахливе місце!')
        self.assertFalse(safe)
        self.assertIn('образлив', reason)

    @override_settings(
        GEMINI_API_KEY='fake-key',
        GEMINI_MODELS=['gemini-test-model'],
    )
    @patch('requests.post')
    def test_moderate_invalid_json_raises_ai_error(self, mock_post):
        """Якщо модель повертає не JSON — кидаємо AIError."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            'candidates': [{
                'content': {'parts': [{'text': 'не JSON взагалі!!!'}]}
            }]
        }
        mock_post.return_value = mock_resp
        from main.ai import moderate_review, AIError
        with self.assertRaises(AIError):
            moderate_review('Тестовий відгук')


class GenerateTests(TestCase):
    """Тести функції generate_text та внутрішнього _generate."""

    def _ok_response(self, html_text: str):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            'candidates': [{
                'content': {'parts': [{'text': html_text}]}
            }]
        }
        return mock_resp

    @override_settings(
        GEMINI_API_KEY='fake-key',
        GEMINI_MODELS=['gemini-test-model'],
    )
    @patch('requests.post')
    def test_generate_text_returns_html(self, mock_post):
        html = '<p class="lead">Тестовий текст 🌟</p>'
        mock_post.return_value = self._ok_response(html)
        from main.ai import generate_text
        result = generate_text('Привітання для батьків', kind='news')
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)

    @override_settings(
        GEMINI_API_KEY='fake-key',
        GEMINI_MODELS=['gemini-test-model'],
    )
    @patch('requests.post')
    def test_generate_text_strips_markdown_fences(self, mock_post):
        """Модель може загорнути відповідь у ```html ... ``` — маємо прибрати."""
        html = '```html\n<p>Чистий HTML</p>\n```'
        mock_post.return_value = self._ok_response(html)
        from main.ai import generate_text
        result = generate_text('Тест', kind='generic')
        self.assertNotIn('```', result)

    @override_settings(
        GEMINI_API_KEY='',
        GEMINI_MODELS=['gemini-test-model'],
    )
    def test_generate_raises_ai_error_without_key(self):
        """Якщо ключ відсутній — _generate кидає AIError одразу."""
        from main.ai import _generate, AIError
        with self.assertRaises(AIError):
            _generate('Будь-який prompt')


class FallbackTests(TestCase):
    """Тести механізму фолбеку між моделями."""

    @override_settings(
        GEMINI_API_KEY='fake-key',
        GEMINI_MODELS=['model-bad', 'model-good'],
    )
    @patch('requests.post')
    def test_fallback_on_429(self, mock_post):
        """При HTTP 429 на першій моделі переходимо до другої."""
        bad_resp = MagicMock()
        bad_resp.status_code = 429
        bad_resp.text = 'Rate limit exceeded'

        good_resp = MagicMock()
        good_resp.status_code = 200
        good_resp.json.return_value = {
            'candidates': [{'content': {'parts': [{'text': 'Відповідь від резервної моделі'}]}}]
        }

        mock_post.side_effect = [bad_resp, good_resp]
        from main.ai import _generate
        result = _generate('Тест фолбеку')
        self.assertEqual(result, 'Відповідь від резервної моделі')
        self.assertEqual(mock_post.call_count, 2)

    @override_settings(
        GEMINI_API_KEY='fake-key',
        GEMINI_MODELS=['model-a', 'model-b'],
    )
    @patch('requests.post')
    def test_all_models_fail_raises_ai_error(self, mock_post):
        """Якщо всі моделі повертають помилку — кидаємо AIError."""
        fail_resp = MagicMock()
        fail_resp.status_code = 500
        fail_resp.text = 'Internal Server Error'
        mock_post.return_value = fail_resp

        from main.ai import _generate, AIError
        with self.assertRaises(AIError):
            _generate('Тест всіх помилок')

    @override_settings(
        GEMINI_API_KEY='fake-key',
        GEMINI_MODELS=['model-network-err'],
    )
    @patch('requests.post')
    def test_network_error_raises_ai_error(self, mock_post):
        """Мережева помилка (requests.RequestException) → AIError."""
        import requests
        mock_post.side_effect = requests.RequestException('Connection refused')
        from main.ai import _generate, AIError
        with self.assertRaises(AIError):
            _generate('Тест мережевої помилки')

    @override_settings(
        GEMINI_API_KEY='fake-key',
        GEMINI_MODELS=['model-empty'],
    )
    @patch('requests.post')
    def test_empty_response_falls_to_next(self, mock_post):
        """Порожня відповідь від першої моделі → AIError (більше моделей нема)."""
        empty_resp = MagicMock()
        empty_resp.status_code = 200
        empty_resp.json.return_value = {
            'candidates': [{'content': {'parts': [{'text': ''}]}}]
        }
        mock_post.return_value = empty_resp
        from main.ai import _generate, AIError
        with self.assertRaises(AIError):
            _generate('Тест порожньої відповіді')
