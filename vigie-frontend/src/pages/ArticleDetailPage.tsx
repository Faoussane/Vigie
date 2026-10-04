import { zodResolver } from "@hookform/resolvers/zod";
import { Bookmark, BookmarkCheck, Clock, Eye, ExternalLink, Flag, EyeOff, Pencil, ThumbsUp, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import Avatar from "../components/Avatar";
import Cover from "../components/Cover";
import EmptyState from "../components/EmptyState";
import ReadingProgress from "../components/ReadingProgress";
import Seo from "../components/Seo";
import ShareButtons from "../components/ShareButtons";
import { Skeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { api, errorMessage } from "../lib/api";
import { formatDate, readingMinutes, timeAgo } from "../lib/format";
import { useAuth } from "../store/auth";
import type { ArticleDetail, Collection, Comment, Paginated } from "../types";

const commentSchema = z.object({ content: z.string().min(2, "Écrivez au moins 2 caractères").max(2000, "2000 caractères maximum") });
type CommentForm = z.infer<typeof commentSchema>;

export default function ArticleDetailPage() {
  const { slug } = useParams();
  const user = useAuth((s) => s.user);
  const { notify } = useToast();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collection, setCollection] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CommentForm>({ resolver: zodResolver(commentSchema) });

  const loadComments = useCallback(
    () => api.get<Paginated<Comment>>("/comments/", { params: { article: slug, page_size: 50 } }).then((r) => setComments(r.data.results)),
    [slug],
  );

  useEffect(() => {
    setMissing(false);
    api.get<ArticleDetail>(`/articles/${slug}/`).then((r) => setArticle(r.data)).catch(() => setMissing(true));
    loadComments();
  }, [slug, loadComments, user]);
  useEffect(() => { if (user) api.get<Collection[]>("/collections/").then((r) => setCollections(r.data)); }, [user]);

  const toggle = async (kind: "like" | "favorite", body?: object) => {
    if (!article) return;
    try {
      const { data } = await api.post<{ active: boolean }>(`/articles/${slug}/${kind}/`, body);
      setArticle(kind === "like"
        ? { ...article, is_liked: data.active, likes_count: article.likes_count + (data.active ? 1 : -1) }
        : { ...article, is_favorited: data.active });
      if (kind === "favorite") notify(data.active ? "Ajouté aux favoris" : "Retiré des favoris");
    } catch (e) { notify(errorMessage(e), "error"); }
  };

  const onComment = async (v: CommentForm) => {
    try { await api.post("/comments/", { article: slug, content: v.content }); reset(); loadComments(); notify("Commentaire publié"); }
    catch (e) { notify(errorMessage(e), "error"); }
  };
  const remove = async (c: Comment) => { if (confirm("Supprimer ce commentaire ?")) { await api.delete(`/comments/${c.id}/`); loadComments(); } };
  const report = async (c: Comment) => {
    const reason = prompt("Pourquoi signalez-vous ce commentaire ?");
    if (reason === null) return;
    await api.post(`/comments/${c.id}/report/`, { reason });
    notify("Commentaire signalé");
  };
  const hide = async (c: Comment) => { await api.post(`/comments/${c.id}/hide/`); loadComments(); };

  if (missing) return <EmptyState title="Article introuvable" text="Il a peut-être été déplacé ou n'est pas encore publié."><Link to="/articles" className="btn btn-ghost">Voir tous les articles</Link></EmptyState>;
  if (!article) return <div className="mx-auto max-w-3xl space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-64 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>;

  const origin = window.location.origin;
  const url = `${origin}/articles/${article.slug}`;
  const isAdmin = user?.role === "ADMIN";

  return (
    <article className="mx-auto max-w-3xl">
      <ReadingProgress />
      <Seo
        title={article.title} description={article.summary || article.content} type="article" image={article.cover_image}
        publishedTime={article.published_at} modifiedTime={article.updated_at}
        jsonLd={{
          "@context": "https://schema.org", "@type": "BlogPosting", headline: article.title, description: article.summary,
          image: article.cover_image ? [article.cover_image] : undefined, datePublished: article.published_at, dateModified: article.updated_at,
          author: { "@type": "Person", name: article.author, url: `${origin}/authors/${encodeURIComponent(article.author)}` },
          publisher: { "@type": "Organization", name: "Vigie" }, mainEntityOfPage: url,
          keywords: article.tags.map((t) => t.name).join(", "), articleSection: article.category?.name,
        }}
      />

      {article.status !== "PUBLISHED" && (
        <p className="mb-5 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">Aperçu : cet article est au statut « {article.status} » et n'est pas visible du public.</p>
      )}

      <header>
        {article.category && <Link to={`/articles?category__slug=${article.category.slug}`} className="badge badge-brand mb-4 hover:brightness-110">{article.category.name}</Link>}
        <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{article.title}</h1>
        {article.summary && <p className="mt-4 text-lg text-muted">{article.summary}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <Link to={`/authors/${encodeURIComponent(article.author)}`} className="flex items-center gap-2 font-medium text-ink hover:text-brand"><Avatar name={article.author} size={32} />{article.author}</Link>
          {article.published_at && <time dateTime={article.published_at} title={formatDate(article.published_at)}>{timeAgo(article.published_at)}</time>}
          <span className="flex items-center gap-1"><Clock size={14} />{readingMinutes(article.content)} min de lecture</span>
          <span className="flex items-center gap-1"><Eye size={14} />{article.view_count}</span>
          {isAdmin && <Link to={`/admin/articles/${article.slug}/edit`} className="btn btn-ghost btn-sm ml-auto"><Pencil size={14} />Modifier</Link>}
        </div>
      </header>

      <Cover src={article.cover_image} seed={article.slug} className="mt-8 aspect-[2/1] w-full rounded-2xl" />

      <div className="article-body mt-10">{article.content}</div>

      {article.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {article.tags.map((t) => <Link key={t.id} to={`/articles?tags__slug=${t.slug}`} className="rounded-full border bg-surface px-3 py-1 text-sm hover:border-brand hover:text-brand">#{t.name}</Link>)}
        </div>
      )}

      {article.article_sources.length > 0 && (
        <section className="mt-10 rounded-2xl border bg-surface p-5">
          <h2 className="font-bold">Sources consultées</h2>
          <ul className="mt-3 divide-y">
            {article.article_sources.map((s) => (
              <li key={s.source.id} className="flex items-center gap-3 py-2.5">
                <a href={s.source.url} target="_blank" rel="noreferrer noopener" className="flex min-w-0 flex-1 items-center gap-2 font-medium text-brand hover:underline"><span className="truncate">{s.source.name}</span><ExternalLink size={14} className="shrink-0" /></a>
                <span className="badge">{s.source.source_type}</span>
                <span className="text-xs text-muted">consultée le {formatDate(s.consulted_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 space-y-4 border-y py-5">
        {user ? (
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => toggle("like")} className={`btn ${article.is_liked ? "btn-primary" : "btn-ghost"}`} aria-pressed={article.is_liked}><ThumbsUp size={16} />{article.is_liked ? "Aimé" : "J'aime"} · {article.likes_count}</button>
            <button onClick={() => toggle("favorite")} className={`btn ${article.is_favorited ? "btn-primary" : "btn-ghost"}`} aria-pressed={article.is_favorited}>
              {article.is_favorited ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}{article.is_favorited ? "Dans vos favoris" : "Sauvegarder"}
            </button>
            {collections.length > 0 && (
              <span className="flex gap-2">
                <select value={collection} onChange={(e) => setCollection(e.target.value)} aria-label="Collection" className="field !w-auto"><option value="">Ranger dans…</option>{collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <button disabled={!collection} onClick={() => toggle("favorite", { collection: Number(collection) })} className="btn btn-ghost">Ranger</button>
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted"><Link to="/login" className="font-semibold text-brand hover:underline">Connectez-vous</Link> pour aimer, sauvegarder et commenter cet article.</p>
        )}
        <ShareButtons url={url} title={article.title} />
      </section>

      <section className="mt-10" aria-labelledby="comments">
        <h2 id="comments" className="mb-4 text-xl font-bold">Commentaires ({comments.length})</h2>
        {user && (
          <form onSubmit={handleSubmit(onComment)} className="mb-6 flex gap-3">
            <Avatar name={user.username} src={user.avatar} size={36} />
            <div className="flex-1 space-y-2">
              <textarea {...register("content")} rows={3} aria-label="Votre commentaire" className="field" placeholder="Partagez votre avis ou une source complémentaire…" />
              {errors.content && <p className="text-sm text-danger">{errors.content.message}</p>}
              <button disabled={isSubmitting} className="btn btn-primary">Publier le commentaire</button>
            </div>
          </form>
        )}
        {comments.length === 0 && <p className="text-sm text-muted">Aucun commentaire pour le moment.</p>}
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className={`flex gap-3 ${c.is_hidden ? "opacity-60" : ""}`}>
              <Avatar name={c.author} size={36} />
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border bg-surface px-4 py-3">
                <p className="text-sm"><strong>{c.author}</strong> <span className="text-muted">· {timeAgo(c.created_at)}</span>{c.is_hidden && <span className="badge badge-danger ml-2">masqué</span>}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.content}</p>
                {user && (
                  <div className="mt-2 flex gap-3 text-xs text-muted">
                    {(isAdmin || user.username === c.author) && <button onClick={() => remove(c)} className="flex items-center gap-1 hover:text-danger"><Trash2 size={13} />Supprimer</button>}
                    {user.username !== c.author && <button onClick={() => report(c)} className="flex items-center gap-1 hover:text-danger"><Flag size={13} />Signaler</button>}
                    {isAdmin && <button onClick={() => hide(c)} className="flex items-center gap-1 hover:text-brand"><EyeOff size={13} />{c.is_hidden ? "Afficher" : "Masquer"}</button>}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
