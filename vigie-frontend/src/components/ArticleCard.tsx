import { Eye, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { timeAgo } from "../lib/format";
import type { Article } from "../types";
import Avatar from "./Avatar";
import Cover from "./Cover";

/**
 * Carte d'article. Toute la carte est cliquable (lien étiré sur le titre) ;
 * catégorie, tags et auteur restent des liens indépendants (``relative z-10``).
 */
export default function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  const to = `/articles/${article.slug}`;
  return (
    <article className={`group relative overflow-hidden rounded-2xl border bg-surface transition-colors hover:border-brand/60 ${featured ? "md:grid md:grid-cols-2" : "flex flex-col"}`}>
      <Cover src={article.cover_image} seed={article.slug} className={featured ? "aspect-[16/9] w-full md:aspect-auto md:h-full md:min-h-72" : "aspect-[16/9] w-full"} />
      <div className={`flex flex-1 flex-col gap-2 p-4 ${featured ? "md:p-8" : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          {article.category && (
            <Link to={`/articles?category__slug=${article.category.slug}`} className="badge badge-brand relative z-10 hover:brightness-110">{article.category.name}</Link>
          )}
          {article.status !== "PUBLISHED" && <span className="badge badge-warn">{article.status}</span>}
        </div>
        <h3 className={`font-bold leading-snug ${featured ? "text-2xl sm:text-3xl" : "text-lg"}`}>
          <Link to={to} className="after:absolute after:inset-0 group-hover:text-brand">{article.title}</Link>
        </h3>
        <p className={`text-muted ${featured ? "line-clamp-4 text-base" : "line-clamp-3 text-sm"}`}>{article.summary}</p>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-3 text-xs text-muted">
            {article.tags.slice(0, 3).map((t) => <Link key={t.id} to={`/articles?tags__slug=${t.slug}`} className="relative z-10 hover:text-brand">#{t.name}</Link>)}
          </div>
        )}
        <div className="mt-auto flex items-center gap-2 pt-3 text-xs text-muted">
          <Avatar name={article.author} size={22} />
          <Link to={`/authors/${encodeURIComponent(article.author)}`} className="relative z-10 font-medium text-ink hover:text-brand">{article.author}</Link>
          <time dateTime={article.published_at ?? undefined}>{timeAgo(article.published_at)}</time>
          <span className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1" title="Vues"><Eye size={14} />{article.view_count}</span>
            <span className="flex items-center gap-1" title="Commentaires"><MessageCircle size={14} />{article.comments_count}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
