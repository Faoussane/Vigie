from django.contrib import admin

from .models import VeilleItem


@admin.register(VeilleItem)
class VeilleItemAdmin(admin.ModelAdmin):
    list_display = ("title", "source", "status", "importance", "published_at")
    list_filter = ("status", "source")
    search_fields = ("title", "summary")
