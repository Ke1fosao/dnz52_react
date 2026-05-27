from rest_framework import serializers

from .models import Circle, CircleDocument


class CircleDocumentSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source='document.title', read_only=True)
    document_file = serializers.FileField(source='document.file', use_url=True, read_only=True)

    class Meta:
        model = CircleDocument
        fields = ['id', 'title', 'document_title', 'document_file', 'order']


class CircleListSerializer(serializers.ModelSerializer):
    album_slug = serializers.SlugRelatedField(source='album', slug_field='slug', read_only=True)

    class Meta:
        model = Circle
        fields = [
            'id', 'name', 'slug', 'leader', 'age_group', 'schedule',
            'icon', 'color', 'album_slug', 'order',
        ]


class CircleDetailSerializer(serializers.ModelSerializer):
    album_slug = serializers.SlugRelatedField(source='album', slug_field='slug', read_only=True)

    class Meta:
        model = Circle
        fields = [
            'id', 'name', 'slug', 'leader', 'age_group', 'schedule',
            'icon', 'color', 'goal', 'description', 'album_slug',
            'order', 'is_published',
        ]
