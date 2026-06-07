"""
Інтеграція з Google Gemini (AI Studio): генерація тексту для сайту та
авто-модерація відгуків. Ключ береться з settings.GEMINI_API_KEY (із .env).

Автоматичний фолбек: моделі з settings.GEMINI_MODELS пробуються по черзі —
спершу flash-lite (найбільші безкоштовні ліміти), при 429/помилці/порожній
відповіді переходимо до наступної.
"""
import json
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'


class AIError(Exception):
    """Помилка ШІ (немає ключа / усі моделі недоступні / невалідна відповідь)."""


def is_configured() -> bool:
    return bool(getattr(settings, 'GEMINI_API_KEY', ''))


def _models():
    return getattr(settings, 'GEMINI_MODELS', None) or ['gemini-2.5-flash-lite']


def _generate(prompt, *, system=None, json_schema=None, max_tokens=1024, temperature=0.7, timeout=30):
    """Викликає Gemini, пробуючи моделі по черзі. Повертає текст. Кидає AIError."""
    key = getattr(settings, 'GEMINI_API_KEY', '')
    if not key:
        raise AIError('GEMINI_API_KEY не задано (додайте у .env).')

    gen_cfg = {'maxOutputTokens': max_tokens, 'temperature': temperature}
    if json_schema:
        gen_cfg['responseMimeType'] = 'application/json'
        gen_cfg['responseSchema'] = json_schema
    body = {'contents': [{'parts': [{'text': prompt}]}], 'generationConfig': gen_cfg}
    if system:
        body['systemInstruction'] = {'parts': [{'text': system}]}

    last_err = None
    for model in _models():
        try:
            r = requests.post(_ENDPOINT.format(model=model), params={'key': key}, json=body, timeout=timeout)
        except requests.RequestException as e:
            last_err = f'{model}: {e}'
            logger.warning('Gemini %s — мережева помилка: %s', model, e)
            continue
        if r.status_code == 200:
            try:
                cands = r.json().get('candidates', [])
                if not cands:
                    last_err = f'{model}: немає кандидатів'
                    continue
                parts = cands[0].get('content', {}).get('parts', [])
                text = ''.join(p.get('text', '') for p in parts).strip()
                if text:
                    return text
                last_err = f'{model}: порожня відповідь'
                continue
            except Exception as e:
                last_err = f'{model}: розбір відповіді — {e}'
                continue
        # 429 (ліміт) / 5xx / 404 (нема моделі) / 400 → пробуємо наступну модель
        last_err = f'{model}: HTTP {r.status_code} {r.text[:160]}'
        logger.warning('Gemini %s → HTTP %s, фолбек далі', model, r.status_code)
        continue

    raise AIError(last_err or 'усі моделі недоступні')


# ── Модерація відгуків ──────────────────────────────────────────────────────
_MOD_SCHEMA = {
    'type': 'OBJECT',
    'properties': {'safe': {'type': 'BOOLEAN'}, 'reason': {'type': 'STRING'}},
    'required': ['safe', 'reason'],
}


def moderate_review(text: str):
    """Повертає (safe: bool, reason: str). Кидає AIError при недоступності ШІ."""
    prompt = (
        'Ти — модератор відгуків про дитячий садок. Виріши, чи можна публікувати відгук.\n'
        'ЗАБЛОКУЙ (safe=false), якщо є: нецензурна лексика, образи, погрози, мова ворожнечі, '
        'дискримінація, спам або реклама, особисті дані (телефони, адреси, прізвища сторонніх), '
        'відверто фейковий чи беззмістовний набір символів.\n'
        'ДОЗВОЛЬ (safe=true) звичайні відгуки, зокрема стриману негативну критику без образ.\n'
        'Поверни JSON: {"safe": bool, "reason": "коротко українською чому"}.\n\n'
        f'Відгук:\n"""{text}"""'
    )
    out = _generate(prompt, json_schema=_MOD_SCHEMA, max_tokens=256, temperature=0.0)
    try:
        d = json.loads(out)
        return bool(d.get('safe')), str(d.get('reason') or '').strip()
    except Exception as e:
        raise AIError(f'невалідний JSON модерації: {e}')


# ── Генерація тексту (контекст-залежно) ─────────────────────────────────────
_KIND_GUIDE = {
    'news':    ('новину для сайту дитячого садка', 'Розгорни у повноцінну новину: 2–4 абзаци, за потреби підзаголовок і список. Теплий, доброзичливий тон.'),
    'event':   ('опис події/заходу', 'Привабливий опис події: 1–2 абзаци — що, для кого, чим цікаво.'),
    'faq':     ('відповідь на часте запитання батьків', 'Чітка корисна відповідь: 1–2 абзаци, за потреби короткий список.'),
    'page':    ('текст сторінки сайту', 'Інформативний текст: кілька абзаців, можна підзаголовки та списки.'),
    'bio':     ('опис діяльності / біографію працівника', 'Теплий професійний опис: 1–2 абзаци.'),
    'section': ('опис розділу сторінки', 'Короткий змістовний опис: 1 абзац.'),
    'generic': ('текст для сайту дитячого садка', 'Зроби охайний грамотний текст потрібної довжини.'),
}

_GEN_SYSTEM = (
    'Ти — копірайтер сайту дитячого садка ЗДО №52 (м. Рівне). Пишеш українською — грамотно, '
    'тепло і зрозуміло для батьків. Форматуй відповідь у HTML: <p> для абзаців, <h3> для '
    'підзаголовків, <ul>/<li> для списків, <strong> для акцентів. НЕ використовуй <html>, '
    '<body>, <h1> чи markdown-огорожі ``` — поверни лише готовий HTML-фрагмент вмісту.'
)


def generate_text(brief: str, kind: str = 'generic') -> str:
    label, guide = _KIND_GUIDE.get(kind, _KIND_GUIDE['generic'])
    prompt = f'Напиши {label}. {guide}\n\nКоротка вказівка від працівника (про що текст):\n"""{brief}"""'
    out = _generate(prompt, system=_GEN_SYSTEM, max_tokens=2048, temperature=0.85).strip()
    # прибрати можливі markdown-огорожі ```html ... ```
    if out.startswith('```'):
        out = out.split('\n', 1)[-1] if '\n' in out else out
        if out.rstrip().endswith('```'):
            out = out.rstrip()[:-3]
    return out.strip()
