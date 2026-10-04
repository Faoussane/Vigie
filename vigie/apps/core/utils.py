"""Fonctions utilitaires partagées."""
from django.utils.text import slugify


def unique_slugify(instance, value, slug_field="slug"):
    """Génère un slug unique pour ``instance`` à partir de ``value``.

    Si le slug existe déjà, un suffixe numérique est ajouté
    (``react-19``, ``react-19-2``, ...).

    Args:
        instance: l'objet de modèle à enregistrer.
        value: le texte source (ex. le titre).
        slug_field: nom du champ slug.

    Returns:
        Un slug unique pour la table de ``instance``.
    """
    base = slugify(value)[:200] or "item"
    slug, n = base, 2
    model = instance.__class__
    while model.objects.exclude(pk=instance.pk).filter(**{slug_field: slug}).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug
