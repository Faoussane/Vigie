"""Flux RSS public des derniers articles (``/feed.xml``)."""
from django.conf import settings
from django.contrib.syndication.views import Feed

from apps.blog.selectors import published_articles


class LatestArticlesFeed(Feed):
    description = settings.SITE_DESCRIPTION

    def title(self):
        return settings.SITE_NAME

    def link(self):
        return settings.SITE_URL

    def items(self):
        return list(published_articles().order_by("-published_at")[:20])

    def item_title(self, item):
        return item.title

    def item_description(self, item):
        return item.summary

    def item_link(self, item):
        return f"{settings.SITE_URL}/articles/{item.slug}"

    def item_pubdate(self, item):
        return item.published_at

    def item_updateddate(self, item):
        return item.updated_at

    def item_author_name(self, item):
        return item.author.username

    def item_categories(self, item):
        return [t.name for t in item.tags.all()]
