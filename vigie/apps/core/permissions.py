"""Permissions DRF communes."""
from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """Lecture pour tous, écriture réservée aux administrateurs."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsOwnerOrAdmin(permissions.BasePermission):
    """Autorise le propriétaire de l'objet (champ ``author``) ou un administrateur."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_admin or obj.author_id == request.user.id
