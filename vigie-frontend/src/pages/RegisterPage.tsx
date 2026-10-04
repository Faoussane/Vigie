import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import Seo from "../components/Seo";
import { api, errorMessage, login } from "../lib/api";

const schema = z
  .object({
    username: z.string().min(3, "3 caractères minimum"),
    email: z.string().email("Adresse e-mail invalide"),
    password: z.string().min(8, "8 caractères minimum"),
    password_confirm: z.string(),
  })
  .refine((v) => v.password === v.password_confirm, { path: ["password_confirm"], message: "Les mots de passe ne correspondent pas" });
type Values = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Values) => {
    try { await api.post("/auth/register/", v); await login(v.email, v.password); navigate("/"); }
    catch (e) { setError(errorMessage(e)); }
  };

  return (
    <AuthShell title="Créer un compte" subtitle="Commentez, sauvegardez des articles et suivez vos catégories."
      footer={<>Déjà inscrit ? <Link to="/login" className="font-semibold text-brand hover:underline">Se connecter</Link></>}>
      <Seo title="Inscription" noindex />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Nom d'utilisateur" error={errors.username?.message}><input {...register("username")} autoComplete="username" className="field" /></Field>
        <Field label="Adresse e-mail" error={errors.email?.message}><input {...register("email")} type="email" autoComplete="email" className="field" /></Field>
        <Field label="Mot de passe" hint="8 caractères minimum" error={errors.password?.message}><input type="password" {...register("password")} autoComplete="new-password" className="field" /></Field>
        <Field label="Confirmez le mot de passe" error={errors.password_confirm?.message}><input type="password" {...register("password_confirm")} autoComplete="new-password" className="field" /></Field>
        {error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <button disabled={isSubmitting} className="btn btn-primary w-full !py-2.5">{isSubmitting ? "Création…" : "Créer mon compte"}</button>
      </form>
    </AuthShell>
  );
}
