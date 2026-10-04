"""Vues du blog : articles, catégories, tags."""
from django.db.models import Count, F, Q
from django.utils import timezone
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.parsers import MultiPartParser
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsAdminOrReadOnly
from apps.interactions.models import Favorite, Like

from .models import Article, Category, Tag
from .selectors import promote_scheduled
from .serializers import (
    ArticleDetailSerializer,
    ArticleListSerializer,
    CategorySerializer,
    TagSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.annotate(articles_count=Count("articles", filter=Q(articles__status="PUBLISHED")))
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"
    pagination_class = None
    search_fields = ["name"]


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"
    search_fields = ["name"]

    @action(detail=False, methods=["get"])
    def popular(self, request):
        """GET /api/tags/popular/ — les 15 tags les plus utilisés."""
        tags = Tag.objects.annotate(n=Count("articles")).order_by("-n")[:15]
        return Response(TagSerializer(tags, many=True).data)


class ArticleViewSet(viewsets.ModelViewSet):
    """CRUD des articles, recherche, filtres, likes et favoris.

    * Visiteurs/utilisateurs : uniquement les articles PUBLIÉS dont la date est passée.
    * Administrateurs : tous les articles, tous statuts.
    * Recherche : ``?search=react`` (titre, résumé, contenu, catégorie, tags).
    * Filtres : ``?category__slug=cloud``, ``?tags__slug=python``, ``?status=DRAFT``.
    * Tri : ``?ordering=-view_count``.
    """

    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"
    filterset_fields = ["category__slug", "tags__slug", "status", "author", "author__username"]
    search_fields = ["title", "summary", "content", "category__name", "tags__name"]
    ordering_fields = ["published_at", "view_count", "created_at"]

    def get_queryset(self):
        promote_scheduled()
        qs = (
            Article.objects.select_related("author", "category")
            .prefetch_related("tags", "article_sources__source")
            .annotate(
                comments_count=Count("comments", filter=Q(comments__is_hidden=False), distinct=True),
                likes_count=Count("likes", distinct=True),
            )
        )
        user = self.request.user
        if not (user.is_authenticated and user.is_admin):
            qs = qs.filter(status=Article.Status.PUBLISHED, published_at__lte=timezone.now())
        return qs

    def get_serializer_class(self):
        return ArticleListSerializer if self.action in ("list", "popular") else ArticleDetailSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        """Incrémente le compteur de vues à chaque consultation."""
        article = self.get_object()
        user = request.user
        if not (user.is_authenticated and user.is_admin):  # les vues de l'admin (édition) ne comptent pas
            Article.objects.filter(pk=article.pk).update(view_count=F("view_count") + 1)
            article.view_count += 1
        return Response(self.get_serializer(article).data)

    @action(detail=False, methods=["get"])
    def popular(self, request):
        """GET /api/articles/popular/ — les 6 articles les plus vus."""
        qs = self.get_queryset().order_by("-view_count")[:6]
        return Response(self.get_serializer(qs, many=True).data)

    def _toggle(self, model, request, slug):
        article = self.get_object()
        obj, created = model.objects.get_or_create(user=request.user, article=article)
        if not created:
            obj.delete()
        return Response({"active": created}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, slug=None):
        """POST /api/articles/{slug}/like/ — aime / n'aime plus."""
        return self._toggle(Like, request, slug)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def favorite(self, request, slug=None):
        """POST /api/articles/{slug}/favorite/ — ajoute / retire des favoris.

        Corps facultatif ``{"collection": <id>}`` : range le favori dans l'une
        des collections de l'utilisateur (le déplace s'il existe déjà).
        """
        article = self.get_object()
        collection = None
        if request.data.get("collection"):
            collection = request.user.collections.filter(pk=request.data["collection"]).first()
            if collection is None:
                return Response({"detail": "Collection introuvable."}, status=status.HTTP_404_NOT_FOUND)
        fav, created = Favorite.objects.get_or_create(
            user=request.user, article=article, defaults={"collection": collection}
        )
        if not created and collection is not None:      # déplacement vers une collection
            fav.collection = collection
            fav.save(update_fields=["collection", "updated_at"])
            return Response({"active": True})
        if not created:                                  # simple bascule : retrait
            fav.delete()
        return Response({"active": created})

    @action(detail=True, methods=["post", "delete"], parser_classes=[MultiPartParser])
    def cover(self, request, slug=None):
        """POST (multipart ``cover_image``) / DELETE /api/articles/{slug}/cover/ — image de couverture (admin)."""
        article = self.get_object()
        if request.method == "DELETE":
            article.cover_image.delete(save=True)
            return Response(status=status.HTTP_204_NO_CONTENT)
        ser = CoverSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        article.cover_image = ser.validated_data["cover_image"]
        article.save(update_fields=["cover_image", "updated_at"])
        return Response({"cover_image": request.build_absolute_uri(article.cover_image.url)})


class CoverSerializer(serializers.Serializer):
    cover_image = serializers.ImageField()

    def validate_cover_image(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Image trop lourde (5 Mo maximum).")
        return value
