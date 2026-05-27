from rest_framework import viewsets

from .models import Circle
from .serializers import CircleListSerializer, CircleDetailSerializer


class CircleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Circle.objects.filter(is_published=True)
    lookup_field = 'slug'
    pagination_class = None
    ordering = ['order', 'name']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CircleDetailSerializer
        return CircleListSerializer
