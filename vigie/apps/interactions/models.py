"""Interactions des utilisateurs : commentaires, likes, favoris."""
from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class Comment(TimeStampedModel):
    """Commentaire sur un article. Masquable par un administrateur."""

    article = models.ForeignKey("blog.Article", on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField(max_length=2000)
    is_hidden = models.BooleanField("masqué", default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.author} → {self.article}"


class CommentReport(TimeStampedModel):
    """Signalement d'un commentaire par un utilisateur."""

    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name="reports")
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reason = models.CharField(max_length=300)

    class Meta:
        unique_together = ("comment", "reporter")


class Like(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="likes")
    article = models.ForeignKey("blog.Article", on_delete=models.CASCADE, related_name="likes")

    class Meta:
        unique_together = ("user", "article")


class Collection(TimeStampedModel):
    """Dossier de favoris (V2) : « Intelligence artificielle », « React »..."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="collections")
    name = models.CharField(max_length=80)

    class Meta:
        unique_together = ("user", "name")
        ordering = ["name"]

    def __str__(self):
        return self.name


class Favorite(TimeStampedModel):
    """Article sauvegardé.

    Un favori peut être rangé dans une ``Collection`` (V2).
    """

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites")
    article = models.ForeignKey("blog.Article", on_delete=models.CASCADE, related_name="favorites")
    collection = models.ForeignKey(Collection, null=True, blank=True, on_delete=models.SET_NULL, related_name="favorites")

    class Meta:
        unique_together = ("user", "article")
        ordering = ["-created_at"]
