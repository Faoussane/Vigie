import Seo from "../components/Seo";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Seo title="À propos" description="Vigie : plateforme de veille technologique." />
      <h1 className="text-4xl font-extrabold">À propos de Vigie</h1>
      <div className="article-body mt-8 !whitespace-normal">
        <p>Dans un navire, la vigie est celle ou celui qui guette l'horizon. Ici, elle surveille les technologies numériques : IA, web, cybersécurité, cloud, DevOps.</p>
        <p className="mt-5">Chaque article cite les sources consultées et la date de consultation. L'intelligence artificielle aide à résumer, classer et repérer les doublons, mais l'auteur garde toujours la décision de publier.</p>
      </div>
    </div>
  );
}
