"""Tendances : de simples **statistiques** sur les éléments collectés (pas une opinion)."""
from collections import Counter
from datetime import timedelta

from django.utils import timezone

from apps.veille.models import VeilleItem


def _top(counter: Counter, names: dict, limit: int):
    return [{"name": names[key], "count": n} for key, n in counter.most_common(limit)]


def weekly_trends(days: int = 7, limit: int = 5) -> dict:
    """Technologies, thèmes et catégories les plus fréquents sur ``days`` jours."""
    since = timezone.now() - timedelta(days=days)
    items = VeilleItem.objects.filter(created_at__gte=since).select_related("suggested_category")
    counters = {"technologies": Counter(), "themes": Counter(), "categories": Counter()}
    names: dict[str, dict] = {k: {} for k in counters}

    for item in items:
        data = item.ai_data or {}
        values = {
            "technologies": data.get("technologies", []),
            "themes": data.get("themes", []),
            "categories": [item.suggested_category.name] if item.suggested_category else [],
        }
        for kind, vals in values.items():
            for v in set(map(str, vals)):
                counters[kind][v.lower()] += 1
                names[kind].setdefault(v.lower(), v)

    return {"period_days": days, **{k: _top(counters[k], names[k], limit) for k in counters}}
