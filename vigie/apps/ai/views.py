"""Endpoints IA (V3)."""
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.blog.models import Category
from apps.blog.serializers import ArticleListSerializer

from .serializers import AssistSerializer, ClassifySerializer, TextSerializer
from .services import recommendations, search, text, trends
from .services.provider import AIUnavailable


class SummarizeView(APIView):
    """POST /api/ai/summarize/ — résume un texte (admin)."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        ser = TextSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        return Response({"summary": text.summarize(ser.validated_data["text"])})


class ExtractView(APIView):
    """POST /api/ai/extract/ — technologies, thèmes et mots-clés (admin)."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        ser = TextSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        return Response(text.extract_info(ser.validated_data["text"]))


class ClassifyView(APIView):
    """POST /api/ai/classify/ — catégorie, tags, importance (admin)."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        ser = ClassifySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        names = list(Category.objects.values_list("name", flat=True))
        return Response(text.classify(ser.validated_data["text"], names))


class AssistView(APIView):
    """POST /api/ai/assist/ — assistant de rédaction (admin). L'auteur valide toujours."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        ser = AssistSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            result = text.assist(**ser.validated_data)
        except AIUnavailable as exc:
            return Response({"detail": str(exc)}, status=503)
        return Response({"action": ser.validated_data["action"], "result": result})


class SmartSearchView(APIView):
    """GET /api/ai/search/?q=… — recherche en langage naturel (public)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        question = request.query_params.get("q", "").strip()[:300]
        if not question:
            return Response({"detail": "Paramètre q requis."}, status=400)
        criteria, articles = search.smart_search(question)
        return Response({
            "interpreted": criteria,
            "results": ArticleListSerializer(articles, many=True, context={"request": request}).data,
        })


class RecommendationsView(APIView):
    """GET /api/ai/recommendations/ — « Vous pourriez aimer » (connecté)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        articles = recommendations.recommend_for(request.user)
        return Response(ArticleListSerializer(articles, many=True, context={"request": request}).data)


class TrendsView(APIView):
    """GET /api/ai/trends/?days=7 — tendances calculées sur les données collectées (public)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            days = max(1, min(90, int(request.query_params.get("days", 7))))
        except ValueError:
            days = 7
        return Response(trends.weekly_trends(days))
