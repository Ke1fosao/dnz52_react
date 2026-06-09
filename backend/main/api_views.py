from django.core.cache import cache

from rest_framework import viewsets, mixins
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import (
    Page, Slider, Contact,
    ParentsAnnouncement, ParentsDocument, ParentsAdaptationPhoto,
    ParentsEnrollmentDoc, ParentsApplicationSample,
    StaffMember,
    AttestationDocument, AttestationStep, AttestationCategory,
    AttestationLaw, AttestationSettings,
)
from .serializers import (
    PageSerializer, PageListSerializer,
    SliderSerializer, ContactSerializer,
    ParentsAnnouncementSerializer, ParentsDocumentSerializer,
    ParentsAdaptationPhotoSerializer, ParentsEnrollmentDocSerializer,
    ParentsApplicationSampleSerializer,
    StaffMemberSerializer,
    AttestationDocumentSerializer, AttestationStepSerializer,
    AttestationCategorySerializer, AttestationLawSerializer,
    AttestationSettingsSerializer,
)


class PageViewSet(viewsets.ReadOnlyModelViewSet):
    """Статичні сторінки: list, retrieve по slug."""
    queryset = Page.objects.filter(is_published=True).prefetch_related('images')
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'list':
            return PageListSerializer
        return PageSerializer


class SliderViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Slider.objects.filter(is_active=True)
    serializer_class = SliderSerializer
    pagination_class = None  # слайди без пагінації


class ContactViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    pagination_class = None


class ParentsAnnouncementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ParentsAnnouncement.objects.filter(is_active=True)
    serializer_class = ParentsAnnouncementSerializer
    pagination_class = None


class ParentsDocumentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ParentsDocument.objects.filter(is_active=True)
    serializer_class = ParentsDocumentSerializer
    pagination_class = None


class ParentsAdaptationPhotoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ParentsAdaptationPhoto.objects.filter(is_active=True)
    serializer_class = ParentsAdaptationPhotoSerializer
    pagination_class = None


class ParentsEnrollmentDocViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ParentsEnrollmentDoc.objects.filter(is_active=True)
    serializer_class = ParentsEnrollmentDocSerializer
    pagination_class = None


class ParentsApplicationSampleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ParentsApplicationSample.objects.filter(is_active=True)
    serializer_class = ParentsApplicationSampleSerializer
    pagination_class = None


class StaffMemberViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StaffMember.objects.filter(is_active=True)
    serializer_class = StaffMemberSerializer
    pagination_class = None


class AttestationDocumentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttestationDocument.objects.filter(is_active=True)
    serializer_class = AttestationDocumentSerializer
    pagination_class = None


class AttestationStepViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttestationStep.objects.filter(is_active=True)
    serializer_class = AttestationStepSerializer
    pagination_class = None


class AttestationCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttestationCategory.objects.filter(is_active=True)
    serializer_class = AttestationCategorySerializer
    pagination_class = None


class AttestationLawViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttestationLaw.objects.filter(is_active=True)
    serializer_class = AttestationLawSerializer
    pagination_class = None


@api_view(['GET'])
@permission_classes([AllowAny])
def attestation_settings(request):
    """Один загальний об'єкт налаштувань атестації."""
    obj = AttestationSettings.get_solo()
    return Response(AttestationSettingsSerializer(obj).data)


# ============================================================================
# Розумний глобальний пошук
# ----------------------------------------------------------------------------
# Працює на SQLite без зовнішніх залежностей. Будує невеликий індекс контенту
# в памʼяті й оцінює релевантність у Python: токенізація, українські відмінки
# (через спільну основу), стійкість до друкарських помилок (Левенштейн),
# ранжування, підказка «можливо, ви мали на увазі» та сніпети з підсвічуванням.
# ============================================================================
import re as _re
from difflib import SequenceMatcher as _SeqMatcher  # noqa: F401 (резерв)

_SEARCH_WORD_RE = _re.compile(r"[0-9a-zA-Zа-яА-ЯіїєґІЇЄҐ'\-]+")

