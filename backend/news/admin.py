from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from simple_history.admin import SimpleHistoryAdmin
from .models import NewsCategory, News, NewsTag


@admin.register(NewsCategory)
class NewsCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(NewsTag)
class NewsTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']


@admin.register(News)
class NewsAdmin(SimpleHistoryAdmin):
    list_display = ['title', 'category', 'status_badge', 'created_at', 'views', 'preview_link']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['title', 'content']
    prepopulated_fields = {'slug': ('title',)}
    list_editable = []
    readonly_fields = ['views', 'created_at', 'updated_at']
    filter_horizontal = ['tags']
    save_on_top = True

    fieldsets = (
        ('Основне', {
            'fields': ('title', 'slug', 'category', 'tags', 'image'),
        }),
        ('Контент', {
            'fields': ('content',),
            'description': 'Редактор підтримує <b>Markdown</b>: '
                           '<code>**жирний**</code>, <code># Заголовок</code>, '
                           '<code>- список</code>, <code>[текст](посилання)</code>. '
                           'Старі новини з HTML теж відображаються коректно.',
        }),
        ('📢 Публікація', {
            'fields': ('status', 'publish_at'),
            'description': '<b>Чернетка</b> — не видно на сайті (можна переглянути за прямим посиланням).<br>'
                           '<b>Опубліковано</b> — видно одразу.<br>'
                           '<b>Заплановано</b> — зʼявиться автоматично у вказану дату «Опублікувати о».',
        }),
        ('Статистика', {
            'fields': ('views', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Статус')
    def status_badge(self, obj):
        colors = {'draft': '#9CA3AF', 'published': '#22C55E', 'scheduled': '#F59E0B'}
        label = obj.get_status_display()
        if obj.status == 'scheduled' and obj.publish_at:
            label += f' ({obj.publish_at.strftime("%d.%m %H:%M")})'
        return format_html(
            '<span style="padding:3px 10px; border-radius:10px; font-size:0.78rem; '
            'font-weight:600; color:#fff; background:{};">{}</span>',
            colors.get(obj.status, '#9CA3AF'), label,
        )

    @admin.display(description='Перегляд')
    def preview_link(self, obj):
        # Пряме посилання на новину в React (працює і для чернеток)
        return format_html(
            '<a href="/news/{}" target="_blank" rel="noopener">👁 Відкрити</a>',
            obj.slug,
        )
