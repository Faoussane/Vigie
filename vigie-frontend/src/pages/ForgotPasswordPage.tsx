import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import Seo from "../components/Seo";
import { api, errorMessage } from "../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sent" | string>("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post("/auth/password/reset/", { email }); setState("sent"); }
    catch (err) { setState(errorMessage(err)); }
  };

  return (
    <AuthShell title="Mot de passe oublié" subtitle="Nous vous envoyons un lien pour en choisir un nouveau."
      footer={<Link to="/login" className="font-semibold text-brand hover:underline">Retour à la connexion</Link>}>
      <Seo title="Mot de passe oublié" noindex />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Adresse e-mail du compte"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="field" /></Field>
        <button className="btn btn-primary w-full !py-2.5">Envoyer le lien</button>
        {state === "sent" && <p role="status" className="rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">Si ce compte existe, un lien vient d'être envoyé. En développement, il s'affiche dans la console du serveur Django.</p>}
        {state !== "idle" && state !== "sent" && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state}</p>}
      </form>
    </AuthShell>
  );
}
