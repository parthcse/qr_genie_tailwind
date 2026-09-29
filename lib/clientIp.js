/**
 * Client IP as seen by our Nginx proxy. Nginx sets X-Real-IP from the connection itself and appends the
 * connecting address to X-Forwarded-For, so only those are trusted. Earlier X-Forwarded-For entries and
 * CDN headers (cf-connecting-ip, true-client-ip) come straight from the client and can be forged.
 * If a CDN is ever put in front of Nginx, configure Nginx's real_ip module rather than trusting its headers here.
 */
export function getClientIp(req) {
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }

  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string") {
    const hops = forwardedFor.split(",").map((s) => s.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }

  // Fallback to socket address (direct connection)
  return req.socket?.remoteAddress || null;
}
