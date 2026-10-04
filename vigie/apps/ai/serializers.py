from rest_framework import serializers

from .services.text import ASSIST_PROMPTS


class TextSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=20000)


class ClassifySerializer(serializers.Serializer):
    text = serializers.CharField(max_length=20000)


class AssistSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=list(ASSIST_PROMPTS))
    title = serializers.CharField(max_length=200, allow_blank=True, default="")
    content = serializers.CharField(max_length=20000)
