from rest_framework import serializers

from .models import GalleryCategory, GalleryAlbum, GalleryPhoto


class GalleryCategorySerializer(serializers.ModelSerializer):
    albums_count = serializers.IntegerField(source='albums.count', read_only=True)

    class Meta:
        model = GalleryCategory
        fields = ['id', 'name', 'slug', 'icon', 'color', 'order', 'albums_count']


class GalleryPhotoSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = GalleryPhoto
        fields = ['id', 'image', 'title', 'description', 'order']


class GalleryAlbumListSerializer(serializers.ModelSerializer):
    """Для списку — без фото, тільки cover."""
    cover = serializers.ImageField(use_url=True)
    category = GalleryCategorySerializer(read_only=True)
    photos_count = serializers.IntegerField(source='photos.count', read_only=True)

    class Meta:
        model = GalleryAlbum
        fields = [
            'id', 'title', 'slug', 'description', 'cover',
            'category', 'created_at', 'is_published', 'photos_count',
        ]


class GalleryAlbumDetailSerializer(serializers.ModelSerializer):
    cover = serializers.ImageField(use_url=True)
    category = GalleryCategorySerializer(read_only=True)
    photos = GalleryPhotoSerializer(many=True, read_only=True)

    class Meta:
        model = GalleryAlbum
        fields = [
            'id', 'title', 'slug', 'description', 'cover',
            'category', 'created_at', 'is_published', 'photos',
        ]
