from django.contrib import admin

from .models import EnrollmentApplication


@admin.register(EnrollmentApplication)
class EnrollmentApplicationAdmin(admin.ModelAdmin):
    list_display = ('child_name', 'parent_name', 'phone', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('child_name', 'parent_name', 'phone', 'email')
    list_editable = ('status',)
    readonly_fields = ('created_at', 'handled_by', 'handled_at')
    date_hierarchy = 'created_at'
