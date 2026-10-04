from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class Notification(TimeStampedModel):
    """Notification interne affichée dans la cloche de l'interface."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    message = models.CharField(max_length=300)
    link = models.CharField(max_length=300, blank=True)  # route front, ex. /articles?category__slug=ia
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
