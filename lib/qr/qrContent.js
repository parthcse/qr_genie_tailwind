/**
 * Content rules for the QR types that keep their content with QR-Genie ("page" types in lib/qr/qrTypes.js): what an
 * empty form starts with, how the content is cleaned and checked, and a one-line summary for lists. Shared by the
 * browser (the create page shows the same message the server would give) and the server, which always re-checks.
 * The cleaned content is saved as meta.content on the QR code and is the only thing the hosted page shows.
 */
import { validateRedirectUrl } from "./redirectValidation";
import { MAX_IMAGE_DATA_URL_LENGTH, MAX_IMAGE_LABEL } from "./imageUpload";
import { LANDING_THEMES, DEFAULT_LANDING_THEME } from "./landingThemes";

export const MAX_LINKS = 20;

const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[a-z0-9+/=]+$/i;

const cleanText = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
// Keeps line breaks, but no more than one empty line in a row
const cleanMultiline = (value, max) => cleanText(value, max).replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n");
const cleanTheme = (id) => (LANDING_THEMES.some((theme) => theme.id === id) ? id : DEFAULT_LANDING_THEME);

// null when there's no image, undefined when there is one but it isn't an acceptable image
function cleanImage(value) {
  if (!value) return null;
  return typeof value === "string" && value.length <= MAX_IMAGE_DATA_URL_LENGTH && IMAGE_DATA_URL.test(value) ? value : undefined;
}

// "" when empty, null when not a valid http(s) address
function cleanUrl(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  const checked = validateRedirectUrl(raw);
  return checked.valid && checked.url.length <= 2048 ? checked.url : null;
}

const RULES = {
  links: {
    empty: () => ({ title: "", description: "", avatar: null, theme: DEFAULT_LANDING_THEME, links: [{ title: "", url: "" }] }),
    normalize(input) {
      const title = cleanText(input.title, 80);
      if (!title) return { error: "Add a title for your page." };
      const avatar = cleanImage(input.avatar);
      if (avatar === undefined) return { error: `The photo must be an image of ${MAX_IMAGE_LABEL} or less.` };

      const links = [];
      for (const row of Array.isArray(input.links) ? input.links.slice(0, MAX_LINKS) : []) {
        const linkTitle = cleanText(row?.title, 60);
        const rawUrl = typeof row?.url === "string" ? row.url.trim() : "";
        if (!linkTitle && !rawUrl) continue; // a blank row is simply left out
        if (!linkTitle) return { error: "Give every link a title." };
        if (!rawUrl) return { error: `Add the web address for "${linkTitle}".` };
        const url = cleanUrl(rawUrl);
        if (!url) return { error: `"${linkTitle}" doesn't have a valid web address.` };
        links.push({ title: linkTitle, url });
      }
      if (links.length === 0) return { error: "Add at least one link with a title and a web address." };

      return {
        content: { title, description: cleanMultiline(input.description, 300), avatar, theme: cleanTheme(input.theme), links },
      };
    },
    summary: (content) => `${content.links.length} ${content.links.length === 1 ? "link" : "links"}`,
  },
};

export const hasContentRules = (type) => !!RULES[type];

/** A blank form for the type */
export const emptyContent = (type) => RULES[type]?.empty() || {};

/** { content } with the cleaned content, or { error } with a message for the person filling in the form */
export function normalizeContent(type, input) {
  const rules = RULES[type];
  if (!rules) return { error: "This QR code type isn't available yet." };
  return rules.normalize(input && typeof input === "object" && !Array.isArray(input) ? input : {});
}

/** Short description for lists, e.g. "4 links" */
export function contentSummary(type, content) {
  try {
    return content ? RULES[type]?.summary(content) || "" : "";
  } catch {
    return "";
  }
}
