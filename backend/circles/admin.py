from django.contrib import admin
from .models import Circle, CircleBenefit, CircleSession, CircleDocument


class CircleBenefitInline(admin.TabularInline):
    model = CircleBenefit
    extra = 1


class CircleSessionInline(admin.TabularInline):
    model = CircleSession
    extra = 1


@admin.register(Circle)
class CircleAdmin(admin.ModelAdmin):
    list_display  = ['name', 'leader', 'age_group', 'is_featured', 'order', 'is_published']
    list_editable = ['is_featured', 'order', 'is_published']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [CircleBenefitInline, CircleSessionInline]
    fieldsets = (
        ('Основне', {'fields': ('name', 'slug', 'tagline', 'is_published', 'is_featured', 'order', 'icon', 'color', 'cover')}),
        ('Інформація', {'fields': ('leader', 'age_group', 'schedule', 'duration', 'format', 'price')}),
        ('Контент', {'fields': ('goal', 'description')}),
        ('Альбом', {'fields': ('album',)}),
    )


@admin.register(CircleDocument)
class CircleDocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'document', 'order']
    list_editable = ['order']
