import calendar
from datetime import date, datetime, timedelta
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.http import Http404
from .models import Event


_MONTHS_UK = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
              'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень']
_MONTHS_UK_GENITIVE = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
                       'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня']
_WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']


def _parse_year_month(year_str, month_str):
    """Парсить рік і місяць з URL. Якщо невалідно — повертає поточний."""
    today = timezone.now().date()
    try:
        y = int(year_str)
        m = int(month_str)
        if 1 <= m <= 12 and 2000 <= y <= 2100:
            return y, m
    except (ValueError, TypeError):
        pass
    return today.year, today.month


def events_calendar(request, year=None, month=None):
    """Сторінка-календар: сітка місяця + список найближчих подій збоку."""
    today = timezone.now().date()
    y, m = _parse_year_month(year, month)

    # Перший і останній день місяця
    first_day = date(y, m, 1)
    last_day_num = calendar.monthrange(y, m)[1]
    last_day = date(y, m, last_day_num)

    # Завантажуємо всі події, що перетинають цей місяць
    month_start_dt = timezone.make_aware(datetime.combine(first_day, datetime.min.time()))
    month_end_dt = timezone.make_aware(datetime.combine(last_day, datetime.max.time()))

    events_in_month = Event.objects.filter(
        is_published=True,
        start_date__lte=month_end_dt,
        start_date__gte=month_start_dt,
    ).select_related('group')

    # Будуємо словник: дата → список подій
    events_by_date = {}
    for ev in events_in_month:
        d = ev.start_date.date()
        events_by_date.setdefault(d, []).append(ev)

    # Будуємо сітку календаря: списки тижнів, у кожному 7 днів (Пн-Нд)
    cal = calendar.Calendar(firstweekday=0)  # 0 = понеділок
    weeks = []
    for week in cal.monthdatescalendar(y, m):
        week_cells = []
        for d in week:
            week_cells.append({
                'date':        d,
                'day':         d.day,
                'in_month':    d.month == m,
                'is_today':    d == today,
                'is_past':     d < today,
                'events':      events_by_date.get(d, []),
            })
        weeks.append(week_cells)

    # Список найближчих 5 подій від сьогодні
    now_dt = timezone.now()
    upcoming = Event.objects.filter(
        is_published=True, start_date__gte=now_dt
    ).select_related('group')[:5]

    # Минулі події (5 останніх)
    past = Event.objects.filter(
        is_published=True, start_date__lt=now_dt
    ).order_by('-start_date').select_related('group')[:5]

    # Навігація — попередній/наступний місяць
    prev_y, prev_m = (y - 1, 12) if m == 1 else (y, m - 1)
    next_y, next_m = (y + 1, 1) if m == 12 else (y, m + 1)

    return render(request, 'events/events_calendar.html', {
        'year':            y,
        'month':           m,
        'month_name':      _MONTHS_UK[m - 1],
        'first_day':       first_day,
        'last_day':        last_day,
        'weeks':           weeks,
        'weekdays':        _WEEKDAYS_SHORT,
        'today':           today,
        'upcoming':        upcoming,
        'past':            past,
        'prev_url':        f'?year={prev_y}&month={prev_m}',
        'next_url':        f'?year={next_y}&month={next_m}',
        'today_url':       f'?year={today.year}&month={today.month}',
        'is_current_month': (y == today.year and m == today.month),
    })


def event_detail(request, slug):
    """Детальна сторінка події."""
    event = get_object_or_404(Event, slug=slug, is_published=True)

    # Інші майбутні події (не ця)
    other_upcoming = Event.objects.filter(
        is_published=True, start_date__gte=timezone.now()
    ).exclude(pk=event.pk)[:4]

    return render(request, 'events/event_detail.html', {
        'event': event,
        'other_upcoming': other_upcoming,
    })
