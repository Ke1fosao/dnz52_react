from django.core.cache import cache
from django.db.models import Count, F, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
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
    filterset_fields = ['category__slug', 'tags__slug']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'views']
    ordering = ['-created_at']

    def get_queryset(self):
        # detail (retrieve) — дозволяємо відкрити будь-яку новину за прямим slug
        # (для попереднього перегляду чернеток адміністратором).
        # list — лише live новини (+ опційний фільтр архіву ?year=&month=).
        if self.action == 'retrieve':
            return News.objects.all().select_related('category').prefetch_related('tags')
        qs = live_news_qs().prefetch_related('tags')
        year = self.request.query_params.get('year')
        month = self.request.query_params.get('month')
        if year and month:
            try:
                qs = qs.filter(created_at__year=int(year), created_at__month=int(month))
            except (TypeError, ValueError):
                pass
        return qs

    @action(detail=False)
    def archive(self, request):
        """Архів: список місяців з кількістю новин (для бічної навігації)."""
        rows = (
            live_news_qs()
            .annotate(m=TruncMonth('created_at'))
            .values('m')
            .annotate(count=Count('id'))
            .order_by('-m')
        )
        return Response([
            {'year': r['m'].year, 'month': r['m'].month, 'count': r['count']}
            for r in rows if r['m']
        ])

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return NewsDetailSerializer
        return NewsListSerializer

    @staticmethod
    def _client_ip(request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        if xff:
            return xff.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '') or 'unknown'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Перегляд рахуємо лише коли виконані ВСІ умови:
        #   1) новина live (не чернетка-прев'ю),
        #   2) фронт явно попросив (?count=1) — він робить це лише ОДИН раз на людину
        #      (через localStorage), тож перезавантаження/повторні заходи не накручують,
        #   3) для цього IP перегляд цієї новини ще не рахували останні 6 годин
        #      (захист від накрутки в обхід localStorage).
        if instance.is_live and request.query_params.get('count') in ('1', 'true'):
            cache_key = f'newsview:{instance.pk}:{self._client_ip(request)}'
            if not cache.get(cache_key):
                News.objects.filter(pk=instance.pk).update(views=F('views') + 1)
                cache.set(cache_key, 1, 6 * 60 * 60)
                instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        data = serializer.data
        # Позначка для фронтенду що це чернетка/прев'ю
        data['is_preview'] = not instance.is_live
        return Response(data)
