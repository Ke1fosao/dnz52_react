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

    class Meta:
        model = News
        fields = [
            'id', 'title', 'slug', 'category', 'content', 'image',
            'created_at', 'updated_at', 'is_published', 'views',
        ]