# Короткі службові слова — не враховуємо в релевантності й не «виправляємо».
_SEARCH_STOPWORDS = {
    'та', 'і', 'й', 'в', 'у', 'з', 'зі', 'із', 'на', 'до', 'по', 'за', 'про', 'для',
    'від', 'під', 'над', 'що', 'як', 'це', 'цей', 'ця', 'ці', 'то', 'а', 'але', 'або',
    'чи', 'не', 'ні', 'так', 'є', 'ще', 'вже', 'ми', 'ви', 'він', 'вона', 'воно', 'they',
    'the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'for', 'to', 'is',
}


def _search_normalize(text):
    """Нижній регістр + уніфікація апострофів (зберігає довжину рядка)."""
    if not text:
        return ''
    text = text.lower()
    for ch in ('ʼ', '`', '’', '‘', '´'):
        text = text.replace(ch, "'")
    return text


def _search_strip_markup(text):
    """Прибирає markdown/HTML, лишає чистий текст (для індексу й сніпетів)."""
    if not text:
        return ''
    text = _re.sub(r'!\[[^\]]*\]\([^)]*\)', ' ', text)        # ![alt](src)
    text = _re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', text)      # [text](href) → text
    text = _re.sub(r'<[^>]+>', ' ', text)                      # html-теги
    text = _re.sub(r'[#>*_`~|]+', ' ', text)                   # markdown-символи
    text = _re.sub(r'\s+', ' ', text)
    return text.strip()


def _search_tokens(text):
    return [t for t in _SEARCH_WORD_RE.findall(_search_normalize(text)) if len(t) >= 2]


def _bounded_levenshtein(a, b, max_d):
    """Відстань Левенштейна з ранньою зупинкою (повертає max_d+1, якщо більша)."""
    la, lb = len(a), len(b)
    if abs(la - lb) > max_d:
        return max_d + 1
    prev = list(range(lb + 1))
    for i in range(1, la + 1):
        cur = [i] + [0] * lb
        row_min = i
        ca = a[i - 1]
        for j in range(1, lb + 1):
            cost = 0 if ca == b[j - 1] else 1
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
            if cur[j] < row_min:
                row_min = cur[j]
        if row_min > max_d:
            return max_d + 1
        prev = cur
    return prev[lb]


def _common_prefix_len(a, b):
    n = min(len(a), len(b))
    i = 0
    while i < n and a[i] == b[i]:
        i += 1
    return i


def _search_match_quality(qt, w):
    """Наскільки слово зі словника сайту (w) відповідає токену запиту (qt): 0..1."""
    if qt == w:
        return 1.0
    lq, lw = len(qt), len(w)
    # Один токен є початком іншого: новин→новини, дит→дитячий, святковий⊃свят
    if lq >= 3 and w.startswith(qt):
        return 0.9
    if lw >= 4 and qt.startswith(w):
        return 0.85
    # Спільна основа — українські відмінки (новина / новини / новиною)
    cp = _common_prefix_len(qt, w)
    if cp >= 4 and cp >= min(lq, lw) - 3:
        return 0.8
    # Значуще входження для складених слів (садок ⊂ дитсадок); обидва ≥5, щоб
    # короткі суфікси (коли ⊂ школи) не давали хибних збігів.
    if lq >= 5 and lw >= 5 and (qt in w or w in qt):
        return 0.7
    # Відстань Левенштейна — друкарські помилки (новена → новини).
    # Перша літера має збігатися — це різко прибирає хибні збіги (школи↔коли).
    longest = max(lq, lw)
    if longest <= 3 or qt[0] != w[0]:
        return 0.0
    max_d = 1 if longest <= 5 else (2 if longest <= 8 else 3)
    d = _bounded_levenshtein(qt, w, max_d)
    if d <= max_d:
        return max(0.45, 1.0 - d / longest)
    return 0.0


