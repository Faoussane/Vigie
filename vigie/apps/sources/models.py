"""Sources d'information (sites, blogs, dépôts GitHub, etc.)."""
from django.db import models

from apps.core.models import TimeStampedModel


class Source(TimeStampedModel):
    """Une source d'information référençable par les articles.

    V1 : seuls ``name``, ``url`` et ``source_type`` sont utilisés.
    Les champs « V2 » sont déjà présents (et facultatifs) pour éviter une
    refonte du modèle plus tard : la collecte RSS les lira.
    """

    class SourceType(models.TextChoices):
        WEBSITE = "WEBSITE", "Site web"
        BLOG = "BLOG", "Blog"
        DOCS = "DOCS", "Documentation"
        GITHUB = "GITHUB", "GitHub"
        YOUTUBE = "YOUTUBE", "YouTube"
        PODCAST = "PODCAST", "Podcast"
        SOCIAL = "SOCIAL", "Réseau social"
        PAPER = "PAPER", "Article scientifique"

    name = models.CharField("nom", max_length=150)
    url = models.URLField("URL", unique=True)
    source_type = models.CharField("type", max_length=10, choices=SourceType.choices, default=SourceType.WEBSITE)

    # --- Champs préparés pour la V2 (collecte automatique) ---
    category = models.ForeignKey(
        "blog.Category", null=True, blank=True, on_delete=models.SET_NULL, related_name="sources"
    )
    feed_url = models.URLField("flux RSS", blank=True)
    check_frequency_minutes = models.PositiveIntegerField("fréquence de vérification (min)", null=True, blank=True)
    is_active = models.BooleanField("active", default=True)
    last_checked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
