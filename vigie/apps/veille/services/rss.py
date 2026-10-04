"""Collecte des flux RSS/Atom avec ``feedparser``.

Sécurité : les URL de flux ne sont modifiables que par un administrateur
(``Source.feed_url``). En production, exécuter les workers dans un réseau
qui ne peut pas joindre les services internes (protection SSRF).
"""
import calendar
import logging
from datetime import datetime, timezone as dt_tz

import feedparser
from django.utils import timezone
from django.utils.html import strip_tags

from apps.veille.models import VeilleItem

logger = logging.getLogger(__name__)
DEFAULT_FREQUENCY_MINUTES = 60


def _entry_date(entry):
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if not parsed:
        return None
    return datetime.fromtimestamp(calendar.timegm(parsed), tz=dt_tz.utc)


def _entry_image(entry) -> str:
    for media in entry.get("media_content", []) or []:
        if media.get("url"):
            return media["url"][:1000]
    for link in entry.get("links", []):
        if link.get("type", "").startswith("image/"):
            return link.get("href", "")[:1000]
    return ""


def is_due(source) -> bool:
    """Vrai si la source est active, a un flux RSS et doit être revérifiée."""
    if not (source.is_active and source.feed_url):
        return False
    if source.last_checked_at is None:
        return True
    minutes = source.check_frequency_minutes or DEFAULT_FREQUENCY_MINUTES
    return (timezone.now() - source.last_checked_at).total_seconds() >= minutes * 60


def collect_source(source) -> list[VeilleItem]:
    """Lit le flux de ``source`` et crée les nouveaux éléments de veille.

    Les entrées déjà connues (même URL) sont ignorées.

    Returns:
        La liste des éléments nouvellement créés.

    Raises:
        ValueError: si le flux est illisible.
    """
    parsed = feedparser.parse(source.feed_url)
    if parsed.get("bozo") and not parsed.entries:
        raise ValueError(f"Flux illisible : {source.feed_url}")

    created_items = []
    for entry in parsed.entries:
        url = (entry.get("link") or "").strip()
        if not url:
            continue
        item, created = VeilleItem.objects.get_or_create(
            url=url[:1000],
            defaults={
                "source": source,
                "title": strip_tags(entry.get("title", "Sans titre"))[:300],
                "summary": strip_tags(entry.get("summary", ""))[:2000],
                "image_url": _entry_image(entry),
                "published_at": _entry_date(entry),
            },
        )
        if created:
            created_items.append(item)

    source.last_checked_at = timezone.now()
    source.save(update_fields=["last_checked_at"])
    logger.info("Source %s : %d nouveaux éléments", source.name, len(created_items))
    return created_items
