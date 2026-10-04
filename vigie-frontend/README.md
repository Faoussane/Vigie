# Vigie — frontend

React 19 + TypeScript + Vite + Tailwind CSS 4, React Router, Axios, React Hook Form + Zod, Zustand.

```bash
npm install
npm run dev      # http://localhost:5173 (API Django sur :8000, proxy Vite)
npm run build    # vérification TypeScript + build dans dist/
```

- Pages publiques : accueil, articles (filtres), article, auteur, catégories, sources, recherche IA, À propos.
- Compte : inscription, connexion, mot de passe oublié, profil, favoris + collections, notifications.
- Administration (`/admin`, rôle ADMIN) : dashboard, articles (éditeur complet + assistant IA), catégories, tags,
  sources (RSS), ma veille (Kanban), commentaires (modération), utilisateurs.
- SEO : composant `Seo` (balises + JSON-LD). Le HTML initial pour Google est injecté par Django (voir backend `docs/SEO.md`).
