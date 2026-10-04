"""Modèles abstraits réutilisés par toutes les applications."""
from django.db import models


class TimeStampedModel(models.Model):
    """Ajoute les dates de création et de modification à un modèle."""

    created_at = models.DateTimeField("créé le", auto_now_add=True)
    updated_at = models.DateTimeField("modifié le", auto_now=True)

    class Meta:
        abstract = True
