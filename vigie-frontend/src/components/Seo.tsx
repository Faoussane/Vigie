import { useEffect } from "react";

const SITE = "Vigie";

interface Props {
  title: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article" | "profile";
  jsonLd?: object;
  noindex?: boolean;
  publishedTime?: string | null;
  modifiedTime?: string | null;
}

/**
 * Métadonnées SEO côté client (React 19 remonte <title>, <meta>, <link> dans <head>).
 * Le serveur Django injecte les mêmes balises dans le HTML initial pour les robots
 * (voir backend docs/SEO.md) ; ce composant garde l'onglet et les partages à jour
 * pendant la navigation.
 */
export default function Seo({ title, description, path, image, type = "website", jsonLd, noindex, publishedTime, modifiedTime }: Props) {
  const full = title === SITE ? SITE : `${title} — ${SITE}`;
  const url = `${window.location.origin}${path ?? window.location.pathname}`;
  useEffect(() => { document.title = full; }, [full]);

  return (
    <>
      <title>{full}</title>
      {description && <meta name="description" content={description.slice(0, 160)} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex" />}
      <meta property="og:title" content={full} />
      {description && <meta property="og:description" content={description.slice(0, 160)} />}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      )}
    </>
  );
}
