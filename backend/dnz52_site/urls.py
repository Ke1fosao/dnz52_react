"""URL роутер для production.

Архітектура:
  /admin/       → Django адмінка (для додавання контенту)
  /api/v1/      → REST API для React фронтенду
  /media/       → завантажені фото/документи
  /static/      → CSS/JS для адмінки
  /assets/      → JS/CSS React додатку
  /sitemap.xml  → SEO
  /robots.txt   → SEO
  /*            → React SPA (index.html, далі React Router бере на себе)
"""
from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.sitemaps.views import sitemap
from django.views.generic import TemplateView

from main.sitemaps import (
    StaticViewSitemap, PageSitemap, NewsSitemap, GroupSitemap,
)
from news.feeds import LatestNewsFeed
from dnz52_site.spa_views import spa_index


# 2FA для адмінки (env-gated). Коли ENFORCE_ADMIN_2FA=True — адмінка вимагає TOTP.
# За замовчуванням вимкнено, тож звичайний вхід у /admin працює як завжди.
if getattr(settings, 'ENFORCE_ADMIN_2FA', False):
    from django_otp.admin import OTPAdminSite
    admin.site.__class__ = OTPAdminSite


sitemaps = {
    'static': StaticViewSitemap,
    'pages':  PageSitemap,
    'news':   NewsSitemap,
    'groups': GroupSitemap,
}

urlpatterns = [
    # 1. Django admin (для адміністраторів)
    path('admin/', admin.site.urls),

    # 2. REST API (для React)
    path('api/v1/', include('dnz52_site.api_urls')),

    # 3. SEO
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='sitemap'),
    path('rss/', LatestNewsFeed(), name='news-rss'),
    path('robots.txt', TemplateView.as_view(
        template_name='robots.txt', content_type='text/plain'
    )),

    # 4. Markdownx (редактор для адмінки — завантаження зображень, превʼю)
    path('markdownx/', include('markdownx.urls')),
]

# 5. У DEV режимі віддаємо media і static самостійно
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# 6. React SPA fallback — будь-який інший URL віддає index.html.
#    React Router всередині обробляє роутинг клієнтсько.
#    ВАЖЛИВО: цей патерн має бути ОСТАННІМ — інакше перехопить всі інші роути.
urlpatterns += [
    re_path(r'^.*$', spa_index, name='spa-index'),
]

# Кастомні сторінки помилок (підхоплюються Django автоматично коли DEBUG=False)
handler404 = 'main.views.error_404'
handler500 = 'main.views.error_500'
