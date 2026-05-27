from datetime import timedelta

from django.contrib import admin, messages
from django.utils import timezone
from django.utils.html import format_html

from .models import FAQCategory, FAQItem, FAQQuestionSubmission


@admin.register(FAQCategory)
class FAQCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'color_chip', 'icon', 'items_count', 'order']
    list_editable = ['order']
    prepopulated_fields = {'slug': ('name',)}

    def color_chip(self, obj):
        return format_html(
            '<span style="display:inline-block; width:20px; height:20px; vertical-align:middle; '
            'border-radius:6px; background:{0}; border:1px solid rgba(0,0,0,0.1);"></span>'
            '<span style="margin-left:8px; font-family:monospace;">{0}</span>',
            obj.color,
        )
    color_chip.short_description = 'Колір'

    def items_count(self, obj):
        return obj.items.count()
    items_count.short_description = 'Питань'


@admin.register(FAQItem)
class FAQItemAdmin(admin.ModelAdmin):
    list_display = ['question', 'category_chip', 'order', 'is_published']
    list_editable = ['order', 'is_published']
    list_filter = ['category', 'is_published']
    search_fields = ['question', 'answer']

    fieldsets = (
        ('Питання та відповідь', {
            'fields': ('question', 'answer', 'category'),
        }),
        ('Налаштування', {
            'fields': ('order', 'is_published'),
        }),
    )

    def category_chip(self, obj):
        if not obj.category:
            return format_html('<span style="color:#aaa;">— Без категорії —</span>')
        return format_html(
            '<span style="display:inline-block; padding:3px 12px; border-radius:12px; '
            'background:{0}22; color:{0}; font-weight:600; font-size:0.78rem;">{1}</span>',
            obj.category.color, obj.category.name,
        )
    category_chip.short_description = 'Категорія'


# ============================================================================
# Запитання від батьків — фільтр по простроченим дзвінкам
# ============================================================================

class OverdueCallbackFilter(admin.SimpleListFilter):
    """Бічний фільтр в адмінці: «Прострочені дзвінки» — статус CALLBACK
       а дата вже минула. Корисно щоб не пропустити термінові."""

    title = '⚠️ Прострочені дзвінки'
    parameter_name = 'overdue'

    def lookups(self, request, model_admin):
        return (
            ('overdue', '⚠️ Тільки прострочені'),
            ('today',   '📞 Передзвонити сьогодні'),
            ('upcoming', '🔜 Передзвонити пізніше'),
        )

    def queryset(self, request, queryset):
        today = timezone.localdate()
        Status = FAQQuestionSubmission.Status
        if self.value() == 'overdue':
            return queryset.filter(status=Status.CALLBACK, callback_date__lt=today)
        if self.value() == 'today':
            return queryset.filter(status=Status.CALLBACK, callback_date=today)
        if self.value() == 'upcoming':
            return queryset.filter(status=Status.CALLBACK, callback_date__gt=today)
        return queryset


# ============================================================================
# Адмінка для запитань від батьків
# ============================================================================

# Кольори чіпів для кожного статусу (фон, текст)
_STATUS_COLORS = {
    'new':         ('#FCE6E9', '#B23A48'),   # червонуватий — увага, нове
    'in_progress': ('#FFF3CD', '#856404'),   # жовтий — в роботі
    'callback':    ('#D9ECFF', '#1A5FB4'),   # блакитний — заплановано
    'done':        ('#E0FAF3', '#1F9B82'),   # зелений — готово
}
_STATUS_LABELS = {
    'new':         '🆕 Нове',
    'in_progress': '👀 В обробці',
    'callback':    '📞 Передзвонити',
    'done':        '✅ Оброблено',
}


