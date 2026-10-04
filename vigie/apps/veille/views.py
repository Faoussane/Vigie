"""API « Ma veille » : Kanban, analyse IA, création d'article, statistiques."""
from django.db.models import Count
from django.db.models.functions import Coalesce
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.blog.models import Article, ArticleSource, Tag
from apps.blog.selectors import published_articles
from apps.sources.models import Source

from .models import VeilleItem
from .serializers import VeilleItemSerializer
from .services.analysis import analyze_item
from .services.duplicates import detect_duplicates


class VeilleItemViewSet(viewsets.ModelViewSet):
    """Éléments de veille (administrateurs). Pas de création manuelle : la collecte s'en charge.

    ``PATCH {"status": "TO_ANALYZE"}`` déplace une carte dans le Kanban.
    """

    queryset = VeilleItem.objects.select_related("source", "suggested_category", "article")
    serializer_class = VeilleItemSerializer
    permission_classes = [permissions.IsAdminUser]
    http_method_names = ["get", "patch", "delete", "post", "head", "options"]
    filterset_fields = ["status", "source", "suggested_category"]
    search_fields = ["title", "summary"]
    ordering_fields = ["published_at", "created_at", "importance"]

    def create(self, request, *args, **kwargs):
        return Response({"detail": "Les éléments sont créés par la collecte."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=False, methods=["get"])
    def counts(self, request):
        """GET /api/veille/items/counts/ — nombre d'éléments par statut."""
        data = {s: 0 for s in VeilleItem.Status.values}
        for row in VeilleItem.objects.values("status").annotate(n=Count("id")):
            data[row["status"]] = row["n"]
        return Response(data)

    @action(detail=True, methods=["post"])
    def analyze(self, request, pk=None):
        """POST …/{id}/analyze/ — (re)lance l'analyse IA et la détection de doublons."""
        item = analyze_item(self.get_object())
        detect_duplicates(item)
        return Response(self.get_serializer(item).data)

    @action(detail=True, methods=["post"])
    def create_article(self, request, pk=None):
        """POST …/{id}/create_article/ — crée un **brouillon** d'article depuis l'élément."""
        item = self.get_object()
        if item.article_id:
            return Response({"detail": "Un article existe déjà."}, status=status.HTTP_400_BAD_REQUEST)
        ai = item.ai_data or {}
        article = Article.objects.create(
            title=item.title[:200],
            summary=item.summary,
            content=f"{item.summary}\n\nSource : {item.url}",
            author=request.user,
            category=item.suggested_category or item.source.category,
            status=Article.Status.DRAFT,
        )
        for name in ai.get("tags", [])[:5]:
            tag, _ = Tag.objects.get_or_create(name=name[:60])
            article.tags.add(tag)
        ArticleSource.objects.create(article=article, source=item.source)
        item.article, item.status = article, VeilleItem.Status.TO_WRITE
        item.save(update_fields=["article", "status", "updated_at"])
        return Response({"article_slug": article.slug}, status=status.HTTP_201_CREATED)


class VeilleStatsView(APIView):
    """GET /api/veille/stats/ — tableau de bord de veille (admin)."""

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        by_category = (
            VeilleItem.objects.annotate(cat=Coalesce("suggested_category__name", "source__category__name"))
            .exclude(cat__isnull=True)
            .values("cat")
            .annotate(n=Count("id"))
            .order_by("-n")[:6]
        )
        by_status = {st: 0 for st in VeilleItem.Status.values}
        for row in VeilleItem.objects.values("status").annotate(n=Count("id")):
            by_status[row["status"]] = row["n"]
        evolution = [{"category": r["cat"], "count": r["n"]} for r in by_category]
        return Response({
            "sources_monitored": Source.objects.filter(is_active=True).exclude(feed_url="").count(),
            "items_collected": VeilleItem.objects.count(),
            "articles_published": published_articles().count(),
            "dominant_category": evolution[0]["category"] if evolution else None,
            "evolution": evolution,
            "by_status": by_status,
        })
