from django.contrib.sitemaps.views import sitemap
from django.urls import path, re_path

from . import views
from .feeds import LatestArticlesFeed
from .sitemaps import SITEMAPS

urlpatterns = [
    path("sitemap.xml", sitemap, {"sitemaps": SITEMAPS}, name="django.contrib.sitemaps.views.sitemap"),
    path("robots.txt", views.robots),
    path("feed.xml", LatestArticlesFeed()),
    path("articles/<slug:slug>", views.article_page),
    path("authors/<str:username>", views.author_page),
    path("", views.home_page),
    # Repli SPA pour les autres pages du front (jamais /api, /media, /assets, /django-admin).
    re_path(r"^(?!api/|media/|assets/|static/|django-admin/)(?P<path>.*)$", views.spa_fallback),
]
