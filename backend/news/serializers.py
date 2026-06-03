from rest_framework import serializers

from .models import News, NewsCategory


class NewsCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsCategory
        fields = ['id', 'name', 'slug']


class NewsListSerializer(serializers.ModelSerializer):
    """Полегшений серіалізатор для списку (без повного content)."""
    image = serializers.ImageField(use_url=True, allow_null=True)
    category = NewsCategorySerializer(read_only=True)
    excerpt = serializers.SerializerMethodField()

    class Meta:
        model = News
        fields = [
            'id', 'title', 'slug', 'category', 'image',
            'created_at', 'updated_at', 'views', 'excerpt',
        ]

    def get_excerpt(self, obj):
        # Прибираємо HTML теги, обрізаємо до 200 символів
        from django.utils.html import strip_tags
        text = strip_tags(obj.content or '')
        return text[:200] + ('…' if len(text) > 200 else '')


class NewsDetailSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True, allow_null=True)
    category = NewsCategorySerializer(read_only=True)
    related = serializers.SerializerMethodField()

    class Meta:
        model = News
        fields = [
            'id', 'title', 'slug', 'category', 'content', 'image',
            'created_at', 'updated_at', 'is_published', 'views', 'related',
        ]

    def get_related(self, obj):
        """До 3 схожих live-новин тієї ж категорії (без поточної)."""
        if not obj.category_id:
            return []
        from django.db.models import Q
        from django.utils import timezone
        now = timezone.now()
        qs = (
            News.objects
            .filter(
                Q(status=News.Status.PUBLISHED) | Q(status=News.Status.SCHEDULED, publish_at__lte=now),
                category_id=obj.category_id,
            )
            .exclude(pk=obj.pk)
            .order_by('-created_at')[:3]
        )
        request = self.context.get('request')

        def img(n):
            if not n.image:
                return None
            return request.build_absolute_uri(n.image.url) if request else n.image.url

        return [
            {'id': n.id, 'title': n.title, 'slug': n.slug, 'image': img(n), 'created_at': n.created_at}
            for n in qs
        ]
