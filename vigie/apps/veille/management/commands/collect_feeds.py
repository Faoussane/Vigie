"""``python manage.py collect_feeds`` — collecte synchrone (sans Celery), pratique en dev."""
from django.core.management.base import BaseCommand

from apps.sources.models import Source
from apps.veille.tasks import collect_source_task


class Command(BaseCommand):
    help = "Collecte immédiatement toutes les sources actives ayant un flux RSS."

    def handle(self, *args, **options):
        for source in Source.objects.filter(is_active=True).exclude(feed_url=""):
            count = collect_source_task(source.pk)  # appel direct, sans broker
            self.stdout.write(f"{source.name} : {count} nouveaux éléments")
