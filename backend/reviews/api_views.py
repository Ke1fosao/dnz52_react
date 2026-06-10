import logging

from django.db.models import F
from django.core.cache import cache
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response

from dnz52_site.turnstile import verify_turnstile
from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer

logger = logging.getLogger(__name__)


class ReviewViewSet(mixins.CreateModelMixin,
                    mixins.ListModelMixin,
                    viewsets.GenericViewSet):
    """GET /api/v1/reviews/  — список опублікованих відгуків.
    POST /api/v1/reviews/   — створення нового (з модерацією)."""

    queryset = Review.objects.filter(is_approved=True)
    filterset_fields = ['rating']
    ordering_fields = ['created_at', 'rating', 'likes']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer

    def create(self, request, *args, **kwargs):
        # Rate limit: 60 секунд між POST з одного IP
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        cache_key = f'review_rate_limit_{ip}'
        if cache.get(cache_key):
            return Response(
                {'detail': 'Зачекайте трохи перед тим як залишити ще один відгук.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Cloudflare Turnstile — якщо ключ заданий, токен обовʼязковий
        turnstile_token = request.data.get('cf-turnstile-response', '')
        if not verify_turnstile(turnstile_token, ip):
            return Response(
                {'detail': 'Перевірка captcha не пройдена. Спробуйте ще раз.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()

        cache.set(cache_key, True, timeout=60)

        # Авто-модерація ШІ у фоновому потоці.
        try:
            from main.models import AISettings
            from main import ai
            if AISettings.get_solo().auto_moderate_reviews and ai.is_configured():
                import threading
                from django.db import connection
                
                def _moderate_task(review_id):
                    try:
                        from reviews.models import Review
                        review = Review.objects.get(id=review_id)
                        if review.ai_moderation:
                            return # Вже перевірено
                        safe, reason = ai.moderate_review(review.text)
                        review.ai_moderation = (reason or ('коректний' if safe else 'підозрілий вміст'))[:500]
                        review.is_approved = bool(safe)
                        review.save(update_fields=['is_approved', 'ai_moderation'])
                    except Exception as e:
                        logger.warning('Помилка фонової AI-модерації: %s', e)
                    finally:
                        connection.close()

                threading.Thread(target=_moderate_task, args=(review.id,), daemon=True).start()
        except Exception as e:
            logger.warning('Не вдалося запустити фонову модерацію: %s', e)

        msg = 'Дякуємо! Ваш відгук перевіряється.'
        return Response({'detail': msg}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        Review.objects.filter(pk=pk, is_approved=True).update(likes=F('likes') + 1)
        return Response({'status': 'ok'})

    @action(detail=True, methods=['post'])
    def dislike(self, request, pk=None):
        Review.objects.filter(pk=pk, is_approved=True).update(dislikes=F('dislikes') + 1)
        return Response({'status': 'ok'})
