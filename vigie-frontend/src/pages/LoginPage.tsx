import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import Seo from "../components/Seo";
import { login } from "../lib/api";

const schema = z.object({ email: z.string().email("Adresse e-mail invalide"), password: z.string().min(1, "Saisissez votre mot de passe") });
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Values) => {
    try { await login(v.email, v.password); navigate("/"); }
    catch { setError("E-mail ou mot de passe incorrect."); }
  };

  return (
    <AuthShell title="Se connecter" subtitle="Retrouvez vos favoris, vos commentaires et vos notifications."
      footer={<>Pas encore de compte ? <Link to="/register" className="font-semibold text-brand hover:underline">Créer un compte</Link></>}>
      <Seo title="Connexion" noindex />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Adresse e-mail" error={errors.email?.message}><input {...register("email")} type="email" autoComplete="email" className="field" /></Field>
        <Field label="Mot de passe" error={errors.password?.message}><input type="password" {...register("password")} autoComplete="current-password" className="field" /></Field>
        {error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <button disabled={isSubmitting} className="btn btn-primary w-full !py-2.5">{isSubmitting ? "Connexion…" : "Se connecter"}</button>
        <p className="text-center text-sm"><Link to="/forgot-password" className="text-brand hover:underline">Mot de passe oublié ?</Link></p>
      </form>
    </AuthShell>
  );
}
