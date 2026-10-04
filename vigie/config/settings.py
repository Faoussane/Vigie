"""
Configuration Django du projet Vigie.

Toutes les valeurs sensibles viennent des variables d'environnement
(fichier ``.env``, voir ``.env.example``).

Doc : https://docs.djangoproject.com/en/5.2/ref/settings/
"""
from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost"])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sitemaps",
    # Bibliothèques tierces
    "rest_framework",
    "django_filters",
    "corsheaders",
    "drf_spectacular",
    # Applications du projet
    "apps.core",
    "apps.accounts",
    "apps.sources",
    "apps.blog",
    "apps.interactions",
    "apps.veille",          # V2 : collecte RSS, workflow, Kanban
    "apps.notifications",   # V2 : notifications
    "apps.ai",              # V3 : assistant IA
    "apps.seo",             # sitemap, robots.txt, flux RSS, métadonnées pour Google
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {"default": env.db("DATABASE_URL")}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Porto-Novo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# --- Django REST Framework -------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.FlexiblePagination",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    # Limitation des requêtes (sécurité)
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {"anon": "100/hour", "user": "1000/hour"},
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Vigie API",
    "DESCRIPTION": "API de la plateforme de veille technologique Vigie.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173")
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"  # dev uniquement

# --- V2 : Celery / Redis -----------------------------------------------------
CELERY_BROKER_URL = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = CELERY_BROKER_URL
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_EAGER", default=False)  # True : sans Redis (dev/tests)
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULE = {
    # Vérifie toutes les 5 min quelles sources sont « dues » (selon leur fréquence).
    "collect-due-sources": {"task": "apps.veille.tasks.collect_due_sources", "schedule": 300.0},
    # Rattrape les éléments non analysés par l'IA.
    "analyze-new-items": {"task": "apps.veille.tasks.analyze_new_items", "schedule": 600.0},
}

# --- V3 : IA -------------------------------------------------------------------
AI_PROVIDER = env("AI_PROVIDER", default="local")  # "local" (heuristiques) ou "gemini"
GEMINI_API_KEY = env("GEMINI_API_KEY", default="")
# Modèle couvert par le tier gratuit (cf. ai.google.dev/gemini-api/docs/rate-limits).
GEMINI_MODEL = env("GEMINI_MODEL", default="gemini-2.5-flash")
GEMINI_THINKING_BUDGET = env.int("GEMINI_THINKING_BUDGET", default=0)  # 0 = pas de « réflexion »

# --- SEO ----------------------------------------------------------------------
SITE_NAME = "Vigie"
SITE_URL = env("SITE_URL", default="http://localhost:8000").rstrip("/")  # URL publique du site
SITE_DESCRIPTION = "Veille technologique : IA, web, cybersécurité, cloud, DevOps — analyses sourcées."
# index.html produit par « npm run build » : Django y injecte les métadonnées SEO.
FRONTEND_INDEX_HTML = env("FRONTEND_INDEX_HTML", default=str(BASE_DIR.parent / "vigie-frontend" / "dist" / "index.html"))
