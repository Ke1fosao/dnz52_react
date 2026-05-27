from datetime import date, timedelta

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import DailyMenu
from .serializers import DailyMenuSerializer


class DailyMenuViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для денних меню.

    URL-и (через DRF router):
      GET /api/v1/menu/                 — список меню (з пагінацією)
      GET /api/v1/menu/today/           — меню на сьогодні
      GET /api/v1/menu/week/?start=YMD  — меню на тиждень
      GET /api/v1/menu/<YYYY-MM-DD>/    — конкретна дата

    ВАЖЛИВО: today/ та week/ як @action — DRF генерує їх ПЕРЕД lookup pattern,
    тому вони не конфліктують з detail URL (/menu/<date>/).
    """
    queryset = DailyMenu.objects.filter(is_published=True)
    serializer_class = DailyMenuSerializer
    lookup_field = 'date'
    filterset_fields = ['date']
    ordering = ['-date']

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Меню на сьогодні (або найближчий доступний день)."""
        today = date.today()
        menu = DailyMenu.objects.filter(is_published=True, date=today).first()
        if not menu:
            menu = DailyMenu.objects.filter(
                is_published=True, date__gte=today
            ).order_by('date').first()
        if not menu:
            return Response({'menu': None})
        return Response({'menu': DailyMenuSerializer(menu).data})

    @action(detail=False, methods=['get'])
    def week(self, request):
        """Меню на тиждень: ?start=YYYY-MM-DD (default — поточний понеділок)."""
        start_str = request.query_params.get('start')
        if start_str:
            try:
                start_date = date.fromisoformat(start_str)
            except ValueError:
                return Response({'error': 'Невалідна дата'}, status=400)
        else:
            today = date.today()
            start_date = today - timedelta(days=today.weekday())

        end_date = start_date + timedelta(days=6)
        menus = DailyMenu.objects.filter(
            is_published=True,
            date__gte=start_date,
            date__lte=end_date,
        ).order_by('date')

        return Response({
            'start': start_date.isoformat(),
            'end': end_date.isoformat(),
            'menus': DailyMenuSerializer(menus, many=True).data,
        })
