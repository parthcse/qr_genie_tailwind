/**
 * Validates that a URL is safe for redirect (prevents open-redirect abuse).
 * Allows only http:// and https://; rejects javascript:, data:, relative URLs, etc.
 * @param {string} url - Raw target URL
 * @returns {{ valid: boolean, url?: string, error?: string }}
 */
function validateRedirectUrl(url) {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "Missing or invalid URL" };
  }
  let trimmed = url.trim();
  if (!trimmed) return { valid: false, error: "Empty URL" };

  // Only allow http and https
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:") || lower.startsWith("file:")) {
    return { valid: false, error: "URL scheme not allowed" };
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = "https://" + trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, error: "Only http and https are allowed" };
    }
    return { valid: true, url: parsed.href };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

module.exports = { validateRedirectUrl };
