from django.contrib import admin

from .models import Source


@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    list_display = ("name", "source_type", "url", "is_active")
    list_filter = ("source_type", "is_active")
    search_fields = ("name", "url")
