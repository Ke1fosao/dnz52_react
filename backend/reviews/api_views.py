import time

from django.db.models import F
from django.core.cache import cache
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer


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

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        cache.set(cache_key, True, timeout=60)

        return Response(
            {'detail': 'Дякуємо! Ваш відгук відправлено на модерацію.'},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        Review.objects.filter(pk=pk, is_approved=True).update(likes=F('likes') + 1)
        return Response({'status': 'ok'})

    @action(detail=True, methods=['post'])
    def dislike(self, request, pk=None):
        Review.objects.filter(pk=pk, is_approved=True).update(dislikes=F('dislikes') + 1)
        return Response({'status': 'ok'})
