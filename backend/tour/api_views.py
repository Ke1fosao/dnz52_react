from rest_framework import viewsets

from .models import TourStop
from .serializers import TourStopSerializer


class TourStopViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/v1/tour/ — опубліковані зупинки віртуального туру (впорядковані)."""
    queryset = TourStop.objects.filter(is_published=True)
    serializer_class = TourStopSerializer
    pagination_class = None
