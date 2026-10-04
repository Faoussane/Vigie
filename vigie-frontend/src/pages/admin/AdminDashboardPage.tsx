import { Eye, FileText, MessageSquare, Plus, Radar, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { Skeleton } from "../../components/Skeleton";
import { api } from "../../lib/api";
import type { Stats } from "../../types";

const STATUS: Record<string, [string, string]> = {
  DRAFT: ["Brouillon", "badge"], SCHEDULED: ["Planifié", "badge badge-warn"], PUBLISHED: ["Publié", "badge badge-ok"], ARCHIVED: ["Archivé", "badge"],
};

/** Tableau de bord : chiffres clés, vues par article récent, accès rapides. */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { api.get<Stats>("/admin/stats/").then((r) => setStats(r.data)); }, []);

  const tiles = stats ? [
    { label: "Articles", value: stats.articles, icon: FileText },
    { label: "Utilisateurs", value: stats.users, icon: Users },
    { label: "Commentaires", value: stats.comments, icon: MessageSquare },
    { label: "Vues", value: stats.views, icon: Eye },
  ] : [];
  const max = Math.max(1, ...(stats?.recent_articles.map((a) => a.view_count) ?? [1]));

  return (
    <div>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de la plateforme."
        actions={<><Link to="/admin/veille" className="btn btn-ghost"><Radar size={16} />Ma veille</Link><Link to="/admin/articles/new" className="btn btn-primary"><Plus size={16} />Nouvel article</Link></>} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {!stats && Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}
        {tiles.map(({ label, value, icon: Icon }) => (
          <div key={label} className="panel">
            <div className="flex items-center justify-between text-muted"><span className="text-sm">{label}</span><Icon size={18} /></div>
            <p className="mt-2 text-3xl font-extrabold tabular-nums">{value.toLocaleString("fr-FR")}</p>
          </div>
        ))}
      </div>

      {stats && (
        <section className="panel mt-6">
          <h2 className="mb-4 font-bold">Articles récents</h2>
          {stats.recent_articles.length === 0 && <p className="text-sm text-muted">Aucun article pour le moment. <Link to="/admin/articles/new" className="font-semibold text-brand">Écrire le premier</Link></p>}
          <ul className="space-y-3">
            {stats.recent_articles.map((a) => (
              <li key={a.slug} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
                <div className="flex min-w-0 items-center gap-2">
                  <Link to={`/admin/articles/${a.slug}/edit`} className="truncate font-medium hover:text-brand">{a.title}</Link>
                  <span className={STATUS[a.status]?.[1] ?? "badge"}>{STATUS[a.status]?.[0] ?? a.status}</span>
                </div>
                <span className="text-sm tabular-nums text-muted">{a.view_count} vues</span>
                <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-sunken"><div className="h-full rounded-full bg-brand" style={{ width: `${(a.view_count / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
