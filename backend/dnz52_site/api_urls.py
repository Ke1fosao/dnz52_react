"""REST API роутер для React фронтенду (dnz52-react).

Підключено в головному `urls.py` як `path('api/v1/', include('dnz52_site.api_urls'))`.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from main.api_views import (
    PageViewSet, SliderViewSet, ContactViewSet,
    ParentsAnnouncementViewSet, ParentsDocumentViewSet,
    ParentsAdaptationPhotoViewSet, ParentsEnrollmentDocViewSet,
    ParentsApplicationSampleViewSet,
    StaffMemberViewSet,
    AttestationDocumentViewSet, AttestationStepViewSet,
    AttestationCategoryViewSet, AttestationLawViewSet,
    attestation_settings, global_search,
    push_vapid_key, push_subscribe, push_unsubscribe,
)
from news.api_views import NewsViewSet, NewsCategoryViewSet
from gallery.api_views import GalleryCategoryViewSet, GalleryAlbumViewSet
from groups.api_views import GroupViewSet
from specialists.api_views import SpecialistPageViewSet
from circles.api_views import CircleViewSet
from documents.api_views import DocumentViewSet, DocumentCategoryViewSet
from reviews.api_views import ReviewViewSet
from menu.api_views import DailyMenuViewSet
from faq.api_views import faq_list, faq_like, faq_ask
from events.api_views import EventViewSet, event_ical


router = DefaultRouter()

# Main app
router.register(r'pages', PageViewSet, basename='page')
router.register(r'sliders', SliderViewSet, basename='slider')
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'staff', StaffMemberViewSet, basename='staff')

# Батьки
router.register(r'parents/announcements', ParentsAnnouncementViewSet,
                basename='parents-announcement')
router.register(r'parents/documents', ParentsDocumentViewSet,
                basename='parents-document')
router.register(r'parents/adaptation', ParentsAdaptationPhotoViewSet,
                basename='parents-adaptation')
router.register(r'parents/enrollment', ParentsEnrollmentDocViewSet,
                basename='parents-enrollment')
router.register(r'parents/samples', ParentsApplicationSampleViewSet,
                basename='parents-sample')

# Атестація
router.register(r'attestation/documents', AttestationDocumentViewSet,
                basename='attestation-document')
router.register(r'attestation/steps', AttestationStepViewSet,
                basename='attestation-step')
router.register(r'attestation/categories', AttestationCategoryViewSet,
                basename='attestation-category')
router.register(r'attestation/laws', AttestationLawViewSet,
                basename='attestation-law')

# News
router.register(r'news', NewsViewSet, basename='news')
router.register(r'news-categories', NewsCategoryViewSet, basename='news-category')

# Gallery
router.register(r'gallery/categories', GalleryCategoryViewSet, basename='gallery-category')
router.register(r'gallery/albums', GalleryAlbumViewSet, basename='gallery-album')

# Groups
router.register(r'groups', GroupViewSet, basename='group')

# Specialists
router.register(r'specialists', SpecialistPageViewSet, basename='specialist')

# Circles
router.register(r'circles', CircleViewSet, basename='circle')

# Documents
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'document-categories', DocumentCategoryViewSet, basename='document-category')

# Reviews
router.register(r'reviews', ReviewViewSet, basename='review')

# Menu
router.register(r'menu', DailyMenuViewSet, basename='menu')

# Events
router.register(r'events', EventViewSet, basename='event')


urlpatterns = [
    path('', include(router.urls)),

    # Окремі endpoints (menu/today/ та menu/week/ тепер як @action в DailyMenuViewSet)
    path('search/', global_search, name='api-search'),
    path('attestation/settings/', attestation_settings, name='api-attestation-settings'),

    # FAQ
    path('faq/', faq_list, name='api-faq'),
    path('faq/ask/', faq_ask, name='api-faq-ask'),
    path('faq/items/<int:pk>/like/', faq_like, name='api-faq-like'),

    # Events — завантаження .ics
    path('events/<slug:slug>/ical/', event_ical, name='api-event-ical'),

    # Web-push
    path('push/vapid-key/', push_vapid_key, name='api-push-vapid'),
    path('push/subscribe/', push_subscribe, name='api-push-subscribe'),
    path('push/unsubscribe/', push_unsubscribe, name='api-push-unsubscribe'),
]
