from .models import Notification


def notify_new_items(source, items) -> int:
    """Notifie les utilisateurs qui suivent la catégorie de ``source``.

    Exemple : « 5 nouvelles publications sur React ont été détectées ».

    Returns:
        Le nombre de notifications créées.
    """
    if not items or source.category is None:
        return 0
    category = source.category
    message = f"{len(items)} nouvelle(s) publication(s) sur {category.name} détectée(s) ({source.name})."
    notifications = [
        Notification(user=user, message=message, link=f"/articles?category__slug={category.slug}")
        for user in category.followers.filter(is_active=True)
    ]
    Notification.objects.bulk_create(notifications)
    return len(notifications)
