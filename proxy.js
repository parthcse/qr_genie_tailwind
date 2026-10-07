import { NextResponse } from "next/server";

/**
 * Cross-site request forgery guard for the JSON API, on top of the SameSite=Lax login cookie.
 * Runs before every /api request (Next.js "proxy", formerly middleware):
 * - A request that changes something (POST, PUT, PATCH, DELETE) coming from another website is refused. Browsers
 *   always say where such a request comes from (Origin, else Referer); "null" (sandboxed frames) counts as foreign.
 *   Requests without either come from servers and scripts, which don't carry a visitor's cookie.
 * - Bodies a plain HTML form can send cross-site (text/plain, form-encoded, multipart) are refused: the site only
 *   ever sends JSON, which a browser won't send to another site without that site's permission.
 * Razorpay webhooks are left alone: they come from Razorpay's servers and are checked by their signature.
 */

const CHANGES = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const FORM_TYPES = ["text/plain", "application/x-www-form-urlencoded", "multipart/form-data"];

function siteHost() {
  try {
    return new URL(process.env.NEXT_PUBLIC_BASE_URL || "").host;
  } catch {
    return "";
  }
}

function sourceHost(request) {
  const source = request.headers.get("origin") || request.headers.get("referer");
  if (!source) return undefined; // not sent: a server or script, not a browser page
  if (source === "null") return null;
  try {
    return new URL(source).host;
  } catch {
    return null;
  }
}

const refuse = (message) => NextResponse.json({ error: message }, { status: 403 });

export function proxy(request) {
  if (!CHANGES.has(request.method) || request.nextUrl.pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  const from = sourceHost(request);
  if (from !== undefined) {
    const allowed = new Set([request.headers.get("host"), siteHost()].filter(Boolean));
    if (!from || !allowed.has(from)) return refuse("This request came from another website and was blocked.");
  }

  const type = (request.headers.get("content-type") || "").toLowerCase();
  if (FORM_TYPES.some((t) => type.startsWith(t))) return refuse("Send this request as JSON.");

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
