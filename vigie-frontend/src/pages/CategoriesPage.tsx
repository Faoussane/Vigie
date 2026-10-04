import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import Seo from "../components/Seo";
import { api } from "../lib/api";
import { hash } from "../lib/format";
import type { Category } from "../types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => { api.get<Category[]>("/categories/").then((r) => setCategories(r.data)); }, []);
  return (
    <div>
      <Seo title="Catégories" description="Parcourez la veille par thématique." />
      <PageHeader title="Catégories" subtitle="Choisissez un thème pour ne lire que ce qui vous concerne." />
      {categories.length === 0 && <EmptyState title="Aucune catégorie" />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link key={c.id} to={`/articles?category__slug=${c.slug}`} className="group flex flex-col rounded-2xl border bg-surface p-5 transition-colors hover:border-brand/60">
            <span className="mb-4 h-1.5 w-12 rounded-full" style={{ background: `hsl(${190 + (hash(c.slug) % 70)} 55% 42%)` }} />
            <span className="flex items-start justify-between gap-2"><h2 className="text-lg font-bold group-hover:text-brand">{c.name}</h2><ArrowUpRight size={18} className="shrink-0 text-muted group-hover:text-brand" /></span>
            <p className="mt-1 flex-1 text-sm text-muted">{c.description || "Analyses et actualités de cette thématique."}</p>
            <p className="mt-4 text-sm font-semibold tabular-nums">{c.articles_count ?? 0} article{(c.articles_count ?? 0) > 1 ? "s" : ""}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
