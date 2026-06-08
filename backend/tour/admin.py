from django.contrib import admin

from .models import TourStop


@admin.register(TourStop)
class TourStopAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_published')
    list_editable = ('order', 'is_published')
    search_fields = ('title',)