def _search_snippet(text, matched_terms, length=200):
    """Фрагмент тексту навколо першого збігу (для контексту в результатах)."""
    text = _re.sub(r'\s+', ' ', text or '').strip()
    if not text:
        return ''
    low = _search_normalize(text)
    pos = -1
    for term in matched_terms:
        i = low.find(term)
        if i != -1 and (pos == -1 or i < pos):
            pos = i
    if pos <= 50:
        snippet = text[:length]
        return snippet + ('…' if len(text) > length else '')
    start = pos - 40
    snippet = text[start:start + length].strip()
    return '…' + snippet + ('…' if start + length < len(text) else '')


def _build_search_index():
    """Будує повний індекс пошуку (усі моделі). Кешується 10 хвилин."""
    from django.db.models import Q
    from django.utils import timezone
    from news.models import News
    from groups.models import Group
    from circles.models import Circle
    from documents.models import Document
    from specialists.models import SpecialistPage
    from events.models import Event
    from faq.models import FAQItem
    from gallery.models import GalleryAlbum

    now = timezone.now()
    index = []

    def add(type_, title, slug, body, *, excerpt=None, date=None, weight=1.0):
        title_tokens = set(_search_tokens(title))
        body_tokens = set(_search_tokens(body))
        index.append({
            'type': type_, 'title': title or '', 'slug': str(slug),
            'excerpt_src': (excerpt if excerpt is not None else body) or '',
            'title_tokens': title_tokens,
            'body_tokens': body_tokens - title_tokens,
            'all_tokens': title_tokens | body_tokens,
            'title_norm': _search_normalize(title or ''),
            'date': date, 'weight': weight,
        })

    for n in News.objects.filter(
        Q(status=News.Status.PUBLISHED) | Q(status=News.Status.SCHEDULED, publish_at__lte=now)
    ).prefetch_related('tags')[:400]:
        body = _search_strip_markup(n.content)
        tags = ' '.join(t.name for t in n.tags.all())
        add('news', n.title, n.slug, body + ' ' + tags, excerpt=body, date=n.created_at, weight=1.15)

    for p in Page.objects.filter(is_published=True)[:200]:
        body = _search_strip_markup(p.content)
        add('page', p.title, p.slug, body, excerpt=body, weight=1.1)

    for g in Group.objects.filter(is_published=True):
        desc = _search_strip_markup(g.description)
        add('group', g.name, g.slug, desc + ' ' + (g.motto or ''), excerpt=(g.motto or desc), weight=1.0)

    for c in Circle.objects.filter(is_published=True):
        desc = _search_strip_markup(c.description)
        add('circle', c.name, c.slug, desc + ' ' + (c.leader or ''), excerpt=(desc or c.leader or ''), weight=1.0)

    for s in SpecialistPage.objects.all():
        intro = _search_strip_markup(getattr(s, 'intro', '') or '')
        add('specialist', s.title, s.page_type, _search_strip_markup(s.description) + ' ' + intro,
            excerpt=(intro or _search_strip_markup(s.description)), weight=1.0)

    for d in Document.objects.filter(is_published=True):
        add('document', d.title, str(d.id), d.description or '', excerpt=(d.description or ''), weight=0.9)

    for e in Event.objects.filter(is_published=True)[:300]:
        desc = _search_strip_markup(e.description)
        add('event', e.title, e.slug, desc + ' ' + (e.location or ''), excerpt=(e.location or desc),
            date=e.start_date, weight=0.9)

    for f in FAQItem.objects.filter(is_published=True):
        body = _search_strip_markup(f.answer)
        add('faq', f.question, str(f.id), body, excerpt=body, weight=0.95)

    for a in GalleryAlbum.objects.filter(is_published=True)[:300]:
        add('album', a.title, a.slug, a.description or '', excerpt=(a.description or ''), weight=0.9)

    return index


