from rest_framework import viewsets

from .models import SpecialistPage
from .serializers import SpecialistPageSerializer


class SpecialistPageViewSet(viewsets.ReadOnlyModelViewSet):
    """Сторінки спеціалістів — list (всі 5) і retrieve по page_type."""
    queryset = SpecialistPage.objects.prefetch_related(
        'specialists', 'sections__photos',
    )
    serializer_class = SpecialistPageSerializer
    lookup_field = 'page_type'
    pagination_class = None
