import { SITE_URL } from "@/lib/site";

/** /sitemap.xml: the public pages search engines should index. Add new public pages here. */
const PAGES = [
  "/",
  "/pricing",
  "/website-qr-code",
  "/multiple-links-qr-code",
  "/wifi-qr-code",
  "/whatsapp-qr-code",
  "/instagram-qr-code",
  "/restaurant-menu-qr-code",
  "/qr-codes-for-events",
  "/qr-codes-for-real-estate",
  "/qr-codes-for-hotels",
  "/contact",
  "/privacy",
  "/terms",
  "/refund-policy",
];

export async function getServerSideProps({ res }) {
  const urls = PAGES.map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(body);
  return { props: {} };
}

export default function SitemapXml() {
  return null;
}
