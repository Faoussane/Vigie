"""Tâches Celery de la veille (V2) — planifiées par Celery Beat (voir settings)."""
import logging

from celery import shared_task

from apps.notifications.services import notify_new_items
from apps.sources.models import Source

from .models import VeilleItem
from .services.analysis import analyze_item
from .services.duplicates import detect_duplicates
from .services.rss import collect_source, is_due

logger = logging.getLogger(__name__)


@shared_task
def collect_source_task(source_id: int) -> int:
    """Collecte une source, notifie les abonnés puis lance l'analyse IA."""
    source = Source.objects.get(pk=source_id)
    try:
        new_items = collect_source(source)
    except ValueError:
        logger.warning("Flux illisible pour %s", source.name)
        return 0
    notify_new_items(source, new_items)
    for item in new_items:
        analyze_item_task.delay(item.pk)
    return len(new_items)


@shared_task
def collect_due_sources() -> int:
    """Lance la collecte de toutes les sources dont l'échéance est atteinte."""
    due = [s for s in Source.objects.filter(is_active=True).exclude(feed_url="") if is_due(s)]
    for source in due:
        collect_source_task.delay(source.pk)
    return len(due)


@shared_task(rate_limit="10/m")  # respecte les quotas du tier gratuit Gemini (par worker)
def analyze_item_task(item_id: int) -> None:
    """Analyse IA d'un élément, puis détection de doublons."""
    item = VeilleItem.objects.get(pk=item_id)
    analyze_item(item)
    detect_duplicates(item)


@shared_task
def analyze_new_items(limit: int = 50) -> int:
    """Rattrapage : analyse les éléments jamais analysés."""
    ids = list(VeilleItem.objects.filter(ai_analyzed_at__isnull=True).values_list("pk", flat=True)[:limit])
    for pk in ids:
        analyze_item_task.delay(pk)
    return len(ids)
