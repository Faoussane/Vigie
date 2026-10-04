import { ExternalLink, RefreshCw, Rss, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useToast } from "../../components/Toast";
import { api, errorMessage } from "../../lib/api";
import type { Paginated, Source, VeilleItem, VeilleStats, VeilleStatus } from "../../types";

/** Chaque colonne a sa teinte : le rouge « signal » est réservé aux nouveautés. */
const COLUMNS: { status: VeilleStatus; label: string; color: string }[] = [
  { status: "NEW", label: "Nouveaux", color: "var(--signal)" },
  { status: "TO_VERIFY", label: "À vérifier", color: "var(--warn)" },
  { status: "TO_ANALYZE", label: "À analyser", color: "var(--brand)" },
  { status: "TO_WRITE", label: "À rédiger", color: "#7c6bd6" },
  { status: "PUBLISHED", label: "Publiés", color: "var(--ok)" },
  { status: "IGNORED", label: "Ignorés", color: "var(--muted)" },
];

/** « Ma veille » : Kanban des informations collectées (V2) enrichies par l'IA (V3). */
export default function VeillePage() {
  const { notify } = useToast();
  const [board, setBoard] = useState<Record<string, VeilleItem[]>>({});
  const [stats, setStats] = useState<VeilleStats | null>(null);
  const [collecting, setCollecting] = useState(false);

  const load = useCallback(async () => {
    const results = await Promise.all(COLUMNS.map((c) => api.get<Paginated<VeilleItem>>("/veille/items/", { params: { status: c.status, page_size: 30 } })));
    setBoard(Object.fromEntries(COLUMNS.map((c, i) => [c.status, results[i].data.results])));
    setStats((await api.get<VeilleStats>("/veille/stats/")).data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) notify(ok); load(); } catch (e) { notify(errorMessage(e), "error"); }
  };

  const collectAll = async () => {
    setCollecting(true);
    try {
      const { data } = await api.get<Paginated<Source>>("/sources/", { params: { page_size: 100 } });
      const withFeed = data.results.filter((s) => s.feed_url && s.is_active);
      if (withFeed.length === 0) notify("Aucune source active avec un flux RSS. Ajoutez-en une dans « Sources ».", "error");
      for (const s of withFeed) await api.post(`/sources/${s.id}/collect/`);
      if (withFeed.length) notify(`Collecte lancée pour ${withFeed.length} source(s)`);
      load();
    } catch (e) { notify(errorMessage(e), "error"); }
    finally { setCollecting(false); }
  };

  return (
    <div>
      <PageHeader title="Ma veille" subtitle="Triez les informations collectées, de la détection à la publication."
        actions={<><button onClick={load} className="btn btn-ghost"><RefreshCw size={16} />Actualiser</button><button onClick={collectAll} disabled={collecting} className="btn btn-primary"><Rss size={16} />{collecting ? "Collecte…" : "Collecter les sources"}</button></>} />

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {([["Sources surveillées", stats.sources_monitored], ["Informations collectées", stats.items_collected], ["Articles publiés", stats.articles_published], ["Catégorie dominante", stats.dominant_category ?? "—"]] as const).map(([label, value]) => (
            <div key={label} className="panel !p-3"><p className="text-xs text-muted">{label}</p><p className="text-2xl font-extrabold tabular-nums">{value}</p></div>
          ))}
        </div>
      )}

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4">
        {COLUMNS.map((col) => (
          <section key={col.status} className="w-72 shrink-0 rounded-2xl bg-sunken p-2" aria-label={col.label}>
            <h2 className="mb-2 flex items-center gap-2 px-2 pt-1 text-sm font-bold">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />{col.label}
              <span className="ml-auto rounded-full bg-surface px-2 text-xs font-semibold tabular-nums text-muted">{board[col.status]?.length ?? 0}</span>
            </h2>
            <div className="space-y-2">
              {(board[col.status] ?? []).length === 0 && <p className="px-2 py-6 text-center text-xs text-muted">Rien ici</p>}
              {(board[col.status] ?? []).map((item) => (
                <div key={item.id} className="rounded-xl border bg-surface p-3 text-sm" style={{ borderTop: `3px solid ${col.color}` }}>
                  <a href={item.url} target="_blank" rel="noreferrer noopener" className="flex items-start gap-1 font-semibold leading-snug hover:text-brand">{item.title}<ExternalLink size={13} className="mt-0.5 shrink-0 text-muted" /></a>
                  <p className="mt-1 text-xs text-muted">{item.source_name}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.importance && <span className="badge badge-warn" title="Importance estimée">★ {item.importance}/5</span>}
                    {item.suggested_category_name && <span className="badge badge-brand">{item.suggested_category_name}</span>}
                    {item.duplicate_of && <span className="badge badge-danger">doublon probable</span>}
                    {item.ai_data.technologies?.slice(0, 3).map((t) => <span key={t} className="badge">{t}</span>)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select value={item.status} aria-label="Déplacer vers" onChange={(e) => run(() => api.patch(`/veille/items/${item.id}/`, { status: e.target.value }))} className="field !w-auto !px-2 !py-1 !text-xs">
                      {COLUMNS.map((c) => <option key={c.status} value={c.status}>{c.label}</option>)}
                    </select>
                    <button onClick={() => run(() => api.post(`/veille/items/${item.id}/analyze/`), "Analyse terminée")} className="btn btn-ghost btn-sm"><Sparkles size={13} />Analyser</button>
                    {item.article_slug
                      ? <Link to={`/admin/articles/${item.article_slug}/edit`} className="btn btn-ghost btn-sm text-ok">Voir le brouillon</Link>
                      : <button onClick={() => run(() => api.post(`/veille/items/${item.id}/create_article/`), "Brouillon créé")} className="btn btn-ghost btn-sm">Créer l'article</button>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
