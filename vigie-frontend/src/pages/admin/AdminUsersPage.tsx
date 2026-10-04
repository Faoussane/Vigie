import { useCallback, useEffect, useState } from "react";
import Pagination from "../../components/Pagination";
import { useToast } from "../../components/Toast";
import { api, errorMessage } from "../../lib/api";
import { btn, input } from "../../ui";
import type { AdminUser, Paginated } from "../../types";

/** Gestion des utilisateurs : rôle et activation du compte. */
export default function AdminUsersPage() {
  const { notify } = useToast();
  const [data, setData] = useState<Paginated<AdminUser> | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(
    () => api.get<Paginated<AdminUser>>("/users/", { params: { page, page_size: 15, search: query || undefined } }).then((r) => setData(r.data)),
    [page, query],
  );
  useEffect(() => { load(); }, [load]);

  const patch = async (u: AdminUser, body: Partial<AdminUser>) => {
    try { await api.patch(`/users/${u.id}/`, body); notify("Utilisateur mis à jour"); load(); }
    catch (e) { notify(errorMessage(e), "error"); }
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Utilisateurs</h1>
      <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search); }} className="mb-4 flex gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom ou e-mail" className={`${input} max-w-xs`} />
        <button className={btn}>Rechercher</button>
      </form>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Compte actif</th><th>Inscrit le</th></tr></thead>
          <tbody>
            {data?.results.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => patch(u, { role: e.target.value as AdminUser["role"] })} className="rounded border text-sm">
                    <option value="USER">Utilisateur</option><option value="ADMIN">Administrateur</option>
                  </select>
                </td>
                <td><input type="checkbox" checked={u.is_active} onChange={(e) => patch(u, { is_active: e.target.checked })} /></td>
                <td>{new Date(u.date_joined).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={page} count={data.count} pageSize={15} onChange={setPage} />}
    </div>
  );
}
