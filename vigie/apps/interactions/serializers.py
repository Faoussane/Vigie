from rest_framework import serializers

from apps.blog.models import Article
from apps.blog.serializers import ArticleListSerializer

from .models import Collection, Comment, Favorite


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    reports_count = serializers.IntegerField(read_only=True, default=0)
    article = serializers.SlugRelatedField(slug_field="slug", queryset=Article.objects.all())

    class Meta:
        model = Comment
        fields = ("id", "article", "author", "content", "is_hidden", "reports_count", "created_at")
        read_only_fields = ("is_hidden",)


class FavoriteSerializer(serializers.ModelSerializer):
    article = ArticleListSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ("id", "article", "collection", "created_at")


class CollectionSerializer(serializers.ModelSerializer):
    favorites_count = serializers.IntegerField(source="favorites.count", read_only=True)

    class Meta:
        model = Collection
        fields = ("id", "name", "favorites_count")
