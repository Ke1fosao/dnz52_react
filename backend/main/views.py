"""
main/views.py — у React-версії сайту лишилися ТІЛЬКИ обробники помилок.

Весь UI рендериться React-фронтендом (frontend/), дані віддає REST API
(api_views.py + serializers.py). Старі Django-шаблонні views видалені.
"""
from django.http import JsonResponse
from django.shortcuts import render


def error_404(request, exception):
    """Кастомна 404. Для API-запитів повертає JSON, інакше — React SPA / HTML."""
    if request.path.startswith('/api/'):
        return JsonResponse({'detail': 'Не знайдено'}, status=404)
    # Віддаємо React index.html — клієнтський роутер покаже свою 404 сторінку
    try:
        from dnz52_site.spa_views import spa_index
        return spa_index(request)
    except Exception:
        return render(request, '404.html', status=404)


def error_500(request):
    """Кастомна 500."""
    if request.path.startswith('/api/'):
        return JsonResponse({'detail': 'Помилка сервера'}, status=500)
    return render(request, '500.html', status=500)
