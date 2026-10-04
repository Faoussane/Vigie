"""Détection de doublons : plusieurs informations sur le même événement."""
from datetime import timedelta

from apps.core.text import tokenize
from apps.veille.models import VeilleItem


def _keywords(item) -> set[str]:
    words = set(tokenize(item.title))
    words |= {t.lower() for t in (item.ai_data or {}).get("technologies", [])}
    return words


def detect_duplicates(item, days: int = 7, threshold: float = 0.4):
    """Marque ``item`` comme doublon d'un élément plus ancien s'il y ressemble.

    La similarité est un indice de Jaccard sur les mots-clés du titre et les
    technologies détectées, dans une fenêtre de ``days`` jours. C'est un
    **signalement** : l'administrateur peut le corriger.

    Returns:
        L'élément original trouvé, ou ``None``.
    """
    base = _keywords(item)
    if not base:
        return None
    candidates = VeilleItem.objects.filter(
        created_at__gte=item.created_at - timedelta(days=days),
        created_at__lt=item.created_at,
        duplicate_of__isnull=True,
    ).exclude(pk=item.pk)

    best, best_score = None, 0.0
    for other in candidates:
        other_kw = _keywords(other)
        union = base | other_kw
        score = len(base & other_kw) / len(union) if union else 0.0
        if score > best_score:
            best, best_score = other, score

    if best and best_score >= threshold:
        item.duplicate_of = best
        item.save(update_fields=["duplicate_of", "updated_at"])
        return best
    return None
