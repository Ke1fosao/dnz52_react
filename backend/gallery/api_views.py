from rest_framework import viewsets

from .models import GalleryCategory, GalleryAlbum
from .serializers import (
    GalleryCategorySerializer,
    GalleryAlbumListSerializer, GalleryAlbumDetailSerializer,
)


class GalleryCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GalleryCategory.objects.all()
    serializer_class = GalleryCategorySerializer
    lookup_field = 'slug'
    pagination_class = None


class GalleryAlbumViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GalleryAlbum.objects.filter(is_published=True).select_related('category').prefetch_related('photos')
    lookup_field = 'slug'
    filterset_fields = ['category__slug']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return GalleryAlbumDetailSerializer
        return GalleryAlbumListSerializer
