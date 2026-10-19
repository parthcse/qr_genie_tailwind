import { SITE_URL } from "@/lib/site";

/**
 * /robots.txt for search engines. Keeps crawlers out of the API, the signed-in app, one-time links from emails and
 * the QR scan pages (/r/…), where a crawler visit would also count as a scan. The sitemap lists the public pages.
 */
const DISALLOW = ["/api/", "/dashboard", "/admin", "/r/", "/auth/verify-email", "/auth/reset-password", "/auth/logout"];

export async function getServerSideProps({ res }) {
  const body = ["User-agent: *", "Allow: /", ...DISALLOW.map((path) => `Disallow: ${path}`), "", `Sitemap: ${SITE_URL}/sitemap.xml`, ""].join("\n");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(body);
  return { props: {} };
}

export default function RobotsTxt() {
  return null;
}
