import { ArrowRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ArticleCard from "../components/ArticleCard";
import EmptyState from "../components/EmptyState";
import Radar from "../components/Radar";
import Seo from "../components/Seo";
import { GridSkeleton } from "../components/Skeleton";
import { api } from "../lib/api";
import { useAuth } from "../store/auth";
import type { Article, Category, Paginated, Tag } from "../types";

export default function HomePage() {
  const [latest, setLatest] = useState<Article[] | null>(null);
  const [popular, setPopular] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [recommended, setRecommended] = useState<Article[]>([]);
  const [q, setQ] = useState("");
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Paginated<Article>>("/articles/", { params: { page_size: 7 } }).then((r) => setLatest(r.data.results)).catch(() => setLatest([]));
    api.get<Article[]>("/articles/popular/").then((r) => setPopular(r.data));
    api.get<Category[]>("/categories/").then((r) => setCategories(r.data));
    api.get<Tag[]>("/tags/popular/").then((r) => setTags(r.data));
  }, []);
  useEffect(() => {
    if (user) api.get<Article[]>("/ai/recommendations/").then((r) => setRecommended(r.data)).catch(() => {});
    else setRecommended([]);
  }, [user]);

  const echoes = [
    ...categories.slice(0, 4).map((c) => ({ label: c.name, to: `/articles?category__slug=${c.slug}` })),
    ...tags.slice(0, 3).map((t) => ({ label: `#${t.name}`, to: `/articles?tags__slug=${t.slug}` })),
  ];
  const [featured, ...rest] = latest ?? [];

  return (
    <div className="space-y-16">
      <Seo title="Vigie" description="Veille technologique : IA, web, cybersécurité, cloud, DevOps — analyses sourcées." />

      <section className="grid items-center gap-10 pt-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">La veille tech, triée et sourcée.</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">Des analyses courtes sur l'IA, le web, la cybersécurité et le cloud. Chaque article cite les sources qui l'ont nourri.</p>
          <form onSubmit={(e) => { e.preventDefault(); navigate(`/articles?search=${encodeURIComponent(q)}`); }} role="search" className="mt-7 flex max-w-xl gap-2">
            <div className="relative flex-1">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher" placeholder="React, sécurité, Docker…" className="field !py-3 !pl-10 !text-base" />
            </div>
            <button className="btn btn-primary !px-5">Rechercher</button>
          </form>
          {tags.length > 0 && (
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              Sujets du moment :
              {tags.slice(0, 5).map((t) => <Link key={t.id} to={`/articles?tags__slug=${t.slug}`} className="font-medium text-ink hover:text-brand">#{t.name}</Link>)}
            </p>
          )}
        </div>
        <Radar items={echoes} />
      </section>

      {latest === null ? <GridSkeleton /> : latest.length === 0 ? (
        <EmptyState title="Aucun article publié pour le moment" text="Dès qu'un article est publié, il apparaît ici." />
      ) : (
        <section aria-labelledby="latest">
          <div className="mb-5 flex items-end justify-between">
            <h2 id="latest" className="text-2xl font-bold">À la une</h2>
            <Link to="/articles" className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">Tous les articles <ArrowRight size={15} /></Link>
          </div>
          <ArticleCard article={featured} featured />
          {rest.length > 0 && <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rest.map((a) => <ArticleCard key={a.id} article={a} />)}</div>}
        </section>
      )}

      {recommended.length > 0 && (
        <section aria-labelledby="reco">
          <h2 id="reco" className="mb-5 text-2xl font-bold">Choisis pour vous</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{recommended.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        {popular.length > 0 && (
          <section aria-labelledby="popular">
            <h2 id="popular" className="mb-4 text-2xl font-bold">Les plus lus</h2>
            <ol className="divide-y rounded-2xl border bg-surface">
              {popular.map((a, i) => (
                <li key={a.id}>
                  <Link to={`/articles/${a.slug}`} className="flex items-center gap-4 p-4 hover:bg-sunken">
                    <span className="w-8 text-3xl font-extrabold tabular-nums text-line">{i + 1}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{a.title}</span><span className="text-xs text-muted">{a.category?.name ?? "Sans catégorie"} · {a.view_count} vues</span></span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}
        <section aria-labelledby="topics">
          <h2 id="topics" className="mb-4 text-2xl font-bold">Parcourir par thème</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => <Link key={c.id} to={`/articles?category__slug=${c.slug}`} className="rounded-full border bg-surface px-3.5 py-1.5 text-sm font-medium hover:border-brand hover:text-brand">{c.name}</Link>)}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
            {tags.map((t) => <Link key={t.id} to={`/articles?tags__slug=${t.slug}`} className="hover:text-brand">#{t.name}</Link>)}
          </div>
        </section>
      </div>
    </div>
  );
}
