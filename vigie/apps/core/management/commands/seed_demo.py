"""``python manage.py seed_demo`` — données de démonstration pour tester le front (DEBUG uniquement)."""
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.accounts.models import User
from apps.blog.models import Article, ArticleSource, Category, Tag
from apps.interactions.models import Comment
from apps.sources.models import Source
from apps.veille.models import VeilleItem

CATEGORIES = ["Intelligence artificielle", "Développement Web", "Cybersécurité", "Cloud", "DevOps", "Programmation", "Open Source"]
TAGS = ["Python", "Django", "React", "Docker", "AI", "Cybersecurity", "TypeScript", "Kubernetes"]

# (nom, url, type, flux RSS, catégorie, fréquence en minutes)
SOURCES = [
    ("Blog Django", "https://www.djangoproject.com/weblog/", "BLOG", "https://www.djangoproject.com/rss/weblog/", "Programmation", 60),
    ("React Blog", "https://react.dev/blog", "BLOG", "https://react.dev/rss.xml", "Développement Web", 120),
    ("GitHub Blog", "https://github.blog/", "BLOG", "https://github.blog/feed/", "Open Source", 60),
    ("Documentation MDN", "https://developer.mozilla.org/", "DOCS", "", "Développement Web", None),
]

ARTICLES = [
    ("Les nouveautés de l'IA générative", "Intelligence artificielle", ["AI", "Python"]),
    ("Django 5.2 : ce qui change", "Programmation", ["Django", "Python"]),
    ("React 19 et les Server Components", "Développement Web", ["React", "TypeScript"]),
    ("Sécuriser ses conteneurs Docker", "DevOps", ["Docker", "Cybersecurity"]),
    ("Kubernetes : premiers pas", "Cloud", ["Kubernetes", "Docker"]),
    ("Pourquoi contribuer à l'open source", "Open Source", ["Python"]),
]


class Command(BaseCommand):
    help = "Crée comptes, catégories, tags, sources, articles, commentaires et éléments de veille de démonstration."

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("seed_demo est réservé au développement (DEBUG=True).")

        admin = self._user("admin@vigie.test", "admin", "Admin12345!", User.Role.ADMIN)
        demo = self._user("demo@vigie.test", "demo", "Demo12345!", User.Role.USER)

        cats = {n: Category.objects.get_or_create(name=n)[0] for n in CATEGORIES}
        tags = {n: Tag.objects.get_or_create(name=n)[0] for n in TAGS}
        demo.followed_categories.set([cats["Intelligence artificielle"], cats["Développement Web"]])

        sources = {}
        for name, url, kind, feed, cat, freq in SOURCES:
            sources[name], _ = Source.objects.get_or_create(url=url, defaults={
                "name": name, "source_type": kind, "feed_url": feed, "category": cats[cat], "check_frequency_minutes": freq,
            })

        for i, (title, cat, tag_names) in enumerate(ARTICLES):
            article, created = Article.objects.get_or_create(title=title, defaults={
                "author": admin, "category": cats[cat], "status": Article.Status.PUBLISHED,
                "published_at": timezone.now() - timedelta(days=i),
                "summary": f"Résumé de l'article « {title} ».",
                "content": f"{title}\n\nPremier paragraphe de démonstration.\n\nDeuxième paragraphe avec des détails techniques.",
                "view_count": 50 - i * 7,
            })
            if created:
                article.tags.set([tags[t] for t in tag_names])
                ArticleSource.objects.create(article=article, source=sources["Blog Django"])
        # Un brouillon et un article planifié pour tester les statuts.
        Article.objects.get_or_create(title="Brouillon : tendances 2027", defaults={
            "author": admin, "category": cats["Cloud"], "content": "À compléter.", "status": Article.Status.DRAFT})
        Article.objects.get_or_create(title="Article planifié de démonstration", defaults={
            "author": admin, "category": cats["DevOps"], "content": "Publié automatiquement plus tard.",
            "status": Article.Status.SCHEDULED, "published_at": timezone.now() + timedelta(days=2)})

        first = Article.objects.filter(status=Article.Status.PUBLISHED).first()
        Comment.objects.get_or_create(article=first, author=demo, content="Très bon article, merci !")

        for i, (title, status, imp) in enumerate([
            ("OpenAI annonce un nouveau modèle", VeilleItem.Status.NEW, 4),
            ("OpenAI dévoile un nouveau modèle de langage", VeilleItem.Status.NEW, 4),
            ("Faille critique dans une bibliothèque populaire", VeilleItem.Status.TO_VERIFY, 5),
            ("Python 3.15 : première bêta", VeilleItem.Status.TO_ANALYZE, 3),
        ]):
            VeilleItem.objects.get_or_create(url=f"https://example.com/veille/{i}", defaults={
                "source": sources["GitHub Blog"], "title": title, "summary": title + ".", "status": status,
                "importance": imp, "published_at": timezone.now() - timedelta(hours=i)})

        self.stdout.write(self.style.SUCCESS("Données de démonstration prêtes."))
        self.stdout.write("  Admin : admin@vigie.test / Admin12345!\n  Utilisateur : demo@vigie.test / Demo12345!")

    @staticmethod
    def _user(email, username, password, role):
        user, _ = User.objects.get_or_create(email=email, defaults={"username": username, "role": role})
        user.role = role
        user.set_password(password)
        user.save()
        return user
