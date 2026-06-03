from rest_framework import viewsets, mixins
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

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


@api_view(['GET'])
@permission_classes([AllowAny])
def global_search(request):
    """Глобальний пошук по новинах, сторінках, групах, гуртках, спеціалістах, документах."""
    from django.db.models import Q
    from news.models import News
    from groups.models import Group
    from circles.models import Circle
    from documents.models import Document
    from specialists.models import SpecialistPage

    q = request.query_params.get('q', '').strip()
    if not q or len(q) < 2:
        return Response({'query': q, 'results': []})

    results = []

    # Новини
    for n in News.objects.filter(
        Q(title__icontains=q) | Q(content__icontains=q),
        is_published=True
    )[:8]:
        results.append({
            'type': 'news',
            'title': n.title,
            'slug': n.slug,
            'excerpt': (n.content[:160] if n.content else ''),
        })

    # Сторінки
    for p in Page.objects.filter(
        Q(title__icontains=q) | Q(content__icontains=q),
        is_published=True
    )[:5]:
        results.append({
            'type': 'page',
            'title': p.title,
            'slug': p.slug,
            'excerpt': (p.content[:160] if p.content else ''),
        })

    # Групи
    for g in Group.objects.filter(
        Q(name__icontains=q) | Q(description__icontains=q),
        is_published=True
    )[:5]:
        results.append({
            'type': 'group',
            'title': g.name,
            'slug': g.slug,
            'excerpt': g.motto or '',
        })

    # Гуртки
    for c in Circle.objects.filter(
        Q(name__icontains=q) | Q(description__icontains=q),
        is_published=True
    )[:5]:
        results.append({
            'type': 'circle',
            'title': c.name,
            'slug': c.slug,
            'excerpt': c.leader,
        })

    # Спеціалісти
    for s in SpecialistPage.objects.filter(
        Q(title__icontains=q) | Q(description__icontains=q)
    )[:5]:
        results.append({
            'type': 'specialist',
            'title': s.title,
            'slug': s.page_type,
            'excerpt': s.intro or '',
        })

    # Документи
    for d in Document.objects.filter(
        Q(title__icontains=q) | Q(description__icontains=q),
        is_published=True
    )[:5]:
        results.append({
            'type': 'document',
            'title': d.title,
            'slug': str(d.id),
            'excerpt': d.description or '',
        })

    return Response({'query': q, 'count': len(results), 'results': results})


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
