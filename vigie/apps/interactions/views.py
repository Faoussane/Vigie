"""Commentaires, favoris et statistiques du dashboard."""
from django.db.models import Count, Sum
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.blog.models import Article
from apps.core.permissions import IsOwnerOrAdmin

from .models import Collection, Comment, CommentReport, Favorite
from .serializers import CollectionSerializer, CommentSerializer, FavoriteSerializer


class CommentViewSet(viewsets.ModelViewSet):
    """Commentaires. ``?article=<slug>`` pour ceux d'un article.

    Les commentaires masqués ne sont visibles que par les administrateurs.
    ``?reported=1`` (admin) liste les commentaires signalés.
    """

    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrAdmin]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        qs = Comment.objects.select_related("author", "article").annotate(reports_count=Count("reports", distinct=True))
        user = self.request.user
        is_admin = user.is_authenticated and user.is_admin
        if not is_admin:
            qs = qs.filter(is_hidden=False)
        if slug := self.request.query_params.get("article"):
            qs = qs.filter(article__slug=slug)
        if is_admin and self.request.query_params.get("reported"):
            qs = qs.filter(reports__isnull=False).distinct()
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def hide(self, request, pk=None):
        """POST /api/comments/{id}/hide/ — masque/démasque (admin)."""
        comment = self.get_object()
        comment.is_hidden = not comment.is_hidden
        comment.save(update_fields=["is_hidden"])
        return Response({"is_hidden": comment.is_hidden})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def report(self, request, pk=None):
        """POST /api/comments/{id}/report/ — signale un commentaire."""
        CommentReport.objects.get_or_create(
            comment=self.get_object(), reporter=request.user,
            defaults={"reason": request.data.get("reason", "")[:300]},
        )
        return Response(status=status.HTTP_201_CREATED)


class FavoriteViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/favorites/ — favoris de l'utilisateur connecté.

    L'ajout/retrait se fait via ``POST /api/articles/{slug}/favorite/``.
    """

    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["collection"]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related("article__author", "article__category")


class CollectionViewSet(viewsets.ModelViewSet):
    """Collections de favoris de l'utilisateur connecté (V2)."""

    serializer_class = CollectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Collection.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StatsView(APIView):
    """GET /api/admin/stats/ — chiffres du dashboard administrateur."""

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        return Response({
            "articles": Article.objects.count(),
            "users": User.objects.count(),
            "comments": Comment.objects.count(),
            "views": Article.objects.aggregate(total=Sum("view_count"))["total"] or 0,
            "recent_articles": list(
                Article.objects.order_by("-created_at").values("title", "slug", "view_count", "status")[:5]
            ),
        })