@api_view(['GET'])
@permission_classes([AllowAny])
def global_search(request):
    """Розумний пошук по всьому сайту (новини, сторінки, групи, гуртки,
    спеціалісти, документи, події, FAQ, фотоальбоми) з урахуванням відмінків,
    друкарських помилок та релевантності."""
    from django.utils import timezone

    raw_q = request.query_params.get('q', '').strip()
    if not raw_q or len(raw_q) < 2:
        return Response({'query': raw_q, 'suggestion': None, 'count': 0, 'results': []})

    query_tokens = _search_tokens(raw_q)
    core_tokens = [t for t in query_tokens if t not in _SEARCH_STOPWORDS] or query_tokens
    if not core_tokens:
        return Response({'query': raw_q, 'suggestion': None, 'count': 0, 'results': []})

    now = timezone.now()
    index = cache.get_or_set('search_index_v1', _build_search_index, 600)

    # Словник усіх слів сайту → розширюємо кожен токен запиту (точний / основа / помилка)
    vocab = set()
    for it in index:
        vocab |= it['all_tokens']
    vocab_list = list(vocab)

    expanded = {}
    for qt in core_tokens:
        matches = {}
        for w in vocab_list:
            quality = _search_match_quality(qt, w)
            if quality > 0:
                matches[w] = quality
        expanded[qt] = matches

    raw_norm = ' '.join(query_tokens)

    # Оцінка релевантності кожного елемента індексу
    scored = []
    for it in index:
        score = 0.0
        hits = 0
        matched = set()
        for qt, matches in expanded.items():
            best_title = best_body = 0.0
            for w, quality in matches.items():
                if w in it['title_tokens']:
                    if quality > best_title:
                        best_title = quality
                    matched.add(w)
                elif w in it['body_tokens']:
                    if quality > best_body:
                        best_body = quality
                    matched.add(w)
            if best_title or best_body:
                hits += 1
                score += best_title * 3.0 + best_body
        if hits == 0:
            continue
        score *= 0.4 + 0.6 * (hits / len(expanded))          # покриття запиту
        if raw_norm and raw_norm in it['title_norm']:        # точна фраза в заголовку
            score += 6.0
        if it['date'] and it['date'] <= now:                 # свіжість (новини/події)
            age = (now - it['date']).days
            score += 0.6 if age <= 30 else (0.3 if age <= 180 else 0.0)
        score *= it['weight']
        scored.append((score, it, matched))

    scored = [row for row in scored if row[0] >= 0.5]
    scored.sort(key=lambda r: r[0], reverse=True)
    scored = scored[:40]

    # Підказка «можливо, ви мали на увазі» — виправляємо токени без точного збігу
    suggestion_tokens, changed = [], False
    for qt in query_tokens:
        matches = expanded.get(qt)
        if matches and matches.get(qt, 0) >= 1.0:
            suggestion_tokens.append(qt)
            continue
        if matches:
            best_w, best_q = max(matches.items(), key=lambda kv: kv[1])
            if best_q >= 0.72 and best_w != qt and abs(len(best_w) - len(qt)) <= 1:
                suggestion_tokens.append(best_w)
                changed = True
            else:
                suggestion_tokens.append(qt)
        else:
            suggestion_tokens.append(qt)
    suggestion = ' '.join(suggestion_tokens) if changed else None

    results = [{
        'type': it['type'],
        'title': it['title'],
        'slug': it['slug'],
        'excerpt': _search_snippet(it['excerpt_src'], matched),
        'matched': sorted(matched, key=len, reverse=True)[:8],
    } for score, it, matched in scored]

    return Response({
        'query': raw_q,
        'suggestion': suggestion,
        'count': len(results),
        'results': results,
    })


# ============================================================================
# Web-Push endpoints
# ============================================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def push_vapid_key(request):
    """Повертає публічний VAPID-ключ для підписки браузера."""
    from django.conf import settings
    key = getattr(settings, 'VAPID_PUBLIC_KEY', '')
    return Response({'publicKey': key, 'enabled': bool(key)})


