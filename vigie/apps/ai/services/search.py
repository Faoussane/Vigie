"""Recherche intelligente : question en langage naturel → articles pertinents."""
import re
from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from apps.blog.selectors import published_articles
from apps.core.text import tokenize

from .text import _ask, _wrap, parse_json

RECENT_WORDS = ("récemment", "recemment", "recent", "dernier", "latest", "cette semaine", "ce mois")


def interpret_query(question: str) -> dict:
    """Transforme la question en ``{"keywords": [...], "days": int | None}``."""
    raw = _ask(
        "Transforme cette question en critères de recherche. Réponds UNIQUEMENT en JSON : "
        '{"keywords": ["mots-clés essentiels, en anglais et français si utile"], '
        '"days": <nombre de jours si la question parle de récence, sinon null>}\n' + _wrap(question),
        max_tokens=200,
    )
    if raw:
        try:
            data = parse_json(raw)
            keywords = [str(k).lower()[:40] for k in data.get("keywords", [])][:8]
            days = data.get("days")
            if keywords:
                return {"keywords": keywords, "days": int(days) if days else None}
        except (ValueError, TypeError):
            pass
    lowered = question.lower()
    days = 30 if any(w in lowered for w in RECENT_WORDS) else None
    return {"keywords": list(dict.fromkeys(tokenize(question)))[:8], "days": days}


def smart_search(question: str, limit: int = 10):
    """Renvoie ``(critères, articles)`` classés par nombre de mots-clés trouvés."""
    criteria = interpret_query(question)
    keywords = criteria["keywords"]
    if not keywords:
        return criteria, []

    query = Q()
    for kw in keywords:
        query |= (
            Q(title__icontains=kw) | Q(summary__icontains=kw) | Q(content__icontains=kw)
            | Q(tags__name__icontains=kw) | Q(category__name__icontains=kw)
        )
    qs = published_articles().filter(query).distinct()
    if criteria["days"]:
        qs = qs.filter(published_at__gte=timezone.now() - timedelta(days=criteria["days"]))

    def score(article):
        haystack = " ".join(
            [article.title, article.summary, article.content, " ".join(t.name for t in article.tags.all())]
        ).lower()
        return sum(len(re.findall(re.escape(k), haystack)) + (3 if k in article.title.lower() else 0) for k in keywords)

    ranked = sorted(qs[:200], key=score, reverse=True)
    return criteria, ranked[:limit]
