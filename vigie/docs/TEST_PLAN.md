# Parcours de test depuis le front

Préparer : `python manage.py migrate && python manage.py seed_demo` (DEBUG=True), puis lancer front + back.
Comptes : **admin@vigie.test / Admin12345!** · **demo@vigie.test / Demo12345!**

| # | Scénario | Où |
|---|----------|----|
| 1 | Visiteur : accueil, recherche, filtre catégorie/tag, lecture, partage, sources, auteur | `/`, `/articles`, `/sources`, `/authors/admin` |
| 2 | Inscription, connexion, déconnexion, mot de passe oublié (lien dans la console Django) | `/register`, `/login`, `/forgot-password` |
| 3 | Like, favori + collection, commentaire, signalement, suppression de son commentaire | page article, `/favorites` |
| 4 | Profil : bio, site web, avatar, catégories suivies, changement de mot de passe | `/profile` |
| 5 | Admin : créer/modifier/supprimer article (brouillon, planifié, publié), image, tags, sources | `/admin/articles` |
| 6 | Admin : catégories, tags, sources (flux RSS, fréquence, « Collecter ») | `/admin/categories`, `/admin/tags`, `/admin/sources` |
| 7 | Admin : modérer commentaires (masquer, supprimer, signalés), gérer utilisateurs | `/admin/comments`, `/admin/users` |
| 8 | Veille : Kanban, analyse IA, création d'article depuis un élément, doublons | `/admin/veille` |
| 9 | IA : assistant de rédaction dans l'éditeur, recherche intelligente, tendances | `/admin/articles/new`, `/smart-search` |
| 10 | Notifications : suivre une catégorie (demo), collecter une source de cette catégorie (admin) | cloche 🔔 |