@api_view(['POST'])
@permission_classes([AllowAny])
def push_subscribe(request):
    """Зберігає push-підписку браузера.
    Очікує JSON: { endpoint, keys: { p256dh, auth } }
    """
    from .models import PushSubscription

    data = request.data or {}
    endpoint = data.get('endpoint')
    keys = data.get('keys') or {}
    p256dh = keys.get('p256dh')
    auth = keys.get('auth')

    if not endpoint or not p256dh or not auth:
        return Response({'detail': 'Некоректні дані підписки'}, status=400)

    raw_topics = data.get('topics')
    if not isinstance(raw_topics, list):
        raw_topics = ['news']
    topics = [t for t in raw_topics if t in ('news', 'events', 'menu')]

    PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={
            'p256dh': p256dh,
            'auth': auth,
            'user_agent': request.META.get('HTTP_USER_AGENT', '')[:300],
            'topics': topics,
            'is_active': True,
        },
    )
    return Response({'detail': 'Підписку збережено'}, status=201)


@api_view(['POST'])
@permission_classes([AllowAny])
def push_unsubscribe(request):
    """Деактивує підписку за endpoint."""
    from .models import PushSubscription
    endpoint = (request.data or {}).get('endpoint')
    if endpoint:
        PushSubscription.objects.filter(endpoint=endpoint).update(is_active=False)
    return Response({'detail': 'Відписано'})


# ============================================================================
# ШІ-чат-помічник для батьків (Gemini + контекст із індексу пошуку)
# ============================================================================
class ChatRateThrottle(AnonRateThrottle):
    """Окремий ліміт для чату (rate береться з DEFAULT_THROTTLE_RATES['chat'])."""
    scope = 'chat'


# type → шлях у SPA (для блоку «джерела» під відповіддю)
_CHAT_URL_MAP = {
    'news': '/news/{}', 'page': '/page/{}', 'group': '/groups/{}',
    'circle': '/circles/{}', 'specialist': '/specialists/{}',
    'album': '/gallery/album/{}', 'event': '/events', 'faq': '/faq',
    'document': '/documents',
}


def _chat_source_url(type_, slug):
    tpl = _CHAT_URL_MAP.get(type_)
    if not tpl:
        return None
    return tpl.format(slug) if '{}' in tpl else tpl


_CHAT_WD = ['понеділок', 'вівторок', 'середа', 'четвер', "п'ятниця", 'субота', 'неділя']
_CHAT_MO = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня',
            'серпня', 'вересня', 'жовтня', 'листопада', 'грудня']


def _chat_ambient():
    """Завжди-актуальний контекст: поточна дата/день, меню на сьогодні, контакти, найближчі події."""
    from django.utils import timezone
    now = timezone.localtime()
    today = now.date()
    parts = [
        f'Поточна дата: сьогодні {_CHAT_WD[today.weekday()]}, {today.day} {_CHAT_MO[today.month - 1]} '
        f'{today.year} року (час {now.strftime("%H:%M")}, Київ).'
    ]

    # Меню на сьогодні (DailyMenu або шаблон тижня)
    try:
        from menu.api_views import _template_map, _menu_for_date
        from menu.models import DailyMenu
        daily = DailyMenu.objects.filter(is_published=True, date=today).first()
        menu = _menu_for_date(today, {today: daily} if daily else {}, _template_map())
        meals = []
        if menu:
            for label, key in [('Сніданок', 'breakfast'), ('II сніданок', 'second_breakfast'),
                               ('Обід', 'lunch'), ('Полуденок', 'snack'), ('Вечеря', 'dinner')]:
                v = (menu.get(key) or '').strip()
                if v:
                    meals.append(f'• {label}: {v}')
        if meals:
            parts.append('Меню на сьогодні (детальніше: /menu):\n' + '\n'.join(meals))
        else:
            parts.append('Меню на сьогодні ще не опубліковано (сторінка /menu).')
    except Exception:
        pass

    # Контакти закладу
    try:
        c = Contact.objects.first()
        if c:
            ci = [f'{lbl}: {val}' for lbl, val in [
                ('Адреса', c.address), ('Телефон', c.phone), ('Email', c.email),
                ('Режим роботи', c.working_hours)] if val]
            if ci:
                parts.append('Контакти закладу (сторінка /contacts):\n' + '\n'.join(ci))
    except Exception:
        pass

    # Найближчі події
    try:
        from events.models import Event
        upcoming = Event.objects.filter(is_published=True, start_date__gte=now).order_by('start_date')[:3]
        ev = [f'• {e.title} — {e.start_date.strftime("%d.%m.%Y")}' for e in upcoming]
        if ev:
            parts.append('Найближчі події (сторінка /events):\n' + '\n'.join(ev))
    except Exception:
        pass

    return '\n\n'.join(parts)


