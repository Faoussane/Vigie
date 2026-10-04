"""Sitemap XML (``/sitemap.xml``) : aide Google à découvrir articles et auteurs."""
from urllib.parse import urlparse

from django.conf import settings
from django.contrib.sitemaps import Sitemap
from django.db.models import Max

from apps.accounts.models import User
from apps.blog.selectors import published_articles


class BaseSitemap(Sitemap):
    """Utilise ``SITE_URL`` (et non le framework « sites ») pour construire les URL absolues."""

    @property
    def protocol(self):
        return urlparse(settings.SITE_URL).scheme

    def get_domain(self, site=None):
        return urlparse(settings.SITE_URL).netloc


class StaticSitemap(BaseSitemap):
    changefreq, priority = "daily", 0.6

    def items(self):
        return ["/", "/articles", "/categories", "/sources", "/about"]

    def location(self, item):
        return item


class ArticleSitemap(BaseSitemap):
    changefreq, priority = "weekly", 0.8

    def items(self):
        return published_articles().order_by("-published_at")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f"/articles/{obj.slug}"


class AuthorSitemap(BaseSitemap):
    changefreq, priority = "weekly", 0.5

    def items(self):
        authors = {a.author_id for a in published_articles().only("author_id")}
        return User.objects.filter(pk__in=authors, is_active=True).annotate(last=Max("articles__updated_at"))

    def lastmod(self, obj):
        return obj.last

    def location(self, obj):
        return f"/authors/{obj.username}"


SITEMAPS = {"static": StaticSitemap, "articles": ArticleSitemap, "authors": AuthorSitemap}
