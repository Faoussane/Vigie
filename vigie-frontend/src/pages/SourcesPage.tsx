import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import Seo from "../components/Seo";
import { api } from "../lib/api";
import type { Paginated, Source } from "../types";

const TYPES: Record<string, string> = {
  WEBSITE: "Site web", BLOG: "Blog", DOCS: "Documentation", GITHUB: "GitHub", YOUTUBE: "YouTube", PODCAST: "Podcast", SOCIAL: "Réseau social", PAPER: "Article scientifique",
};

/** Sources de la veille, consultables par les visiteurs. */
export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [type, setType] = useState("");
  useEffect(() => {
    api.get<Paginated<Source>>("/sources/", { params: { page_size: 100, source_type: type || undefined } }).then((r) => setSources(r.data.results));
  }, [type]);
  return (
    <div>
      <Seo title="Sources" description="Les sources surveillées pour produire cette veille." />
      <PageHeader title="Sources" subtitle="D'où viennent les informations analysées dans les articles." />
      <div className="mb-5 flex flex-wrap gap-2">
        <button onClick={() => setType("")} className={`btn btn-sm ${type === "" ? "btn-primary" : "btn-ghost"}`}>Toutes</button>
        {Object.entries(TYPES).map(([k, v]) => <button key={k} onClick={() => setType(k)} className={`btn btn-sm ${type === k ? "btn-primary" : "btn-ghost"}`}>{v}</button>)}
      </div>
      {sources.length === 0 && <EmptyState title="Aucune source de ce type" />}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((s) => (
          <li key={s.id}>
            <a href={s.url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-3 rounded-2xl border bg-surface p-4 transition-colors hover:border-brand/60">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft font-bold text-brand">{s.name.slice(0, 1).toUpperCase()}</span>
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{s.name}</span><span className="text-xs text-muted">{TYPES[s.source_type] ?? s.source_type}</span></span>
              <ExternalLink size={15} className="shrink-0 text-muted" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
