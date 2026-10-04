"""Éléments de veille collectés (V2) et enrichis par l'IA (V3)."""
from django.db import models

from apps.core.models import TimeStampedModel


class VeilleItem(TimeStampedModel):
    """Une information détectée dans une source (ex. une entrée de flux RSS).

    Cycle de vie (workflow de veille, déplacement libre dans le Kanban) ::

        NEW → TO_VERIFY → TO_ANALYZE → TO_WRITE → PUBLISHED   (ou IGNORED)

    Les champs « V3 » (``ai_data``, ``importance``, ``suggested_category``,
    ``duplicate_of``) ne sont que des **propositions** : l'administrateur
    garde la décision finale.
    """

    class Status(models.TextChoices):
        NEW = "NEW", "Nouveau"
        TO_VERIFY = "TO_VERIFY", "À vérifier"
        TO_ANALYZE = "TO_ANALYZE", "À analyser"
        TO_WRITE = "TO_WRITE", "À rédiger"
        PUBLISHED = "PUBLISHED", "Publié"
        IGNORED = "IGNORED", "Ignoré"

    source = models.ForeignKey("sources.Source", on_delete=models.CASCADE, related_name="items")
    title = models.CharField("titre", max_length=300)
    url = models.URLField("URL", max_length=1000, unique=True)  # sert aussi à dédoublonner la collecte
    summary = models.TextField("résumé", blank=True)
    image_url = models.URLField(max_length=1000, blank=True)
    published_at = models.DateTimeField("date de publication source", null=True, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.NEW, db_index=True)
    notes = models.TextField("notes de l'admin", blank=True)
    article = models.ForeignKey(
        "blog.Article", null=True, blank=True, on_delete=models.SET_NULL, related_name="veille_items"
    )

    # --- V3 : enrichissement IA ---
    ai_data = models.JSONField(default=dict, blank=True)  # tags, technologies, themes, résumé
    ai_analyzed_at = models.DateTimeField(null=True, blank=True)
    importance = models.PositiveSmallIntegerField(null=True, blank=True)  # 1 à 5
    suggested_category = models.ForeignKey(
        "blog.Category", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    duplicate_of = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="duplicates"
    )

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def __str__(self):
        return self.title
