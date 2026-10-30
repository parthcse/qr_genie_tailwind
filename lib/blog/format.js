// Blog addresses and dates. Plain data, safe to import from pages and components (lib/blog/wordpress.js is server only).
export const BLOG_PATH = "/blog";

export const postPath = (slug) => `${BLOG_PATH}/${slug}`;
export const categoryPath = (slug) => `${BLOG_PATH}?category=${encodeURIComponent(slug)}`;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-10-30" → "30 October 2026", or "30 Oct 2026" with short. Written out by hand so server and browser agree. */
export function formatPostDate(date, { short = false } = {}) {
  const [year, month, day] = String(date || "").split("-").map(Number);
  if (!year || !month || !day) return "";
  const name = MONTHS[month - 1];
  return `${day} ${short ? name.slice(0, 3) : name} ${year}`;
}
