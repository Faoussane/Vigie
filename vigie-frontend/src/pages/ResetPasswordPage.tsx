import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import Seo from "../components/Seo";
import { useToast } from "../components/Toast";
import { api, errorMessage } from "../lib/api";

export default function ResetPasswordPage() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/password/reset/confirm/", { uid, token, new_password: password });
      notify("Mot de passe modifié. Vous pouvez vous connecter.");
      navigate("/login");
    } catch (err) { setError(errorMessage(err)); }
  };

  return (
    <AuthShell title="Nouveau mot de passe" subtitle="Choisissez un mot de passe d'au moins 8 caractères.">
      <Seo title="Nouveau mot de passe" noindex />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nouveau mot de passe"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="field" /></Field>
        {error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error} <Link to="/forgot-password" className="font-semibold underline">Demander un nouveau lien</Link></p>}
        <button className="btn btn-primary w-full !py-2.5">Enregistrer le mot de passe</button>
      </form>
    </AuthShell>
  );
}
