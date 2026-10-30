import { SITE_URL } from "@/lib/site";
import { getBlogSitemapEntries } from "@/lib/blog/wordpress";

/**
 * /sitemap.xml: the public pages search engines should index, then every blog article (read from WordPress, with the
 * date it last changed). Add new public pages here.
 */
const PAGES = [
  "/",
  "/pricing",
  "/qr-code-types",
  "/website-qr-code",
  "/multiple-links-qr-code",
  "/wifi-qr-code",
  "/whatsapp-qr-code",
  "/instagram-qr-code",
  "/restaurant-menu-qr-code",
  "/qr-codes-for-events",
  "/qr-codes-for-real-estate",
  "/qr-codes-for-hotels",
  "/blog",
  "/contact",
  "/privacy",
  "/terms",
  "/refund-policy",
];

const xmlEscape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export async function getServerSideProps({ res }) {
  // Without WordPress the sitemap still lists the site's own pages
  const posts = await getBlogSitemapEntries().catch((error) => {
    console.error(`Sitemap: blog articles left out, WordPress could not be read (${error.message})`);
    return [];
  });
  const urls = [
    ...PAGES.map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`),
    ...posts.map(
      (post) => `  <url><loc>${xmlEscape(`${SITE_URL}${post.path}`)}</loc>${post.updatedAt ? `<lastmod>${post.updatedAt}</lastmod>` : ""}</url>`
    ),
  ].join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(body);
  return { props: {} };
}

export default function SitemapXml() {
  return null;
}
