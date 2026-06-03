from rest_framework import serializers

from .models import Circle, CircleBenefit, CircleSession, CircleDocument


class CircleDocumentSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source='document.title', read_only=True)
    document_file = serializers.FileField(source='document.file', use_url=True, read_only=True)

    class Meta:
        model = CircleDocument
        fields = ['id', 'title', 'document_title', 'document_file', 'order']


class CircleBenefitSerializer(serializers.ModelSerializer):
    class Meta:
        model = CircleBenefit
        fields = ['id', 'icon', 'title', 'text', 'order']


class CircleSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CircleSession
        fields = ['id', 'day', 'time', 'note', 'order']


class CircleListSerializer(serializers.ModelSerializer):
    album_slug = serializers.SlugRelatedField(source='album', slug_field='slug', read_only=True)
    cover = serializers.ImageField(use_url=True, required=False, allow_null=True)

    class Meta:
        model = Circle
        fields = [
            'id', 'name', 'slug', 'tagline', 'leader', 'age_group', 'schedule',
            'duration', 'format', 'price', 'icon', 'color', 'cover',
            'album_slug', 'is_featured', 'order',
        ]


class CircleDetailSerializer(serializers.ModelSerializer):
    album_slug = serializers.SlugRelatedField(source='album', slug_field='slug', read_only=True)
    cover = serializers.ImageField(use_url=True, required=False, allow_null=True)
    benefits = CircleBenefitSerializer(many=True, read_only=True)
    sessions = CircleSessionSerializer(many=True, read_only=True)

    class Meta:
        model = Circle
        fields = [
            'id', 'name', 'slug', 'tagline', 'leader', 'age_group', 'schedule',
            'duration', 'format', 'price', 'icon', 'color', 'cover',
            'goal', 'description', 'album_slug', 'benefits', 'sessions',
            'is_featured', 'order', 'is_published',
        ]
