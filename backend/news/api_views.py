from django.db.models import F, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.response import Response

from .models import News, NewsCategory
from .serializers import (
    NewsCategorySerializer, NewsListSerializer, NewsDetailSerializer,
)


def live_news_qs():
    """Новини що ЗАРАЗ мають бути видимі: опубліковані АБО заплановані,
    чий час публікації вже настав."""
    now = timezone.now()
    return News.objects.filter(
        Q(status=News.Status.PUBLISHED)
        | Q(status=News.Status.SCHEDULED, publish_at__lte=now)
    ).select_related('category')


class NewsCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NewsCategory.objects.all()
    serializer_class = NewsCategorySerializer
    lookup_field = 'slug'
    pagination_class = None


class NewsViewSet(viewsets.ReadOnlyModelViewSet):
    lookup_field = 'slug'
    filterset_fields = ['category__slug']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'views']
    ordering = ['-created_at']

    def get_queryset(self):
        # detail (retrieve) — дозволяємо відкрити будь-яку новину за прямим slug
        # (для попереднього перегляду чернеток адміністратором).
        # list — лише live новини.
        if self.action == 'retrieve':
            return News.objects.all().select_related('category')
        return live_news_qs()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return NewsDetailSerializer
        return NewsListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Лічильник переглядів рахуємо лише для live новин (не для preview чернеток)
        if instance.is_live:
            News.objects.filter(pk=instance.pk).update(views=F('views') + 1)
            instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        data = serializer.data
        # Позначка для фронтенду що це чернетка/прев'ю
        data['is_preview'] = not instance.is_live
        return Response(data)
