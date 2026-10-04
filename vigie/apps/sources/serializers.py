from rest_framework import serializers

from .models import Source


class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Source
        fields = (
            "id", "name", "url", "source_type",
            # champs V2, facultatifs
            "category", "feed_url", "check_frequency_minutes", "is_active",
        )