import math

def _cosine_similarity(v1, v2):
    dot = sum(a * b for a, b in zip(v1, v2))
    mag1 = math.sqrt(sum(a * a for a in v1))
    mag2 = math.sqrt(sum(b * b for b in v2))
    return dot / (mag1 * mag2) if mag1 and mag2 else 0.0


def _chat_context(question, limit=6):
    """Контекст для ШІ-чату: векторний пошук + fallback до токенів."""
    ambient = _chat_ambient()
    qtokens = [t for t in _search_tokens(question) if t not in _SEARCH_STOPWORDS] or _search_tokens(question)
    
    from main.ai import get_embedding
    from main.models import SearchEmbedding
    
    q_emb = get_embedding(question)
    db_embs = {}
    if q_emb:
        for e in SearchEmbedding.objects.all():
            db_embs[(e.content_type, str(e.object_id))] = e.embedding

    index = cache.get_or_set('search_index_v1', _build_search_index, 600)
    scored = []
    for it in index:
        s = 0.0
        
        # 1. Векторний скоринг (пріоритет)
        emb = db_embs.get((it['type'], str(it['slug'])))
        if emb and q_emb:
            sim = _cosine_similarity(q_emb, emb)
            if sim > 0.3:
                s += sim * 15.0
                
        # 2. Токен-скоринг (fallback)
        for qt in qtokens:
            bt = max((_search_match_quality(qt, w) for w in it['title_tokens']), default=0.0)
            bb = max((_search_match_quality(qt, w) for w in it['body_tokens']), default=0.0)
            s += bt * 3 + bb
            
        if s > 0:
            scored.append((s * it.get('weight', 1.0), it))
            
    scored.sort(key=lambda x: x[0], reverse=True)

    chunks, sources, seen = [], [], set()
    for _, it in scored[:limit]:
        body = (it.get('excerpt_src') or '').strip()
        if len(body) > 600:
            body = body[:600].rsplit(' ', 1)[0] + '…'
        url = _chat_source_url(it['type'], it['slug'])
        head = f'[{it["title"]}]' + (f' (посилання: {url})' if url else '')
        chunks.append(f'{head}\n{body}'.strip())
        key = (it['title'], url)
        if url and key not in seen:
            seen.add(key)
            sources.append({'title': it['title'], 'url': url, 'type': it['type']})

    full = ambient + '\n\n--- Релевантні розділи сайту ---\n\n' + '\n\n'.join(c for c in chunks if c)
    return full.strip(), sources[:5]


from django.http import StreamingHttpResponse

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([ChatRateThrottle])
def chat(request):
    """ШІ-помічник: відповідає стрімінгом (SSE) на основі контенту сайту."""
    from main import ai
    import json

    question = (request.data.get('question') or '').strip()
    if len(question) < 2:
        return Response({'detail': 'Поставте, будь ласка, запитання.'}, status=400)
    question = question[:500]

    if not ai.is_configured():
        return Response({
            'answer': 'Вибачте, помічник зараз недоступний 😔 Скористайтеся пошуком угорі сайту або зверніться до нас на сторінці «Контакти».',
            'sources': [], 'available': False,
        })

    history = request.data.get('history')
    history = history if isinstance(history, list) else None
    context, sources = _chat_context(question)
    
    def generate_sse():
        yield f"data: {json.dumps({'sources': sources, 'text': ''}, ensure_ascii=False)}\n\n"
        for chunk in ai.answer_question_stream(question, context, history=history):
            yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n"
            
    response = StreamingHttpResponse(generate_sse(), content_type="text/event-stream")
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response
