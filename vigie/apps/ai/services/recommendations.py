"""Recommandations personnalisées, sans IA externe (scoring transparent)."""
from apps.blog.selectors import published_articles
from apps.interactions.models import Favorite, Like


def recommend_for(user, limit: int = 6):
    """Articles à suggérer à ``user``.

    Score = +2 si la catégorie est suivie, +1 par tag en commun avec les
    articles que l'utilisateur a aimés ou sauvegardés. Les articles déjà
    aimés/sauvegardés sont exclus.
    """
    followed = set(user.followed_categories.values_list("id", flat=True))
    seen = set(Like.objects.filter(user=user).values_list("article_id", flat=True)) | set(
        Favorite.objects.filter(user=user).values_list("article_id", flat=True)
    )
    liked_tags = set()
    for article in published_articles().filter(pk__in=seen):
        liked_tags |= {t.id for t in article.tags.all()}

    scored = []
    for article in published_articles().exclude(pk__in=seen)[:300]:
        score = (2 if article.category_id in followed else 0) + len({t.id for t in article.tags.all()} & liked_tags)
        if score:
            scored.append((score, article))
    scored.sort(key=lambda pair: (pair[0], pair[1].published_at), reverse=True)
    return [a for _, a in scored[:limit]]
