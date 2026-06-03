from datetime import timezone as dt_timezone

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.html import strip_tags
from rest_framework import viewsets

from .models import Event
from .serializers import EventSerializer


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/v1/events/            — опубліковані події (фільтр ?year=&month=)
       GET /api/v1/events/{slug}/     — одна подія."""
    serializer_class = EventSerializer
    lookup_field = 'slug'
    pagination_class = None

    def get_queryset(self):
        qs = Event.objects.filter(is_published=True)
        year = self.request.query_params.get('year')
        month = self.request.query_params.get('month')
        if year and month:
            try:
                qs = qs.filter(start_date__year=int(year), start_date__month=int(month))
            except (TypeError, ValueError):
                pass
        return qs.order_by('start_date')


def _ical_dt(dt):
    if not dt:
        return ''
    return dt.astimezone(dt_timezone.utc).strftime('%Y%m%dT%H%M%SZ')


def _ical_escape(text):
    return (text or '').replace('\\', '\\\\').replace('\n', '\\n').replace(',', '\\,').replace(';', '\\;')


def event_ical(request, slug):
    """Завантаження події у форматі .ics (для Apple Calendar, Outlook тощо)."""
    event = get_object_or_404(Event, slug=slug, is_published=True)
    end = event.end_date or event.start_date
    desc = _ical_escape(strip_tags(event.description or ''))[:600]
    lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//ZDO52//Events//UK',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        f'UID:event-{event.id}@dnz52',
        f'DTSTAMP:{_ical_dt(timezone.now())}',
        f'DTSTART:{_ical_dt(event.start_date)}',
        f'DTEND:{_ical_dt(end)}',
        f'SUMMARY:{_ical_escape(event.title)}',
        f'DESCRIPTION:{desc}',
        f'LOCATION:{_ical_escape(event.location)}',
        'END:VEVENT',
        'END:VCALENDAR',
    ]
    resp = HttpResponse('\r\n'.join(lines), content_type='text/calendar; charset=utf-8')
    resp['Content-Disposition'] = f'attachment; filename="{slug}.ics"'
    return resp
