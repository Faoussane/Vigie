"""Enrichissement d'un élément de veille par l'IA (V3)."""
from django.utils import timezone

from apps.ai.services.text import classify
from apps.blog.models import Category


def analyze_item(item):
    """Classe ``item`` : catégorie suggérée, tags, technologies, importance.

    Les résultats sont des propositions stockées sur l'élément ; rien n'est
    publié automatiquement.
    """
    names = list(Category.objects.values_list("name", flat=True))
    result = classify(f"{item.title}\n\n{item.summary}", names)
    item.ai_data = result
    item.importance = result.get("importance")
    item.suggested_category = Category.objects.filter(name__iexact=result.get("category", "")).first()
    item.ai_analyzed_at = timezone.now()
    item.save()
    return item
