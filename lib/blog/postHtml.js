// Turns the HTML WordPress returns into what the blog pages show. Server only (getStaticProps): sanitize-html stays
// out of the browser bundle.
import sanitizeHtml from "sanitize-html";
import { SITE_URL } from "@/lib/site";

const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  laquo: "«",
  raquo: "»",
  middot: "·",
  bull: "•",
  times: "×",
  copy: "©",
  reg: "®",
  trade: "™",
};

/** WordPress sends titles and excerpts with HTML entities ("Caf&eacute;", "&#8217;"); React needs the characters */
export function decodeEntities(text) {
  return String(text || "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] === "#") {
      const point = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** The words of an HTML fragment as one line of text (blocks and line breaks become spaces) */
export function plainText(html) {
  const spaced = String(html || "").replace(/<br\s*\/?>|<\/(p|div|h[1-6]|li|blockquote|figcaption|td|th|tr|pre)>/gi, " ");
  const text = sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} });
  return decodeEntities(text).replace(/\s+/g, " ").trim();
}

/** A post's excerpt as text, without WordPress's "[…]" ending for excerpts it cut itself */
export function excerptText(html) {
  return plainText(html)
    .replace(/[\s.]*\[(…|\.\.\.)\]\s*$/, "…")
    .replace(/\s*(Continue reading|Read more).*$/i, "");
}

/** Reading time in minutes, at about 220 words a minute */
export function readingMinutes(html) {
  const words = plainText(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Search result text: the first sentence or two, at most `max` characters, cut at a word */
export function shortDescription(text, max = 158) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.–—-]+$/, "")}…`;
}

function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

// Addresses of this site, whichever environment shows the post: links to them become paths ("/pricing")
const SITE_HOSTS = new Set([new URL(SITE_URL).host, "qr-genie.co", "www.qr-genie.co"]);

// Video players the site's Content Security Policy lets in (frame-src in next.config.js); other embeds are dropped
const IFRAME_HOSTS = ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"];

/**
 * Where a link in a post should go. Links to the WordPress site itself point at the blog here instead (a post at
 * /blog/<slug>, a category at /blog?category=<slug>, the home page at /blog); uploaded files stay on WordPress. Links
 * to qr-genie.co become paths, so they stay on the site; links to other sites open in a new tab. null: not a link we
 * keep (javascript:, data: and the like).
 */
function postLink(href, wordpressOrigin) {
  if (!href) return null;
  if (href.startsWith("#") || /^\/(?!\/)/.test(href) || /^(mailto|tel):/i.test(href)) return { href };
  if (!/^https?:\/\//i.test(href)) return null;
  let url;
  try {
    url = new URL(href);
  } catch {
    return { href };
  }
  if (url.origin === wordpressOrigin && !url.pathname.startsWith("/wp-")) {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "category" && parts[1]) return { href: `/blog?category=${encodeURIComponent(parts[parts.length - 1])}` };
    if (!parts.length || ["tag", "author", "page", "feed"].includes(parts[0])) return { href: "/blog" };
    return { href: `/blog/${parts[parts.length - 1]}${url.hash}` };
  }
  if (SITE_HOSTS.has(url.host)) return { href: `${url.pathname}${url.search}${url.hash}` };
  return { href, target: "_blank", rel: "noopener noreferrer" };
}

/**
 * Cleans a post's HTML for the article page: only ordinary text, list, quote, table, image and figure markup and the
 * WordPress block classes the blog styles (styles/globals.css, .blog-content), no scripts, inline styles or forms;
 * h1 becomes h2 (the page has its own h1). YouTube embeds use youtube-nocookie.com. Headings get ids for the
 * "On this page" list, returned as headings: [{ id, text, level }] (h2 and h3).
 */
export function cleanPostHtml(html, wordpressOrigin) {
  const clean = sanitizeHtml(html || "", {
    allowedTags: [
      "p", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "del", "ins", "mark", "small", "sub", "sup",
      "abbr", "cite", "q", "code", "kbd", "pre", "blockquote", "a", "ul", "ol", "li", "dl", "dt", "dd", "figure",
      "figcaption", "img", "table", "caption", "thead", "tbody", "tfoot", "tr", "th", "td", "hr", "br", "div", "span",
      "iframe", "details", "summary",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding"],
      iframe: ["src", "title", "width", "height", "allow", "allowfullscreen", "loading", "referrerpolicy"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
      ol: ["start", "reversed"],
      abbr: ["title"],
      h2: ["id"],
      h3: ["id"],
      h4: ["id"],
      "*": ["class"],
    },
    allowedClasses: {
      "*": ["align*", "has-text-align-*", "has-drop-cap", "wp-block-*", "wp-element-*", "wp-embed-aspect-*", "is-*", "size-*", "btn-shine"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    allowedIframeHostnames: IFRAME_HOSTS,
    transformTags: {
      h1: "h2",
      a: (tagName, attribs) => {
        const { target, rel, ...rest } = attribs;
        const link = postLink(attribs.href, wordpressOrigin);
        // A link we don't keep stays as plain text
        if (!link) return { tagName: "span", attribs: {} };
        // WordPress button blocks get the site's button light sweep
        if (/\bwp-block-button__link\b/.test(rest.class || "")) rest.class = `${rest.class} btn-shine`;
        return { tagName, attribs: { ...rest, ...link } };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy", decoding: "async" } }),
      iframe: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          src: (attribs.src || "").replace(/^https:\/\/(www\.)?youtube\.com\/embed\//, "https://www.youtube-nocookie.com/embed/"),
          title: attribs.title || "Embedded video",
          loading: "lazy",
          referrerpolicy: "strict-origin-when-cross-origin",
        },
      }),
    },
    // Empty paragraphs WordPress leaves for spacing, and embeds from other sites (their address was just removed)
    exclusiveFilter: (frame) =>
      (frame.tag === "p" && !frame.text.replace(/&nbsp;| /g, "").trim() && !frame.mediaChildren?.length) ||
      (frame.tag === "iframe" && !frame.attribs.src),
  });

  const used = new Set();
  const headings = [];
  const withIds = clean.replace(/<h([234])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/g, (match, level, attrs, inner) => {
    const text = plainText(inner);
    if (!text) return match;
    const base = attrs.match(/\sid="([^"]+)"/)?.[1] || slugify(text) || `section-${headings.length + 1}`;
    let id = base;
    for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
    used.add(id);
    if (level !== "4") headings.push({ id, text, level: Number(level) });
    return `<h${level} id="${id}"${attrs.replace(/\sid="[^"]*"/, "")}>${inner}</h${level}>`;
  });

  // Wide tables scroll sideways on phones instead of stretching the page
  const withTables = withIds.replace(/<table/g, '<div class="blog-table"><table').replace(/<\/table>/g, "</table></div>");
  return { html: withTables, headings };
}
