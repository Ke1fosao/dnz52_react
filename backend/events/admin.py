from django.contrib import admin
from django.utils.html import format_html
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_type_chip', 'start_date_display',
                    'group', 'is_past_or_upcoming', 'is_published']
    list_editable = ['is_published']
    list_filter = ['event_type', 'is_published', 'group']
    search_fields = ['title', 'description', 'location']
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'start_date'
    ordering = ['-start_date']
    save_on_top = True

    fieldsets = (
        ('Основне', {
            'fields': ('title', 'slug', 'event_type', 'description'),
        }),
        ('🗓️ Дата і місце', {
            'fields': ('start_date', 'end_date', 'location'),
            'description': 'Якщо подія однієї дати — залиште «Закінчення» порожнім.'
        }),
        ('Деталі', {
            'fields': ('image', 'group'),
            'description': 'Зображення — обкладинка події. Група — якщо подія '
                            'для однієї конкретної групи.'
        }),
        ('Налаштування', {
            'fields': ('is_published',),
        }),
    )

    def event_type_chip(self, obj):
        return format_html(
            '<span style="display:inline-block; padding:3px 12px; border-radius:12px; '
            'background:{0}22; color:{0}; font-weight:600; font-size:0.78rem;">{1}</span>',
            obj.color, obj.get_event_type_display(),
        )
    event_type_chip.short_description = 'Тип'

    def start_date_display(self, obj):
        return obj.start_date.strftime('%d.%m.%Y, %H:%M')
    start_date_display.short_description = 'Початок'
    start_date_display.admin_order_field = 'start_date'

    def is_past_or_upcoming(self, obj):
        if obj.is_today:
            return format_html('<span style="color:#FF9F1A; font-weight:600;">🎯 Сьогодні</span>')
        elif obj.is_past:
            return format_html('<span style="color:#aaa;">⌛ Минула</span>')
        return format_html('<span style="color:#1F9B82; font-weight:600;">📅 Майбутня</span>')
    is_past_or_upcoming.short_description = 'Статус'
