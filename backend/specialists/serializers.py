from rest_framework import serializers

from .models import (
    SpecialistPage, Specialist, SpecialistAlbum,
    SpecialistPageSection, SpecialistPagePhoto,
)


class SpecialistSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(use_url=True, allow_null=True)

    class Meta:
        model = Specialist
        fields = [
            'id', 'full_name', 'position', 'photo', 'birth_date',
            'education', 'experience', 'category', 'motto', 'bio', 'order',
        ]


class SpecialistAlbumSerializer(serializers.ModelSerializer):
    album_slug = serializers.SlugRelatedField(source='album', slug_field='slug', read_only=True)
    album_title = serializers.CharField(source='album.title', read_only=True)
    album_cover = serializers.ImageField(source='album.cover', use_url=True, read_only=True)

    class Meta:
        model = SpecialistAlbum
        fields = ['id', 'album_slug', 'album_title', 'album_cover', 'description', 'order']


class SpecialistPagePhotoSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = SpecialistPagePhoto
        fields = ['id', 'image', 'caption', 'order', 'is_active']


class SpecialistPageSectionSerializer(serializers.ModelSerializer):
    photos = SpecialistPagePhotoSerializer(many=True, read_only=True)
    link_url = serializers.SerializerMethodField()
    has_link = serializers.ReadOnlyField()

    class Meta:
        model = SpecialistPageSection
        fields = [
            'id', 'title', 'subtitle', 'description', 'icon', 'accent', 'kind',
            'link_label', 'link_url', 'has_link', 'order', 'is_active', 'photos',
        ]

    def get_link_url(self, obj):
        return obj.get_link_url()


class SpecialistPageSerializer(serializers.ModelSerializer):
    specialists = SpecialistSerializer(many=True, read_only=True)
    sections = SpecialistPageSectionSerializer(many=True, read_only=True)
    page_type_display = serializers.CharField(source='get_page_type_display', read_only=True)

    class Meta:
        model = SpecialistPage
        fields = [
            'id', 'page_type', 'page_type_display', 'title', 'intro', 'description',
            'theme_title', 'theme_period', 'theme_text',
            'specialists', 'sections',
        ]
