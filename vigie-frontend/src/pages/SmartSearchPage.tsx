import { useEffect, useState } from "react";
import ArticleCard from "../components/ArticleCard";
import Seo from "../components/Seo";
import { useToast } from "../components/Toast";
import { api, errorMessage } from "../lib/api";
import { btn, input } from "../ui";
import type { Article, Trends } from "../types";

/** Recherche en langage naturel (V3) + tendances calculées sur les données collectées. */
export default function SmartSearchPage() {
  const { notify } = useToast();
  const [q, setQ] = useState("");
  const [data, setData] = useState<{ interpreted: { keywords: string[]; days: number | null }; results: Article[] } | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);

  useEffect(() => { api.get<Trends>("/ai/trends/").then((r) => setTrends(r.data)); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    try { setData((await api.get("/ai/search/", { params: { q } })).data); }
    catch (err) { notify(errorMessage(err), "error"); }
  };

  return (
    <div className="space-y-8">
      <Seo title="Recherche intelligente" noindex />
      <h1 className="text-2xl font-bold">✨ Recherche intelligente</h1>
      <form onSubmit={submit} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} className={`${input} flex-1`} placeholder="Quelles publications parlent récemment de performance dans React ?" />
        <button className={btn}>Chercher</button>
      </form>

      {data && (
        <section>
          <p className="mb-3 text-sm text-muted">
            Mots-clés compris : {data.interpreted.keywords.join(", ") || "—"}{data.interpreted.days ? ` · derniers ${data.interpreted.days} jours` : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.results.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
          {data.results.length === 0 && <p className="text-muted">Aucun résultat.</p>}
        </section>
      )}

      {trends && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Tendances ({trends.period_days} derniers jours)</h2>
          <p className="mb-2 text-xs text-muted">Statistiques calculées sur les informations collectées (pas une opinion).</p>
          {trends.technologies.length + trends.categories.length === 0 ? <p className="text-muted">Pas encore de données collectées.</p> : (
            <ol className="list-decimal pl-5">
              {[...trends.technologies, ...trends.categories].slice(0, 8).map((t) => <li key={t.name}>{t.name} <span className="text-muted">({t.count})</span></li>)}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