@admin.register(FAQQuestionSubmission)
class FAQQuestionSubmissionAdmin(admin.ModelAdmin):
    """Запитання надіслані відвідувачами через форму на сторінці FAQ."""

    list_display = ['status_chip', 'name', 'phone_link', 'question_short',
                    'callback_cell', 'created_at_short', 'handled_by']
    list_filter = ['status', OverdueCallbackFilter, 'created_at']
    search_fields = ['name', 'phone', 'question', 'admin_note']
    readonly_fields = ['created_at', 'handled_at', 'handled_by']
    list_per_page = 30
    save_on_top = True
    date_hierarchy = 'created_at'

    fieldsets = (
        ('📩 Запитання від відвідувача', {
            'fields': ('name', 'phone', 'question', 'created_at'),
            'description': 'Це дані які надіслав відвідувач сайту через форму. '
                            'Натисніть на телефон щоб подзвонити.',
        }),
        ('🛠 Обробка запитання', {
            'fields': ('status', 'callback_date', 'handled_at', 'handled_by', 'admin_note'),
            'description': (
                'Послідовність роботи зазвичай така: '
                '🆕 Нове → 👀 В обробці → (за потреби) 📞 Передзвонити (з датою) → ✅ Оброблено. '
                'Якщо обрали «Передзвонити» — обов’язково проставте дату коли саме.'
            ),
        }),
    )

    actions = [
        'mark_in_progress',
        'mark_callback_tomorrow',
        'mark_callback_in_3_days',
        'mark_done',
        'mark_new',
    ]

    # --------- Кастомні колонки для list_display ---------

    def status_chip(self, obj):
        """Кольоровий чіп статусу. Для CALLBACK з простроченою датою — окремий
        червоний чіп «⚠️ Прострочено»."""
        if obj.is_overdue:
            return format_html(
                '<span style="background:#F8D7DA; color:#B23A48; padding:3px 10px; '
                'border-radius:12px; font-weight:700; font-size:0.78rem; '
                'border:1px solid #B23A48;">⚠️ Прострочено</span>'
            )
        bg, fg = _STATUS_COLORS.get(obj.status, ('#eee', '#333'))
        label  = _STATUS_LABELS.get(obj.status, obj.status)
        return format_html(
            '<span style="background:{0}; color:{1}; padding:3px 10px; '
            'border-radius:12px; font-weight:700; font-size:0.78rem;">{2}</span>',
            bg, fg, label,
        )
    status_chip.short_description = 'Статус'
    status_chip.admin_order_field = 'status'

    def phone_link(self, obj):
        return format_html('<a href="tel:{0}" style="font-weight:600;">📞 {0}</a>', obj.phone)
    phone_link.short_description = 'Телефон'

    def question_short(self, obj):
        return obj.question[:80] + ('…' if len(obj.question) > 80 else '')
    question_short.short_description = 'Запитання'

    def callback_cell(self, obj):
        """У списку показуємо дату повторного дзвінка. Якщо прострочено —
        підсвічуємо червоним щоб одразу впадало в око."""
        if not obj.callback_date:
            return format_html('<span style="color:#bbb;">—</span>')
        date_str = obj.callback_date.strftime('%d.%m.%Y')
        today = timezone.localdate()
        if obj.status == FAQQuestionSubmission.Status.CALLBACK and obj.callback_date < today:
            days = (today - obj.callback_date).days
            return format_html(
                '<span style="color:#B23A48; font-weight:700;" '
                'title="Прострочено на {1} дн.">⚠️ {0}</span>',
                date_str, days,
            )
        if obj.status == FAQQuestionSubmission.Status.CALLBACK and obj.callback_date == today:
            return format_html(
                '<span style="color:#1A5FB4; font-weight:700;" title="Сьогодні!">📞 {0}</span>',
                date_str,
            )
        return format_html('<span>{0}</span>', date_str)
    callback_cell.short_description = 'Передзвонити'
    callback_cell.admin_order_field = 'callback_date'

    def created_at_short(self, obj):
        return obj.created_at.strftime('%d.%m.%Y %H:%M')
    created_at_short.short_description = 'Надіслано'
    created_at_short.admin_order_field = 'created_at'

    # --------- Збереження: автоматично фіксуємо handled_at/handled_by ---------

    def save_model(self, request, obj, form, change):
        """Авто-логіка коли змінюється статус:
           - стає DONE → фіксуємо handled_at + handled_by
           - йде з DONE → очищаємо handled_at + handled_by
           - НЕ CALLBACK → очищаємо callback_date (щоб не плуталось)
        """
        DONE = FAQQuestionSubmission.Status.DONE
        CALLBACK = FAQQuestionSubmission.Status.CALLBACK

        old_status = None
        if change:
            try:
                old_status = FAQQuestionSubmission.objects.get(pk=obj.pk).status
            except FAQQuestionSubmission.DoesNotExist:
                old_status = None

        if obj.status == DONE and old_status != DONE:
            obj.handled_at = timezone.now()
            obj.handled_by = request.user
        elif old_status == DONE and obj.status != DONE:
            obj.handled_at = None
            obj.handled_by = None

        # Якщо статус не CALLBACK — дата повторного дзвінка не має сенсу
        if obj.status != CALLBACK:
            obj.callback_date = None

        super().save_model(request, obj, form, change)

    # --------- Bulk actions ---------

    @admin.action(description='👀 Позначити «В обробці»')
    def mark_in_progress(self, request, queryset):
        updated = queryset.update(status=FAQQuestionSubmission.Status.IN_PROGRESS,
                                  callback_date=None)
        self.message_user(request, f'Позначено «В обробці»: {updated}.', messages.SUCCESS)

    @admin.action(description='📞 Передзвонити завтра')
    def mark_callback_tomorrow(self, request, queryset):
        tomorrow = timezone.localdate() + timedelta(days=1)
        updated = queryset.update(status=FAQQuestionSubmission.Status.CALLBACK,
                                  callback_date=tomorrow)
        self.message_user(
            request,
            f'Заплановано передзвонити завтра ({tomorrow.strftime("%d.%m.%Y")}): {updated}.',
            messages.SUCCESS,
        )

    @admin.action(description='📞 Передзвонити через 3 дні')
    def mark_callback_in_3_days(self, request, queryset):
        target = timezone.localdate() + timedelta(days=3)
        updated = queryset.update(status=FAQQuestionSubmission.Status.CALLBACK,
                                  callback_date=target)
        self.message_user(
            request,
            f'Заплановано передзвонити {target.strftime("%d.%m.%Y")}: {updated}.',
            messages.SUCCESS,
        )

    @admin.action(description='✅ Позначити «Оброблено»')
    def mark_done(self, request, queryset):
        updated = 0
        for obj in queryset:
            if obj.status != FAQQuestionSubmission.Status.DONE:
                obj.status = FAQQuestionSubmission.Status.DONE
                obj.handled_at = timezone.now()
                obj.handled_by = request.user
                obj.callback_date = None
                obj.save()
                updated += 1
        self.message_user(request, f'Позначено обробленими: {updated}.', messages.SUCCESS)

    @admin.action(description='↩️ Повернути в «Нові»')
    def mark_new(self, request, queryset):
        updated = queryset.update(
            status=FAQQuestionSubmission.Status.NEW,
            handled_at=None, handled_by=None, callback_date=None,
        )
        self.message_user(request, f'Повернено у статус «Нові»: {updated}.', messages.SUCCESS)
