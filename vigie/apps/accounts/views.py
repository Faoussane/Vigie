"""Vues d'authentification : inscription, profil, mots de passe.

La connexion (JWT) est fournie par ``rest_framework_simplejwt``.
"""
from django.conf import settings
from django.contrib.auth import password_validation
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, mixins, parsers, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import (
    AdminUserSerializer,
    AuthorSerializer,
    AvatarSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — crée un compte utilisateur."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/ — profil de l'utilisateur connecté."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordChangeView(APIView):
    """POST /api/auth/password/change/ — modification du mot de passe."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = PasswordChangeSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        request.user.set_password(ser.validated_data["new_password"])
        request.user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetRequestView(APIView):
    """POST /api/auth/password/reset/ — envoie un lien de réinitialisation.

    Répond toujours 204 pour ne pas révéler quels e-mails existent.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = PasswordResetRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=ser.validated_data["email"], is_active=True).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            send_mail("Réinitialisation du mot de passe", f"Lien : {link}", None, [user.email])
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetConfirmView(APIView):
    """POST /api/auth/password/reset/confirm/ — applique le nouveau mot de passe."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = PasswordResetConfirmSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(ser.validated_data["uid"])))
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            user = None
        if user is None or not default_token_generator.check_token(user, ser.validated_data["token"]):
            return Response({"detail": "Lien invalide ou expiré."}, status=status.HTTP_400_BAD_REQUEST)
        password_validation.validate_password(ser.validated_data["new_password"], user)
        user.set_password(ser.validated_data["new_password"])
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AvatarView(APIView):
    """POST/DELETE /api/auth/me/avatar/ — envoie ou supprime la photo de profil."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser]

    def post(self, request):
        ser = AvatarSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        request.user.avatar = ser.validated_data["avatar"]
        request.user.save(update_fields=["avatar"])
        return Response(UserSerializer(request.user, context={"request": request}).data)

    def delete(self, request):
        request.user.avatar.delete(save=True)
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserAdminViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    """/api/users/ — liste et modification du rôle / de l'activation (admin)."""

    queryset = User.objects.order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]
    http_method_names = ["get", "patch", "head", "options"]
    filterset_fields = ["role", "is_active"]
    search_fields = ["username", "email"]


class AuthorViewSet(viewsets.ReadOnlyModelViewSet):
    """/api/authors/ — auteurs ayant au moins un article publié (public, utile au SEO)."""

    serializer_class = AuthorSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "username"
    lookup_value_regex = "[^/]+"

    def get_queryset(self):
        return (
            User.objects.filter(is_active=True)
            .annotate(articles_count=Count(
                "articles",
                filter=Q(articles__status="PUBLISHED", articles__published_at__lte=timezone.now()),
                distinct=True,
            ))
            .filter(articles_count__gt=0)
            .order_by("username")
        )
