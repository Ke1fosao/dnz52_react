from django.db.models import F
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Document, DocumentCategory
from .serializers import DocumentCategorySerializer, DocumentSerializer


class DocumentCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DocumentCategory.objects.all()
    serializer_class = DocumentCategorySerializer
    lookup_field = 'slug'
    pagination_class = None


class DocumentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Document.objects.filter(is_published=True).select_related('category')
    serializer_class = DocumentSerializer
    filterset_fields = ['category__slug']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'title', 'downloads']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'])
    def track_download(self, request, pk=None):
        """Інкрементує лічильник завантажень. POST /api/v1/documents/<id>/track_download/"""
        doc = self.get_object()
        Document.objects.filter(pk=doc.pk).update(downloads=F('downloads') + 1)
        return Response({'status': 'ok'})
