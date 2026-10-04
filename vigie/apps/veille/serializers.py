from rest_framework import serializers

from .models import VeilleItem


class VeilleItemSerializer(serializers.ModelSerializer):
    """Élément de veille. Seuls ``status`` et ``notes`` sont modifiables."""

    source_name = serializers.CharField(source="source.name", read_only=True)
    suggested_category_name = serializers.CharField(source="suggested_category.name", read_only=True, default=None)
    article_slug = serializers.CharField(source="article.slug", read_only=True, default=None)

    class Meta:
        model = VeilleItem
        fields = (
            "id", "source", "source_name", "title", "url", "summary", "image_url", "published_at",
            "status", "notes", "article_slug", "ai_data", "importance",
            "suggested_category_name", "duplicate_of", "created_at",
        )
        read_only_fields = tuple(f for f in fields if f not in ("status", "notes"))
