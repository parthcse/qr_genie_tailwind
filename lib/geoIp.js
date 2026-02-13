/**
 * Geo lookup from IP. Uses geoip-lite (in-process, fast).
 * Returns nulls on error or unknown IP so redirect is not blocked.
 * @param {string} ip - IPv4 or IPv6 address
 * @returns {{ country: string | null, region: string | null, city: string | null }}
 */
function getGeoFromIp(ip) {
  const out = { country: null, region: null, city: null };
  if (!ip || typeof ip !== "string") {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[GeoIP] No IP provided for geo lookup");
    }
    return out;
  }
  
  // Skip localhost/private IPs
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.16.")) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[GeoIP] Skipping geo lookup for private/local IP: ${ip}`);
    }
    return out;
  }
  
  try {
    const geo = require("geoip-lite").lookup(ip);
    if (!geo) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[GeoIP] No geo data found for IP: ${ip}`);
      }
      return out;
    }
    out.country = geo.country || null;
    out.region = geo.region || null;
    out.city = geo.city || null;
    
    if (process.env.NODE_ENV !== "production" && (!out.country || !out.city)) {
      console.log(`[GeoIP] Partial data for ${ip}:`, out);
    }
  } catch (e) {
    console.error("[GeoIP] Lookup error:", e.message);
  }
  return out;
}

module.exports = { getGeoFromIp };
