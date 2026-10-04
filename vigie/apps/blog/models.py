"""Modèles du blog : catégories, tags, articles."""
from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel
from apps.core.utils import unique_slugify


class Category(TimeStampedModel):
    """Grande thématique (IA, Cloud, Cybersécurité...)."""

    name = models.CharField("nom", max_length=100, unique=True)
    slug = models.SlugField(max_length=110, unique=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "catégories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Tag(TimeStampedModel):
    """Mot-clé libre (#Python, #Docker...)."""

    name = models.CharField("nom", max_length=60, unique=True)
    slug = models.SlugField(max_length=70, unique=True, blank=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"#{self.name}"


class Article(TimeStampedModel):
    """Article de veille.

    Préparation des versions futures :
      * V2 : un article pourra être créé depuis un élément de veille collecté
        (relation à ajouter dans ``apps.veille``, sans modifier ce modèle).
      * V3 : le résumé, la catégorie et les tags pourront être proposés par
        l'IA ; l'auteur valide toujours (le champ ``status`` le garantit).
    """

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Brouillon"
        SCHEDULED = "SCHEDULED", "Planifié"
        PUBLISHED = "PUBLISHED", "Publié"
        ARCHIVED = "ARCHIVED", "Archivé"

    title = models.CharField("titre", max_length=200)
    slug = models.SlugField(max_length=210, unique=True, blank=True)
    cover_image = models.ImageField(upload_to="articles/", blank=True)
    summary = models.TextField("résumé", blank=True)
    content = models.TextField("contenu")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="articles")
    category = models.ForeignKey(Category, null=True, on_delete=models.SET_NULL, related_name="articles")
    tags = models.ManyToManyField(Tag, blank=True, related_name="articles")
    sources = models.ManyToManyField("sources.Source", through="ArticleSource", related_name="articles", blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT, db_index=True)
    published_at = models.DateTimeField("publié le", null=True, blank=True, db_index=True)
    view_count = models.PositiveIntegerField("vues", default=0)

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.title)
        # Date de publication posée automatiquement à la première publication.
        if self.status == self.Status.PUBLISHED and self.published_at is None:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class ArticleSource(models.Model):
    """Lien article ↔ source, avec la date de consultation de la source."""

    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name="article_sources")
    source = models.ForeignKey("sources.Source", on_delete=models.CASCADE, related_name="article_links")
    consulted_at = models.DateField("date de consultation", default=timezone.localdate)

    class Meta:
        unique_together = ("article", "source")
