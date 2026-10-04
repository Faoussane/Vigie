"""Routage racine.

* ``/api/...``        API REST
* ``/django-admin/``  administration Django (``/admin/...`` est réservé à l'admin du front)
* ``/sitemap.xml``, ``/robots.txt``, ``/feed.xml``, ``/articles/<slug>``, ``/authors/<nom>``, ``/``
                      pages SEO servies par ``apps.seo`` (métadonnées pour Google)
"""
from pathlib import Path

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.blog.urls")),
    path("api/", include("apps.sources.urls")),
    path("api/", include("apps.interactions.urls")),
    path("api/", include("apps.veille.urls")),
    path("api/", include("apps.notifications.urls")),
    path("api/", include("apps.ai.urls")),
    # Documentation interactive (drf-spectacular)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# En développement, Django sert aussi les fichiers compilés du front (/assets/...)
# pour tester le rendu SEO en « même origine » sur http://localhost:8000.
urlpatterns += static("/assets/", document_root=Path(settings.FRONTEND_INDEX_HTML).parent / "assets")

# Pages SEO + repli SPA : doit rester en dernier.
urlpatterns += [path("", include("apps.seo.urls"))]
