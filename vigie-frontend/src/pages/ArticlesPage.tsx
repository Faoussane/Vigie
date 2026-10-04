import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ArticleCard from "../components/ArticleCard";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import Pagination from "../components/Pagination";
import Seo from "../components/Seo";
import { GridSkeleton } from "../components/Skeleton";
import { api } from "../lib/api";
import type { Article, Category, Paginated } from "../types";

const PAGE_SIZE = 12;

/** Liste paginée ; tous les filtres vivent dans l'URL (partageable) : search, category__slug, tags__slug, ordering, page. */
export default function ArticlesPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<Paginated<Article> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [text, setText] = useState(params.get("search") ?? "");
  const page = Number(params.get("page") ?? 1);

  useEffect(() => { api.get<Category[]>("/categories/").then((r) => setCategories(r.data)); }, []);
  useEffect(() => {
    setData(null);
    api.get<Paginated<Article>>("/articles/", { params: Object.fromEntries(params) }).then((r) => setData(r.data));
  }, [params]);
  useEffect(() => setText(params.get("search") ?? ""), [params]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const chips: [string, string, string][] = [];
  if (params.get("search")) chips.push(["search", `Recherche : ${params.get("search")}`, ""]);
  if (params.get("category__slug")) chips.push(["category__slug", categories.find((c) => c.slug === params.get("category__slug"))?.name ?? "Catégorie", ""]);
  if (params.get("tags__slug")) chips.push(["tags__slug", `#${params.get("tags__slug")}`, ""]);

  return (
    <div>
      <Seo title="Articles" description="Tous les articles de veille technologique." />
      <PageHeader title="Articles" subtitle={data ? `${data.count} article${data.count > 1 ? "s" : ""}` : "Chargement…"} />

      <form onSubmit={(e) => { e.preventDefault(); setParam("search", text); }} className="mb-4 flex flex-wrap gap-2 rounded-2xl border bg-surface p-2">
        <div className="relative min-w-52 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={text} onChange={(e) => setText(e.target.value)} aria-label="Rechercher dans les articles" placeholder="Titre, contenu, tag…" className="field !border-transparent !pl-9" />
        </div>
        <select value={params.get("category__slug") ?? ""} onChange={(e) => setParam("category__slug", e.target.value)} aria-label="Catégorie" className="field !w-auto">
          <option value="">Toutes les catégories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select value={params.get("ordering") ?? ""} onChange={(e) => setParam("ordering", e.target.value)} aria-label="Tri" className="field !w-auto">
          <option value="">Plus récents</option>
          <option value="-view_count">Plus lus</option>
          <option value="published_at">Plus anciens</option>
        </select>
        <button className="btn btn-primary">Rechercher</button>
      </form>

      {chips.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {chips.map(([key, label]) => (
            <button key={key} onClick={() => setParam(key, "")} className="badge badge-brand !px-2.5 !py-1 hover:brightness-110">{label}<X size={13} /></button>
          ))}
          <button onClick={() => setParams({})} className="text-sm text-muted hover:text-ink">Tout effacer</button>
        </div>
      )}

      {!data ? <GridSkeleton /> : data.results.length === 0 ? (
        <EmptyState title="Aucun article ne correspond" text="Essayez avec moins de mots-clés ou une autre catégorie.">
          <button onClick={() => setParams({})} className="btn btn-ghost">Réinitialiser les filtres</button>
        </EmptyState>
      ) : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.results.map((a) => <ArticleCard key={a.id} article={a} />)}</div>}
      {data && <Pagination page={page} count={data.count} pageSize={PAGE_SIZE} onChange={(p) => setParam("page", String(p))} />}
    </div>
  );
}
