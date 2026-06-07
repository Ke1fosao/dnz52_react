from django.core.cache import cache
from django.db.models import F
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from dnz52_site.turnstile import verify_turnstile
from .models import FAQItem, FAQCategory
from .serializers import FAQItemSerializer, FAQAskSerializer


@api_view(['GET'])
def faq_list(request):
    """Опубліковані питання-відповіді, згруповані за категоріями."""
    groups = []
    for cat in FAQCategory.objects.prefetch_related('items').all():
        items = cat.items.filter(is_published=True).order_by('order', 'id')
        if not items:
            continue
        groups.append({
            'id': cat.id, 'name': cat.name, 'slug': cat.slug,
            'icon': cat.icon or 'bi-question-circle-fill', 'color': cat.color or '#4A90E2',
            'items': FAQItemSerializer(items, many=True).data,
        })

    uncategorized = FAQItem.objects.filter(is_published=True, category__isnull=True).order_by('order', 'id')
    if uncategorized:
        groups.append({
            'id': 0, 'name': 'Інші питання', 'slug': 'other',
            'icon': 'bi-question-circle-fill', 'color': '#7B8AA5',
            'items': FAQItemSerializer(uncategorized, many=True).data,
        })

    return Response(groups)


@api_view(['POST'])
def faq_like(request, pk):
    """Позначити питання корисним (+1). Фронт обмежує до 1 разу через localStorage."""
    updated = FAQItem.objects.filter(pk=pk, is_published=True).update(likes=F('likes') + 1)
    if not updated:
        return Response({'detail': 'Питання не знайдено.'}, status=status.HTTP_404_NOT_FOUND)
    return Response({'status': 'ok'})


@api_view(['POST'])
def faq_ask(request):
    """Надіслати запитання, якщо відповіді немає у FAQ."""
    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
    cache_key = f'faq_ask_rate_{ip}'
    if cache.get(cache_key):
        return Response(
            {'detail': 'Зачекайте трохи перед наступним запитанням.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    # Cloudflare Turnstile — якщо ключ заданий, токен обовʼязковий
    turnstile_token = request.data.get('cf-turnstile-response', '')
    if not verify_turnstile(turnstile_token, ip):
        return Response(
            {'detail': 'Перевірка captcha не пройдена. Спробуйте ще раз.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = FAQAskSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    cache.set(cache_key, True, timeout=60)
    return Response(
        {'detail': 'Дякуємо! Ми отримали ваше запитання і незабаром зателефонуємо вам.'},
        status=status.HTTP_201_CREATED,
    )
