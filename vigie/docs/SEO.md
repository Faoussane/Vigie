# Référencement (Google)

## Ce qui est en place
| Élément | Où | Rôle |
| --- | --- | --- |
| `/sitemap.xml` | `apps/seo/sitemaps.py` | liste articles, auteurs et pages principales |
| `/robots.txt` | `apps/seo/views.py` | autorise le site, bloque `/api`, `/admin`, comptes ; indique le sitemap |
| `/feed.xml` | `apps/seo/feeds.py` | flux RSS des 20 derniers articles |
| Métadonnées serveur | `/`, `/articles/<slug>`, `/authors/<nom>` | `<title>`, description, canonical, Open Graph, Twitter Card, JSON-LD |
| Contenu HTML initial | idem | texte lisible par les robots avant l'exécution de React |
| Pages auteur publiques | `/authors/<nom>` + `/api/authors/` | JSON-LD `ProfilePage`/`Person` ; l'e-mail n'est jamais exposé |
| Données structurées article | JSON-LD `BlogPosting` | titre, dates, auteur, image, mots-clés, catégorie |

Les articles BROUILLON / PLANIFIÉ / ARCHIVÉ ne sont **ni dans le sitemap ni accessibles** (404 + `noindex`).

## Mise en production
1. `SITE_URL=https://votre-domaine.tld` et `FRONTEND_INDEX_HTML=/chemin/vigie-frontend/dist/index.html` dans `.env`.
2. `npm run build` dans le front ; servir `dist/assets/` en statique.
3. Le reverse proxy envoie à Django : `/`, `/articles/*`, `/authors/*`, `/sitemap.xml`, `/robots.txt`, `/feed.xml`,
   `/api/*`, `/media/*`, et **toute autre page non-fichier** (repli SPA). Exemple nginx :

```nginx
location /assets/ { alias /srv/vigie-frontend/dist/assets/; expires 1y; }
location /media/  { alias /srv/vigie/media/; }
location / { proxy_pass http://127.0.0.1:8000; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; }
```
4. HTTPS obligatoire (Google privilégie https). Ajouter `SECURE_PROXY_SSL_HEADER` si derrière un proxy.
5. Google Search Console : ajouter la propriété, soumettre `https://votre-domaine.tld/sitemap.xml`,
   puis « Inspection de l'URL » sur un article pour vérifier le rendu et les données structurées
   (test aussi avec l'outil « Résultats enrichis »).

## Tester en local (même origine)
```bash
cd vigie-frontend && npm run build
cd ../vigie && python manage.py runserver
# http://localhost:8000/articles/<slug>  → clic droit « Afficher le code source » : balises + JSON-LD présentes
# http://localhost:8000/sitemap.xml , /robots.txt , /feed.xml
```

## Bonnes pratiques éditoriales (hors code)
Un titre unique (< 60 car.), un résumé de 120–160 car. (devient la meta description), une image de couverture,
des sources citées, des tags pertinents, et renseigner la bio/site web de chaque auteur.
