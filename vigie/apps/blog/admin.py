from django.contrib import admin

from .models import Article, ArticleSource, Category, Tag


class ArticleSourceInline(admin.TabularInline):
    model = ArticleSource
    extra = 1


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "status", "author", "published_at", "view_count")
    list_filter = ("status", "category")
    search_fields = ("title", "content")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ArticleSourceInline]


admin.site.register(Category)
admin.site.register(Tag)
