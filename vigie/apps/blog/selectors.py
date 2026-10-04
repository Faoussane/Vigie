"""Requêtes réutilisables sur les articles."""
from django.db.models import Count, Q
from django.utils import timezone

from .models import Article


def promote_scheduled() -> None:
    """Passe en PUBLIÉ les articles PLANIFIÉS dont la date est atteinte.

    Appelée à la lecture : la publication planifiée fonctionne sans Celery.
    """
    Article.objects.filter(status=Article.Status.SCHEDULED, published_at__lte=timezone.now()).update(
        status=Article.Status.PUBLISHED
    )


def published_articles():
    """Articles publiés (date passée), annotés des compteurs attendus par les serializers."""
    promote_scheduled()
    return (
        Article.objects.select_related("author", "category")
        .prefetch_related("tags", "article_sources__source")
        .annotate(
            comments_count=Count("comments", filter=Q(comments__is_hidden=False), distinct=True),
            likes_count=Count("likes", distinct=True),
        )
        .filter(status=Article.Status.PUBLISHED, published_at__lte=timezone.now())
    )
