"""Utilisateur personnalisé : connexion par e-mail et rôle."""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Manager où l'e-mail est l'identifiant de connexion."""

    use_in_migrations = True

    def _create(self, email, password, **extra):
        if not email:
            raise ValueError("L'e-mail est obligatoire.")
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", User.Role.ADMIN)
        return self._create(email, password, **extra)


class User(AbstractUser):
    """Utilisateur de la plateforme.

    Le « visiteur » n'a pas de compte : il correspond à une requête anonyme.
    """

    class Role(models.TextChoices):
        USER = "USER", "Utilisateur"
        ADMIN = "ADMIN", "Administrateur"

    email = models.EmailField("e-mail", unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True)
    website = models.URLField("site web", blank=True)  # affiché sur la page auteur (SEO : sameAs)
    # Catégories suivies : alimentera les notifications (V2) et les
    # recommandations (V3).
    followed_categories = models.ManyToManyField(
        "blog.Category", blank=True, related_name="followers"
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]
    objects = UserManager()

    @property
    def is_admin(self) -> bool:
        return self.role == self.Role.ADMIN or self.is_superuser

    def save(self, *args, **kwargs):
        # Un administrateur « métier » doit aussi accéder à l'admin Django
        # et aux vues protégées par IsAdminUser (basées sur is_staff).
        if self.role == self.Role.ADMIN:
            self.is_staff = True
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
