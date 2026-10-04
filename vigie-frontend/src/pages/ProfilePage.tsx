import { useEffect, useState } from "react";
import Seo from "../components/Seo";
import { useToast } from "../components/Toast";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../store/auth";
import { btn, btnDanger, btnGhost, card, input } from "../ui";
import type { Category, User } from "../types";

/** Profil : informations publiques, avatar, catégories suivies, mot de passe. */
export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { notify } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [bio, setBio] = useState(user?.bio ?? "");
  const [website, setWebsite] = useState(user?.website ?? "");
  const [followed, setFollowed] = useState<number[]>(user?.followed_categories ?? []);
  const [pw, setPw] = useState({ old_password: "", new_password: "" });

  useEffect(() => { api.get<Category[]>("/categories/").then((r) => setCategories(r.data)); }, []);
  useEffect(() => {
    if (user) { setBio(user.bio ?? ""); setWebsite(user.website ?? ""); setFollowed(user.followed_categories ?? []); }
  }, [user]);

  if (!user) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.patch<User>("/auth/me/", { bio, website, followed_categories: followed });
      setUser(data);
      notify("Profil enregistré");
    } catch (err) { notify(errorMessage(err), "error"); }
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const { data } = await api.post<User>("/auth/me/avatar/", fd);
      setUser(data);
      notify("Photo mise à jour");
    } catch (err) { notify(errorMessage(err), "error"); }
  };

  const removeAvatar = async () => {
    await api.delete("/auth/me/avatar/");
    setUser({ ...user, avatar: null });
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/password/change/", pw);
      setPw({ old_password: "", new_password: "" });
      notify("Mot de passe modifié");
    } catch (err) { notify(errorMessage(err), "error"); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Seo title="Mon profil" noindex />
      <h1 className="text-2xl font-bold">Mon profil</h1>

      <section className={`${card} flex items-center gap-4`}>
        {user.avatar ? <img src={user.avatar} alt="" className="h-20 w-20 rounded-full object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-2xl">👤</div>}
        <div className="space-y-2 text-sm">
          <p><strong>{user.username}</strong> · {user.email} · {user.role === "ADMIN" ? "Administrateur" : "Utilisateur"}</p>
          <label className={`${btnGhost} inline-block cursor-pointer`}>
            Changer la photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          </label>{" "}
          {user.avatar && <button onClick={removeAvatar} className={btnDanger}>Supprimer</button>}
        </div>
      </section>

      <form onSubmit={save} className={`${card} space-y-3`}>
        <h2 className="font-semibold">Informations publiques</h2>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Bio (affichée sur votre page auteur)" className={input} />
        <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Site web (https://…)" className={input} />
        <h2 className="pt-2 font-semibold">Catégories suivies <span className="text-xs font-normal text-muted">(notifications et recommandations)</span></h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={followed.includes(c.id)} onChange={(e) => setFollowed(e.target.checked ? [...followed, c.id] : followed.filter((i) => i !== c.id))} />
              {c.name}
            </label>
          ))}
        </div>
        <button className={btn}>Enregistrer</button>
      </form>

      <form onSubmit={changePassword} className={`${card} space-y-3`}>
        <h2 className="font-semibold">Changer le mot de passe</h2>
        <input type="password" required value={pw.old_password} onChange={(e) => setPw({ ...pw, old_password: e.target.value })} placeholder="Mot de passe actuel" className={input} />
        <input type="password" required minLength={8} value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} placeholder="Nouveau mot de passe" className={input} />
        <button className={btn}>Modifier</button>
      </form>
    </div>
  );
}
