# Points d'extension prévus

## V2 — Veille (RSS, workflow, Celery/Redis)
- `Source` possède déjà `feed_url`, `check_frequency_minutes`, `is_active`, `last_checked_at`.
- Nouvelle app `apps.veille` : modèle `VeilleItem` (statuts NOUVEAU → … → PUBLIÉ) avec une
  relation optionnelle vers `Article` ; aucune modification du modèle `Article` nécessaire.
- Tâches Celery (`apps/veille/tasks.py`) : lecture des flux avec `feedparser`.
- `User.followed_categories` sert déjà aux notifications ; app `apps.notifications` à ajouter.
- `Favorite` : ajouter un modèle `Collection` + clé étrangère optionnelle.

## V3 — IA
- App `apps.ai` avec une couche « service » (`summarize()`, `classify()`, `suggest_tags()`)
  appelée par des tâches Celery ; les résultats sont des **propositions** que l'administrateur valide
  (l'article reste en `DRAFT` tant qu'il n'est pas publié manuellement).
- Recommandations : basées sur `followed_categories`, `Like` et `Favorite`.
