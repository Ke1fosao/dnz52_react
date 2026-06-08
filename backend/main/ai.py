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
    'news':    ('новину для сайту дитячого садка', 'Повноцінна жвава стаття: вступ <p class="lead">, 2–4 смислові секції <h3>, хоча б один список <ul> з емодзі-пунктами, теплий <blockquote> з думкою/цитатою і підбадьорливий фінальний абзац.'),
    'event':   ('анонс / опис події', 'Святковий жвавий опис: вступ <p class="lead">, 1–2 короткі секції, за потреби невеликий список. Коротше за новину.'),
    'faq':     ('відповідь на часте запитання батьків', 'Чітка корисна відповідь: 1–2 абзаци, за потреби короткий список. Емодзі помірно.'),
    'page':    ('текст сторінки сайту', 'Структуровано: вступ <p class="lead">, кілька <h3>-секцій, списки де доречно.'),
    'bio':     ('опис діяльності / біографію працівника', 'Теплий професійний опис: 1–2 абзаци, можна короткий список сильних сторін. Стримано з емодзі.'),
    'section': ('короткий опис розділу сторінки', '1 невеликий абзац (можна <p class="lead">), без зайвих секцій.'),
    'generic': ('текст для сайту дитячого садка', 'Охайний структурований текст потрібної довжини у фірмовому стилі.'),
}

_GEN_SYSTEM = (
    'Ти — копірайтер сайту дитячого садка ЗДО №52 (м. Рівне). Пишеш українською — тепло, '
    'доброзичливо, грамотно і зрозуміло для батьків.\n\n'
    'ФОРМАТ — лише готовий HTML-фрагмент (БЕЗ <html>, <body>, <h1> і БЕЗ markdown-огорож ```).\n'
    'Пиши у ФІРМОВОМУ СТИЛІ сайту — насичено, структуровано, з доречними емодзі:\n'
    '• Вступ — абзац <p class="lead">…</p> з 1–2 емодзі.\n'
    '• Смислові секції із заголовками <h3>…</h3> (можна з емодзі на початку).\n'
    '• Де доречно — списки <ul><li>…: кожен пункт = доречний емодзі + <strong>ключове</strong> — короткий опис.\n'
    '• Для теплої думки/цитати — <blockquote>«…», — підпис.</blockquote>\n'
    '• Важливе — <strong>, відтінки — <em>. Емодзі тактовно (в заголовках, пунктах, вступі, фіналі), без перебору.\n'
    '• Завершуй коротким підбадьорливим абзацом з 1–2 емодзі.\n\n'
    'ПРИКЛАД СТИЛЮ (адаптуй зміст під завдання, НЕ копіюй дослівно):\n'
    '<p class="lead">У старших групах ЗДО №52 тривають <strong>заняття з підготовки до школи</strong> 📚 Ми впевнено крокуємо назустріч першому дзвонику!</p>\n'
    '<h3>Наш підхід</h3>\n'
    '<p>Ми переконані: <strong>школа — це захоплива пригода</strong>, а не іспит. Тому <em>формуємо інтерес до навчання</em>.</p>\n'
    '<ul>\n'
    '  <li>🧠 <strong>Логічне мислення</strong> — порівнюємо, аналізуємо, шукаємо закономірності;</li>\n'
    '  <li>💬 <strong>Мовлення</strong> — переказуємо казки, складаємо власні історії;</li>\n'
    '  <li>🎨 <strong>Творчість</strong> — малювання, аплікації, ліплення.</li>\n'
    '</ul>\n'
    '<blockquote>«Найважливіше — щоб дитина прийшла до школи з посмішкою», — вихователь-методист.</blockquote>\n'
    '<p>Адже наші випускники — це наша гордість і майбутнє! 🌟📚</p>'
)


def generate_text(brief: str, kind: str = 'generic') -> str:
    from .sanitize import clean_html
    label, guide = _KIND_GUIDE.get(kind, _KIND_GUIDE['generic'])
    prompt = f'Напиши {label}. {guide}\n\nКоротка вказівка від працівника (про що текст):\n"""{brief}"""'
    out = _generate(prompt, system=_GEN_SYSTEM, max_tokens=2048, temperature=0.85).strip()
    # прибрати можливі markdown-огорожі ```html ... ```
    if out.startswith('```'):
        out = out.split('\n', 1)[-1] if '\n' in out else out
        if out.rstrip().endswith('```'):
            out = out.rstrip()[:-3]
    return clean_html(out.strip())


# ── Чат-помічник для батьків ────────────────────────────────────────────────
_CHAT_SYSTEM = (
    'Ти — Сонечко, доброзичливий віртуальний помічник сайту Закладу дошкільної освіти №52 '
    '(ЗДО №52, м. Рівне). Допомагаєш батькам знайти інформацію про садочок.\n'
    'Відповідай УКРАЇНСЬКОЮ — тепло, ввічливо, коротко і по суті (2–6 речень або короткий список).\n'
    'Спирайся НАСАМПЕРЕД на наданий «Контекст із сайту» та загальні знання про дитячі садки. '
    'Якщо точної інформації немає в контексті — чесно скажи про це й запропонуй переглянути '
    'відповідний розділ сайту або звернутися на сторінці «Контакти». '
    'НЕ ВИГАДУЙ конкретних фактів (телефонів, цін, дат, прізвищ), яких немає в контексті.\n'
    'Формат — звичайний текст або простий Markdown (списки «- », **жирний**). БЕЗ HTML, без вигаданих посилань.'
)


def answer_question(question: str, context: str = '', history=None) -> str:
    """Відповідь чат-бота на основі контексту з сайту. Кидає AIError при недоступності ШІ."""
    convo = ''
    if history:
        lines = []
        for h in history[-4:]:
            if not isinstance(h, dict):
                continue
            role = 'Батьки' if h.get('role') == 'user' else 'Помічник'
            text = str(h.get('content') or '')[:400]
            if text:
                lines.append(f'{role}: {text}')
        if lines:
            convo = 'Попередній діалог:\n' + '\n'.join(lines) + '\n\n'
    ctx = (context or '').strip() or 'На сайті не знайдено релевантної інформації за цим запитом.'
    prompt = (
        f'Контекст із сайту ЗДО №52:\n"""\n{ctx}\n"""\n\n'
        f'{convo}'
        f'Запитання батьків: {question}\n\n'
        'Дай корисну відповідь українською:'
    )
    return _generate(prompt, system=_CHAT_SYSTEM, max_tokens=700, temperature=0.4)
