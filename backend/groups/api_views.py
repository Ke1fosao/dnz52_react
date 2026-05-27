from rest_framework import viewsets

from .models import Group
from .serializers import GroupListSerializer, GroupDetailSerializer


class GroupViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Group.objects.filter(is_published=True).prefetch_related('staff')
    lookup_field = 'slug'
    filterset_fields = ['age_group']
    pagination_class = None
    ordering = ['order', 'name']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return GroupDetailSerializer
        return GroupListSerializer
