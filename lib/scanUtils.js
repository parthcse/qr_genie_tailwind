const crypto = require("crypto");

const IP_HASH_SECRET = process.env.SCAN_IP_HASH_SECRET || "qr-genie-ip-salt";

/**
 * Hash IP for privacy-preserving unique counts. Uses HMAC-SHA256.
 * @param {string} ip - Raw IP address
 * @returns {string | null} Hex hash or null
 */
function hashIp(ip) {
  if (!ip || typeof ip !== "string") return null;
  const trimmed = ip.trim();
  if (!trimmed) return null;
  return crypto.createHmac("sha256", IP_HASH_SECRET).update(trimmed).digest("hex");
}

/**
 * Derive device type from user agent.
 * @param {string} ua - User-Agent string
 * @returns {string} "mobile" | "tablet" | "desktop" | "Unknown"
 */
function getDeviceType(ua = "") {
  const s = ua.toLowerCase();
  if (s.includes("mobile") && !s.includes("ipad")) return "mobile";
  if (s.includes("tablet") || s.includes("ipad")) return "tablet";
  if (s.includes("windows") || s.includes("macintosh") || s.includes("linux") || s.includes("x11")) return "desktop";
  if (s.includes("android") || s.includes("iphone")) return "mobile";
  return "Unknown";
}

/**
 * Simple browser name from user agent.
 * @param {string} ua - User-Agent string
 * @returns {string}
 */
function getBrowser(ua = "") {
  const s = ua.toLowerCase();
  if (s.includes("edg/")) return "Edge";
  if (s.includes("opr/") || s.includes("opera")) return "Opera";
  if (s.includes("chrome")) return "Chrome";
  if (s.includes("safari") && !s.includes("chrome")) return "Safari";
  if (s.includes("firefox")) return "Firefox";
  if (s.includes("msie") || s.includes("trident")) return "IE";
  return "Other";
}

/**
 * OS from user agent (matches existing detectOS style).
 * @param {string} ua - User-Agent string
 * @returns {string}
 */
function getOS(ua = "") {
  const s = ua.toLowerCase();
  if (s.includes("iphone") || s.includes("ipod")) return "iOS";
  if (s.includes("ipad")) return "iPadOS";
  if (s.includes("android")) return "Android";
  if (s.includes("windows")) return "Windows";
  if (s.includes("mac os") || s.includes("macintosh")) return "macOS";
  if (s.includes("linux")) return "Linux";
  return "Other";
}

module.exports = { hashIp, getDeviceType, getBrowser, getOS };
