# Vigie — plateforme de veille technologique (V1 blog · V2 veille · V3 IA)

Backend Django REST Framework, Python 3.13, PostgreSQL.

## Démarrage

```bash
python3.13 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # puis adapter SECRET_KEY et DATABASE_URL
python manage.py makemigrations core accounts sources blog interactions veille notifications ai
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

- API : http://localhost:8000/api/
- Documentation interactive (Swagger) : http://localhost:8000/api/docs/
- Admin Django : http://localhost:8000/admin/

> Ordre des migrations : `accounts.User` référence `blog.Category`, et `blog` référence
> `accounts`/`sources` ; Django résout les dépendances automatiquement avec la commande ci-dessus.

## Structure

| App | Rôle |
| --- | --- |
| `core` | modèle abstrait, permissions, utilitaires |
| `accounts` | utilisateur (connexion par e-mail), JWT, profil, mots de passe |
| `blog` | articles, catégories, tags |
| `sources` | sources d'information |
| `interactions` | commentaires, likes, favoris, stats admin |

## Endpoints principaux

`/api/auth/{register,login,refresh,me}/` · `/api/articles/` (`?search=`, `?category__slug=`, `?tags__slug=`)
· `/api/articles/{slug}/{like,favorite}/` · `/api/articles/popular/` · `/api/categories/` · `/api/tags/`
· `/api/sources/` · `/api/comments/?article=<slug>` · `/api/favorites/` · `/api/admin/stats/`

## Documentation du code

- **API** : `drf-spectacular` génère le schéma OpenAPI (`/api/schema/`) et Swagger (`/api/docs/`).
- **Code** : docstrings (style Google) + Sphinx : `sphinx-quickstart docs` puis `sphinx-apidoc -o docs/source apps`.

## Préparation V2 / V3

V2/V3 implémentées : voir `docs/V2_V3.md` (Celery + Redis, `docker compose up`).
