from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from dnz52_site.turnstile import verify_turnstile
from .serializers import EnrollmentCreateSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def enrollment_create(request):
    """Публічний прийом заявки на зарахування (антиспам: rate-limit + honeypot + Turnstile)."""
    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
    cache_key = f'enroll_rate_{ip}'
    if cache.get(cache_key):
        return Response(
            {'detail': 'Зачекайте трохи перед повторним надсиланням заявки.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    if not verify_turnstile(request.data.get('cf-turnstile-response', ''), ip):
        return Response(
            {'detail': 'Перевірка captcha не пройдена. Спробуйте ще раз.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = EnrollmentCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    cache.set(cache_key, True, timeout=120)

    return Response(
        {'detail': 'Дякуємо! Вашу заявку отримано. Ми звʼяжемося з вами найближчим часом.'},
        status=status.HTTP_201_CREATED,
    )
