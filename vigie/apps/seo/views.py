"""Pages « SEO » : injection des métadonnées dans l'``index.html`` du front.

Problème : une application React ne renvoie qu'une page vide au premier
chargement ; les robots voient mal le contenu et les balises. Ici, pour les
URL importantes (accueil, article, auteur), Django renvoie l'``index.html``
compilé **enrichi** de :

* ``<title>``, description, URL canonique, Open Graph, Twitter Card ;
* données structurées JSON-LD (schema.org ``BlogPosting`` / ``ProfilePage`` / ``WebSite``) ;
* un contenu HTML sémantique dans ``<div id="root">`` (React le remplace au chargement).

Tout texte provenant de la base est échappé (HTML, JSON-LD).
"""
import json
import re
from pathlib import Path

from django.conf import settings
from django.http import HttpResponse
from django.utils.html import escape, strip_tags

from apps.accounts.models import User
from apps.blog.selectors import published_articles


# ----------------------------- utilitaires -----------------------------
def _abs(url: str) -> str:
    return url if url.startswith("http") else f"{settings.SITE_URL}{url}"


def _short(text: str, n: int = 160) -> str:
    text = re.sub(r"\s+", " ", strip_tags(text or "")).strip()
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


def _ld(data: dict) -> str:
    payload = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c")  # empêche de fermer le <script>
    return f'<script type="application/ld+json">{payload}</script>'


def _media(request, field) -> str:
    return request.build_absolute_uri(field.url) if field else ""


def render_shell(*, title, description, path, og_type="website", image="", head_extra="", body="",
                 status=200, noindex=False, home=False):
    """Renvoie l'index.html du front avec les métadonnées SEO injectées."""
    try:
        html = Path(settings.FRONTEND_INDEX_HTML).read_text(encoding="utf-8")
    except OSError:
        return HttpResponse("Front non compilé : lancez « npm run build » dans vigie-frontend.",
                            status=503, content_type="text/plain; charset=utf-8")
    full_title = title if home else f"{title} — {settings.SITE_NAME}"
    url, desc = _abs(path), escape(_short(description))
    tags = [
        f"<title>{escape(full_title)}</title>",
        f'<meta name="description" content="{desc}">',
        f'<link rel="canonical" href="{escape(url)}">',
        f'<meta property="og:site_name" content="{escape(settings.SITE_NAME)}">',
        f'<meta property="og:locale" content="fr_FR">',
        f'<meta property="og:type" content="{og_type}">',
        f'<meta property="og:title" content="{escape(full_title)}">',
        f'<meta property="og:description" content="{desc}">',
        f'<meta property="og:url" content="{escape(url)}">',
        f'<meta name="twitter:card" content="{"summary_large_image" if image else "summary"}">',
        f'<link rel="alternate" type="application/rss+xml" title="{escape(settings.SITE_NAME)}" href="{settings.SITE_URL}/feed.xml">',
    ]
    if image:
        tags += [f'<meta property="og:image" content="{escape(image)}">', f'<meta name="twitter:image" content="{escape(image)}">']
    if noindex:
        tags.append('<meta name="robots" content="noindex">')
    head = "\n".join(tags) + "\n" + head_extra
    html = re.sub(r"<title>.*?</title>", "", html, flags=re.S)
    html = html.replace("</head>", head + "\n</head>", 1)
    if body:
        html = html.replace('<div id="root"></div>', f'<div id="root">{body}</div>', 1)
    return HttpResponse(html, status=status)


def _paragraphs(text: str) -> str:
    return "".join(f"<p>{escape(line)}</p>" for line in text.splitlines() if line.strip())


