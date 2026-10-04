"""Application Celery (V2). Démarrage : ``celery -A config worker -l info`` et ``celery -A config beat -l info``."""
import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("vigie")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
