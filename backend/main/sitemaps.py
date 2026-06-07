"""
Sitemaps для SEO — покривають весь контент сайту ЗДО №52.

Підключення у backend/dnz52_site/urls.py (вже є):
    from main.sitemaps import (
        StaticViewSitemap, PageSitemap, NewsSitemap, GroupSitemap,
        AlbumSitemap, CircleSitemap, EventSitemap,
        SpecialistSitemap, StaticPagesSitemap,
    )
    sitemaps = {
        'static':      StaticViewSitemap,
        'static-pages': StaticPagesSitemap,
        'pages':       PageSitemap,
        'news':        NewsSitemap,
        'groups':      GroupSitemap,
        'albums':      AlbumSitemap,
        'circles':     CircleSitemap,
        'events':      EventSitemap,
        'specialists': SpecialistSitemap,
    }
"""
from django.contrib.sitemaps import Sitemap

from .models import Page
from news.models import News
from groups.models import Group
from gallery.models import GalleryAlbum
from circles.models import Circle
from events.models import Event
from specialists.models import SpecialistPage


class StaticViewSitemap(Sitemap):
    """Головні статичні React-маршрути без власних моделей."""
    priority = 0.7
    changefreq = 'weekly'

    def items(self):
        return [
            '/',
            '/contacts',
            '/news',
            '/gallery',
            '/documents',
            '/groups',
            '/reviews',
            '/menu',
            '/circles',
            '/specialists',
            '/events',
            '/faq',
            '/parents',
            '/staff',
            '/about',
            '/attestation',
        ]

    def location(self, item):
        return item


class StaticPagesSitemap(Sitemap):
    """Публічні сторінки категорій та мета-маршрути."""
    priority = 0.5
    changefreq = 'monthly'

    # Сторінки спеціалістів — мають фіксовані маршрути у React
    SPECIALIST_PATHS = [
        '/specialists/methodical',
        '/specialists/physical',
        '/specialists/music',
        '/specialists/psychologist',
        '/specialists/medical',
    ]

    def items(self):
        return self.SPECIALIST_PATHS

    def location(self, item):
        return item


class PageSitemap(Sitemap):
    """Динамічні сторінки (Page model) — довільний контент."""
    changefreq = 'monthly'
    priority = 0.6

    def items(self):
        return Page.objects.filter(is_published=True)

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/page/{obj.slug}/'


class NewsSitemap(Sitemap):
    """Новини — важливий контент, часто оновлюються."""
    changefreq = 'weekly'
    priority = 0.8

    def items(self):
        return News.objects.filter(is_published=True).order_by('-updated_at')

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/news/{obj.slug}/'


class GroupSitemap(Sitemap):
    """Групи — оновлюються рідко."""
    changefreq = 'monthly'
    priority = 0.6

    def items(self):
        return Group.objects.filter(is_published=True)

    def lastmod(self, obj):
        return getattr(obj, 'updated_at', None)

    def location(self, obj):
        return f'/groups/{obj.slug}/'


class AlbumSitemap(Sitemap):
    """Фотоальбоми галереї."""
    changefreq = 'monthly'
    priority = 0.5

    def items(self):
        return GalleryAlbum.objects.filter(is_published=True).order_by('-created_at')

    def lastmod(self, obj):
        return obj.created_at

    def location(self, obj):
        return f'/gallery/album/{obj.slug}/'


class CircleSitemap(Sitemap):
    """Гуртки та секції."""
    changefreq = 'monthly'
    priority = 0.6

    def items(self):
        return Circle.objects.filter(is_published=True)

    def location(self, obj):
        return f'/circles/{obj.slug}/'


class EventSitemap(Sitemap):
    """Майбутні та поточні події (минулі > 3 місяці виключаємо)."""
    changefreq = 'weekly'
    priority = 0.65

    def items(self):
        from django.utils import timezone
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=90)
        return Event.objects.filter(
            is_published=True,
            start_date__gte=cutoff,
        ).order_by('start_date')

    def lastmod(self, obj):
        return obj.created_at

    def location(self, obj):
        # Події доступні через загальну сторінку подій (немає окремих URL)
        return '/events'


class SpecialistSitemap(Sitemap):
    """Сторінки спеціалістів (за page_type)."""
    changefreq = 'monthly'
    priority = 0.55

    PAGE_TYPE_SLUGS = {
        'methodical':  '/specialists/methodical',
        'physical':    '/specialists/physical',
        'music':       '/specialists/music',
        'psychologist': '/specialists/psychologist',
        'medical':     '/specialists/medical',
    }

    def items(self):
        return SpecialistPage.objects.all()

    def location(self, obj):
        return self.PAGE_TYPE_SLUGS.get(obj.page_type, '/specialists')
