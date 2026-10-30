import Head from "next/head";
import { SITE_URL } from "@/lib/site";

// Branded 1200x630 image shown when a page is shared (WhatsApp, LinkedIn, X, Facebook…)
export const SHARE_IMAGE = { path: "/og-image.png", width: 1200, height: 630, alt: "QR-Genie: dynamic QR code generator with scan tracking" };

/**
 * Search and social tags for a public page: title, description, the canonical address (always on qr-genie.co, so
 * www and other variants count as the same page), Open Graph and Twitter. path: the page's own path, e.g. "/contact".
 * noindex keeps utility pages (password reset, email codes) out of search results.
 * jsonLd: schema.org nodes (see lib/seo.js), written as one JSON-LD block; "<" is escaped so the data can't end the tag.
 * image: { url, width?, height?, alt } to share instead of the branded image (a blog post's picture).
 * type: the Open Graph type, "article" for blog posts. children: more tags for the head (article dates).
 */
export default function SeoMeta({ title, description, path, noindex = false, jsonLd, image, type = "website", children }) {
  const url = `${SITE_URL}${path}`;
  const share = image || { ...SHARE_IMAGE, url: `${SITE_URL}${SHARE_IMAGE.path}` };
  const structuredData = jsonLd?.length ? { "@context": "https://schema.org", "@graph": jsonLd } : null;
  return (
    <Head>
      <title>{title}</title>
      {description && <meta name="description" content={description} key="description" />}
      {noindex ? <meta name="robots" content="noindex" key="robots" /> : <link rel="canonical" href={url} key="canonical" />}
      <meta property="og:site_name" content="QR-Genie" key="og:site_name" />
      <meta property="og:type" content={type} key="og:type" />
      <meta property="og:title" content={title} key="og:title" />
      {description && <meta property="og:description" content={description} key="og:description" />}
      <meta property="og:url" content={url} key="og:url" />
      <meta property="og:image" content={share.url} key="og:image" />
      {share.width && <meta property="og:image:width" content={String(share.width)} key="og:image:width" />}
      {share.height && <meta property="og:image:height" content={String(share.height)} key="og:image:height" />}
      {share.alt && <meta property="og:image:alt" content={share.alt} key="og:image:alt" />}
      <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
      <meta name="twitter:title" content={title} key="twitter:title" />
      {description && <meta name="twitter:description" content={description} key="twitter:description" />}
      <meta name="twitter:image" content={share.url} key="twitter:image" />
      {children}
      {structuredData && (
        <script
          type="application/ld+json"
          key="structured-data"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      )}
    </Head>
  );
}
