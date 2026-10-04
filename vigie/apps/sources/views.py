from django.conf import settings
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsAdminOrReadOnly

from .models import Source
from .serializers import SourceSerializer


class SourceViewSet(viewsets.ModelViewSet):
    """CRUD des sources. Lecture publique, écriture admin."""

    queryset = Source.objects.all()
    serializer_class = SourceSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["source_type", "is_active"]
    search_fields = ["name", "url"]

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def collect(self, request, pk=None):
        """POST /api/sources/{id}/collect/ — lance la collecte RSS immédiatement (V2)."""
        from apps.veille.tasks import collect_source_task  # import tardif : évite un cycle

        source = self.get_object()
        if not source.feed_url:
            return Response({"detail": "Cette source n'a pas de flux RSS."}, status=status.HTTP_400_BAD_REQUEST)
        result = collect_source_task.delay(source.pk)
        if settings.CELERY_TASK_ALWAYS_EAGER:  # mode dev sans Redis : exécuté tout de suite
            return Response({"new_items": result.get()})
        return Response(status=status.HTTP_202_ACCEPTED)
