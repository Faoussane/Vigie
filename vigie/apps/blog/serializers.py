"""Serializers du blog."""
from django.db import transaction
from rest_framework import serializers

from apps.sources.models import Source
from apps.sources.serializers import SourceSerializer

from .models import Article, ArticleSource, Category, Tag


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description", "articles_count")
        read_only_fields = ("slug",)

    articles_count = serializers.IntegerField(read_only=True, default=0)


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name", "slug")
        read_only_fields = ("slug",)


class ArticleSourceSerializer(serializers.ModelSerializer):
    """Source d'un article, avec sa date de consultation."""

    source = SourceSerializer(read_only=True)
    source_id = serializers.PrimaryKeyRelatedField(
        queryset=Source.objects.all(), source="source", write_only=True
    )

    class Meta:
        model = ArticleSource
        fields = ("source", "source_id", "consulted_at")


class ArticleListSerializer(serializers.ModelSerializer):
    """Version allégée pour les listes (accueil, recherche)."""

    author = serializers.StringRelatedField()
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    likes_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Article
        fields = (
            "id", "title", "slug", "cover_image", "summary", "author", "category", "tags",
            "status", "published_at", "view_count", "comments_count", "likes_count",
        )


class ArticleDetailSerializer(ArticleListSerializer):
    """Version complète, lecture et écriture.

    En écriture : ``category_id``, ``tag_ids`` et ``article_sources`` sont
    acceptés ; ``author`` est fixé par la vue.
    """

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True, required=False, allow_null=True
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), source="tags", many=True, write_only=True, required=False
    )
    article_sources = ArticleSourceSerializer(many=True, required=False)
    is_liked = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()

    class Meta(ArticleListSerializer.Meta):
        fields = ArticleListSerializer.Meta.fields + (
            "content", "category_id", "tag_ids", "article_sources",
            "created_at", "updated_at", "is_liked", "is_favorited",
        )
        read_only_fields = ("slug", "view_count")

    def validate(self, attrs):
        """Un article planifié doit avoir une date de publication."""
        new_status = attrs.get("status", getattr(self.instance, "status", None))
        published_at = attrs.get("published_at", getattr(self.instance, "published_at", None))
        if new_status == Article.Status.SCHEDULED and not published_at:
            raise serializers.ValidationError({"published_at": "Date requise pour un article planifié."})
        return attrs

    def _user(self):
        request = self.context.get("request")
        return request.user if request and request.user.is_authenticated else None

    def get_is_liked(self, obj) -> bool:
        user = self._user()
        return bool(user) and obj.likes.filter(user=user).exists()

    def get_is_favorited(self, obj) -> bool:
        user = self._user()
        return bool(user) and obj.favorites.filter(user=user).exists()

    @staticmethod
    def _set_sources(article, items):
        article.article_sources.all().delete()
        for item in items:
            ArticleSource.objects.create(article=article, **item)

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop("article_sources", [])
        tags = validated_data.pop("tags", [])
        article = Article.objects.create(**validated_data)
        article.tags.set(tags)
        self._set_sources(article, items)
        return article

    @transaction.atomic
    def update(self, instance, validated_data):
        items = validated_data.pop("article_sources", None)
        tags = validated_data.pop("tags", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            instance.tags.set(tags)
        if items is not None:
            self._set_sources(instance, items)
        return instance
