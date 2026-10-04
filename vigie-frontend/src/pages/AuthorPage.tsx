import { Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ArticleCard from "../components/ArticleCard";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import Seo from "../components/Seo";
import { Skeleton } from "../components/Skeleton";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import type { Article, Author, Paginated } from "../types";

/** Page publique d'un auteur — référencée par Google via JSON-LD ProfilePage. */
export default function AuthorPage() {
  const { username } = useParams();
  const [author, setAuthor] = useState<Author | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setMissing(false);
    api.get<Author>(`/authors/${encodeURIComponent(username ?? "")}/`).then((r) => setAuthor(r.data)).catch(() => setMissing(true));
    api.get<Paginated<Article>>("/articles/", { params: { author__username: username, page_size: 30 } }).then((r) => setArticles(r.data.results));
  }, [username]);

  if (missing) return <EmptyState title="Auteur introuvable" text="Seuls les auteurs ayant publié au moins un article ont une page." />;
  if (!author) return <Skeleton className="h-32 w-full" />;
  const origin = window.location.origin;

  return (
    <div>
      <Seo title={`${author.username}, auteur`} description={author.bio || `Articles de ${author.username}`} type="profile" image={author.avatar}
        jsonLd={{ "@context": "https://schema.org", "@type": "ProfilePage", mainEntity: { "@type": "Person", name: author.username, url: `${origin}/authors/${encodeURIComponent(author.username)}`, description: author.bio || undefined, image: author.avatar || undefined, sameAs: author.website ? [author.website] : undefined } }} />
      <header className="mb-10 flex flex-col items-start gap-5 rounded-3xl border bg-surface p-6 sm:flex-row sm:items-center sm:p-8">
        <Avatar name={author.username} src={author.avatar} size={88} />
        <div>
          <h1 className="text-3xl font-extrabold">{author.username}</h1>
          <p className="mt-1 text-sm text-muted">{author.articles_count} article{author.articles_count > 1 ? "s" : ""} publié{author.articles_count > 1 ? "s" : ""} · membre depuis {formatDate(author.date_joined)}</p>
          {author.bio && <p className="mt-3 max-w-xl">{author.bio}</p>}
          {author.website && <a href={author.website} rel="me noopener" target="_blank" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"><Globe size={14} />{author.website.replace(/^https?:\/\//, "")}</a>}
        </div>
      </header>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{articles.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
    </div>
  );
}
