import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import Seo from "../components/Seo";

export default function NotFoundPage() {
  return (
    <div className="py-10">
      <Seo title="Page introuvable" noindex />
      <EmptyState title="Cette page n'existe pas" text="L'adresse est peut-être erronée ou la page a été supprimée.">
        <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
      </EmptyState>
    </div>
  );
}
