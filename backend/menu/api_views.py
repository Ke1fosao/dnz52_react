from datetime import date, timedelta

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import DailyMenu, MenuTemplate
from .serializers import DailyMenuSerializer


def _template_map():
    """{weekday: MenuTemplate} для активних шаблонів."""
    return {t.weekday: t for t in MenuTemplate.objects.filter(is_active=True)}


def _menu_for_date(d, daily_map, tpl_map):
    """Повертає dict меню на дату: спершу DailyMenu, інакше — шаблон за днем тижня.
    Якщо нічого нема — повертає None."""
    daily = daily_map.get(d)
    if daily and daily.has_any_meal:
        data = DailyMenuSerializer(daily).data
        data['source'] = 'daily'
        return data

    tpl = tpl_map.get(d.weekday())
    if tpl and tpl.has_any_meal:
        return {
            'id': None,
            'date': d.isoformat(),
            'breakfast': tpl.breakfast,
            'second_breakfast': tpl.second_breakfast,
            'lunch': tpl.lunch,
            'snack': tpl.snack,
            'dinner': tpl.dinner,
            'note': tpl.note,
            'is_published': True,
            'has_any_meal': True,
            'source': 'template',  # позначка що це з шаблону-основи
        }
    return None


class DailyMenuViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для денних меню.

    URL-и:
      GET /api/v1/menu/                 — список меню (пагінація)
      GET /api/v1/menu/today/           — меню на сьогодні (+ fallback на шаблон)
      GET /api/v1/menu/week/?start=YMD  — меню на тиждень (+ fallback на шаблон)
      GET /api/v1/menu/<YYYY-MM-DD>/    — конкретна дата
    """
    queryset = DailyMenu.objects.filter(is_published=True)
    serializer_class = DailyMenuSerializer
    lookup_field = 'date'
    filterset_fields = ['date']
    ordering = ['-date']

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Меню на сьогодні. Якщо немає DailyMenu — бере шаблон за днем тижня."""
        today = date.today()
        daily = DailyMenu.objects.filter(is_published=True, date=today).first()
        if daily and daily.has_any_meal:
            data = DailyMenuSerializer(daily).data
            data['source'] = 'daily'
            return Response({'menu': data})

        # fallback на шаблон
        tpl_map = _template_map()
        menu = _menu_for_date(today, {}, tpl_map)
        return Response({'menu': menu})

    @action(detail=False, methods=['get'])
    def week(self, request):
        """Меню на тиждень: ?start=YYYY-MM-DD (default — поточний понеділок).
        Для днів без DailyMenu підставляє шаблон-основу."""
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

        # Завантажуємо DailyMenu тижня + шаблони одним махом
        dailies = DailyMenu.objects.filter(
            is_published=True, date__gte=start_date, date__lte=end_date,
        )
        daily_map = {m.date: m for m in dailies}
        tpl_map = _template_map()

        menus = []
        for i in range(7):
            d = start_date + timedelta(days=i)
            m = _menu_for_date(d, daily_map, tpl_map)
            if m:
                menus.append(m)

        return Response({
            'start': start_date.isoformat(),
            'end': end_date.isoformat(),
            'menus': menus,
        })
