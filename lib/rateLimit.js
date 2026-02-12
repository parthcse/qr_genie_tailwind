/**
 * Simple in-memory rate limit for redirect endpoint.
 * In production, replace with Redis or similar for multi-instance consistency.
 * @param {string} key - Identifier (e.g. IP or ipHash)
 * @param {number} windowMs - Window in milliseconds
 * @param {number} max - Max requests per window
 * @returns {boolean} true if allowed, false if rate limited
 */
const store = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_PER_WINDOW = 120;  // 120 requests per minute per IP

function isRateLimited(key, windowMs = WINDOW_MS, max = MAX_PER_WINDOW) {
  if (!key) return false;
  const now = Date.now();
  let entry = store.get(key);
  if (!entry) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return false;
  }
  if (now >= entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + windowMs;
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

// Optional: periodic cleanup of old keys to avoid memory growth
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now >= v.resetAt) store.delete(k);
  }
}, 5 * 60 * 1000); // every 5 minutes

module.exports = { isRateLimited };
