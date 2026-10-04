"""Serializers d'authentification et de profil."""
from django.contrib.auth import password_validation
from rest_framework import serializers

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    """Inscription : nom d'utilisateur, e-mail, mot de passe + confirmation."""

    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "password_confirm")

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Les mots de passe diffèrent."})
        password_validation.validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    """Profil utilisateur (lecture/modification de son propre profil)."""

    class Meta:
        model = User
        fields = ("id", "username", "email", "bio", "website", "avatar", "role", "followed_categories", "date_joined")
        read_only_fields = ("id", "email", "role", "avatar", "date_joined")


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value

    def validate_new_password(self, value):
        password_validation.validate_password(value, self.context["request"].user)
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)


class AdminUserSerializer(serializers.ModelSerializer):
    """Gestion des utilisateurs par un admin : seuls ``role`` et ``is_active`` changent."""

    class Meta:
        model = User
        fields = ("id", "username", "email", "role", "is_active", "date_joined")
        read_only_fields = ("id", "username", "email", "date_joined")

    def validate(self, attrs):
        request = self.context["request"]
        if self.instance and self.instance.pk == request.user.pk:
            if attrs.get("is_active") is False or attrs.get("role", User.Role.ADMIN) != User.Role.ADMIN:
                raise serializers.ValidationError("Vous ne pouvez pas vous retirer vos propres droits ni vous désactiver.")
        return attrs


class AuthorSerializer(serializers.ModelSerializer):
    """Profil public d'un auteur (jamais l'e-mail)."""

    articles_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ("username", "bio", "avatar", "website", "date_joined", "articles_count")


class AvatarSerializer(serializers.Serializer):
    avatar = serializers.ImageField()

    def validate_avatar(self, value):
        if value.size > 2 * 1024 * 1024:
            raise serializers.ValidationError("Image trop lourde (2 Mo maximum).")
        return value
