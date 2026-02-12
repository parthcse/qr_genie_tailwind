/**
 * Geo lookup from IP. Uses geoip-lite (in-process, fast).
 * Returns nulls on error or unknown IP so redirect is not blocked.
 * @param {string} ip - IPv4 or IPv6 address
 * @returns {{ country: string | null, region: string | null, city: string | null }}
 */
function getGeoFromIp(ip) {
  const out = { country: null, region: null, city: null };
  if (!ip || typeof ip !== "string") return out;
  try {
    const geo = require("geoip-lite").lookup(ip);
    if (!geo) return out;
    out.country = geo.country || null;
    out.region = geo.region || null;
    out.city = geo.city || null;
  } catch (e) {
    console.error("Geo lookup error:", e.message);
  }
  return out;
}

module.exports = { getGeoFromIp };