# ----------------------------- pages -----------------------------
def article_page(request, slug):
    article = published_articles().filter(slug=slug).first()
    if article is None:
        return render_shell(title="Article introuvable", description="Cet article n'existe pas.",
                            path=f"/articles/{slug}", status=404, noindex=True)
    path = f"/articles/{article.slug}"
    author_url = _abs(f"/authors/{article.author.username}")
    image = _media(request, article.cover_image)
    tags = [t.name for t in article.tags.all()]
    published, modified = article.published_at.isoformat(), article.updated_at.isoformat()
    data = {
        "@context": "https://schema.org", "@type": "BlogPosting",
        "headline": article.title[:110], "description": _short(article.summary or article.content),
        "datePublished": published, "dateModified": modified, "inLanguage": "fr",
        "mainEntityOfPage": {"@type": "WebPage", "@id": _abs(path)},
        "author": {"@type": "Person", "name": article.author.username, "url": author_url},
        "publisher": {"@type": "Organization", "name": settings.SITE_NAME, "url": settings.SITE_URL},
    }
    if image:
        data["image"] = [image]
    if tags:
        data["keywords"] = ", ".join(tags)
    if article.category:
        data["articleSection"] = article.category.name
    extra = [
        _ld(data),
        f'<meta name="author" content="{escape(article.author.username)}">',
        f'<meta property="article:published_time" content="{published}">',
        f'<meta property="article:modified_time" content="{modified}">',
        f'<meta property="article:author" content="{escape(author_url)}">',
    ]
    extra += [f'<meta property="article:tag" content="{escape(t)}">' for t in tags]
    body = (
        f"<article><h1>{escape(article.title)}</h1>"
        f'<p>Par <a href="/authors/{escape(article.author.username)}">{escape(article.author.username)}</a></p>'
        f"{_paragraphs(article.content)}</article>"
    )
    return render_shell(title=article.title, description=article.summary or article.content, path=path,
                        og_type="article", image=image, head_extra="\n".join(extra), body=body)


def author_page(request, username):
    author = User.objects.filter(username=username, is_active=True).first()
    articles = list(published_articles().filter(author=author).order_by("-published_at")[:30]) if author else []
    if not articles:
        return render_shell(title="Auteur introuvable", description="Cet auteur n'existe pas.",
                            path=f"/authors/{username}", status=404, noindex=True)
    path = f"/authors/{author.username}"
    image = _media(request, author.avatar)
    person = {"@type": "Person", "name": author.username, "url": _abs(path)}
    if author.bio:
        person["description"] = _short(author.bio)
    if image:
        person["image"] = image
    if author.website:
        person["sameAs"] = [author.website]
    data = {"@context": "https://schema.org", "@type": "ProfilePage", "mainEntity": person}
    items = "".join(f'<li><a href="/articles/{escape(a.slug)}">{escape(a.title)}</a></li>' for a in articles)
    body = f"<main><h1>{escape(author.username)}</h1>{_paragraphs(author.bio)}<ul>{items}</ul></main>"
    return render_shell(title=f"{author.username}, auteur", description=author.bio or f"Articles de {author.username}",
                        path=path, og_type="profile", image=image, head_extra=_ld(data), body=body)


def home_page(request):
    latest = list(published_articles().order_by("-published_at")[:10])
    data = {
        "@context": "https://schema.org", "@type": "WebSite", "name": settings.SITE_NAME, "url": settings.SITE_URL,
        "potentialAction": {"@type": "SearchAction", "target": f"{settings.SITE_URL}/articles?search={{search_term_string}}",
                            "query-input": "required name=search_term_string"},
    }
    items = "".join(f'<li><a href="/articles/{escape(a.slug)}">{escape(a.title)}</a></li>' for a in latest)
    body = f"<main><h1>{escape(settings.SITE_NAME)}</h1><p>{escape(settings.SITE_DESCRIPTION)}</p><ul>{items}</ul></main>"
    return render_shell(title=f"{settings.SITE_NAME} — veille technologique", description=settings.SITE_DESCRIPTION,
                        path="/", head_extra=_ld(data), body=body, home=True)


def spa_fallback(request, path=""):
    """Toute autre page du front (login, profil...) : index.html tel quel, non indexable."""
    return render_shell(title=settings.SITE_NAME, description=settings.SITE_DESCRIPTION,
                        path=request.path, noindex=True, home=True)


def robots(request):
    lines = [
        "User-agent: *",
        "Disallow: /admin", "Disallow: /django-admin/", "Disallow: /api/",
        "Disallow: /login", "Disallow: /register", "Disallow: /profile", "Disallow: /favorites",
        "Allow: /", "",
        f"Sitemap: {settings.SITE_URL}/sitemap.xml",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain; charset=utf-8")
