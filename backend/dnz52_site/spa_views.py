"""
SPA fallback view — віддає React's index.html для будь-якого URL,
який не співпав з API/admin/media/static.

Це потрібно щоб клієнтський роутинг React Router працював у продакшені.
Наприклад, якщо користувач відкриває /news/some-news напряму — Django повертає
index.html, а React Router всередині показує сторінку новини.
"""
import os

from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound, FileResponse
from django.views.decorators.cache import cache_control


SPA_INDEX = os.path.join(settings.BASE_DIR, 'spa', 'index.html')


@cache_control(no_cache=True, no_store=True, must_revalidate=True)
def spa_index(request):
    """Повертає index.html React SPA. Будь-який URL що не є API/admin
    показуватиме React додаток.
    """
    if not os.path.exists(SPA_INDEX):
        return HttpResponse(
            '<h1>React build not found</h1>'
            '<p>Виконайте <code>npm run build</code> локально, скопіюйте '
            '<code>dist/</code> у <code>backend/spa/</code> та закомітьте.</p>'
            '<p>Або запустіть скрипт <code>build-prod.bat</code>.</p>',
            status=503,
            content_type='text/html; charset=utf-8',
        )

    with open(SPA_INDEX, 'rb') as f:
        return HttpResponse(f.read(), content_type='text/html')


def spa_asset(request, asset_path):
    """Віддає файли з spa/assets/ (JS, CSS, etc).
    У продакшені краще обслуговувати через WhiteNoise/Nginx, але це fallback.
    """
    full = os.path.join(settings.BASE_DIR, 'spa', 'assets', asset_path)
    if not os.path.exists(full) or not os.path.isfile(full):
        return HttpResponseNotFound()
    return FileResponse(open(full, 'rb'))
