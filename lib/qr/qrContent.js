/**
 * Content rules for the QR types that keep their content with QR-Genie ("page" types in lib/qr/qrTypes.js): what an
 * empty form starts with, how the content is cleaned and checked, and a one-line summary for lists. Shared by the
 * browser (the create page shows the same message the server would give) and the server, which always re-checks.
 * The cleaned content is saved as meta.content on the QR code and is the only thing the hosted page shows.
 */
import { validateRedirectUrl } from "./redirectValidation";
import { MAX_IMAGE_DATA_URL_LENGTH, MAX_IMAGE_LABEL } from "./imageUpload";
import { LANDING_THEMES, DEFAULT_LANDING_THEME } from "./landingThemes";
import { socialProfileLink } from "./socialPlatforms";

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

// "" when empty, null when not a phone number (digits, spaces, + ( ) . -; 5 to 20 digits)
function cleanPhone(value) {
  const raw = cleanText(value, 30);
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  return /^\+?[\d\s().-]+$/.test(raw) && digits.length >= 5 && digits.length <= 20 ? raw : null;
}

// "" when empty, null when not an email address
function cleanEmail(value) {
  const raw = cleanText(value, 120);
  if (!raw) return "";
  return /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(raw) ? raw : null;
}

/** tel: and mailto: links, built from cleaned values only */
export const telLink = (phone) => `tel:${phone.replace(/[^\d+]/g, "")}`;
export const mailLink = (email) => `mailto:${email}`;
/** Google Maps search for an address; opens in the maps app on phones */
export const mapsLink = (address) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.replace(/\s+/g, " "))}`;

// Social profiles shown on a page: { profiles } or { error }; blank rows are left out (shared by several types)
function normalizeProfiles(rows, max) {
  const profiles = [];
  for (const row of Array.isArray(rows) ? rows.slice(0, max) : []) {
    // The form sends what was typed (value); saved content has the username or link it was turned into
    const typed = typeof row?.value === "string" ? row.value : row?.handle || row?.url || "";
    const link = socialProfileLink(row?.platform, typed);
    if (link.error) return { error: link.error };
    if (link.url) profiles.push({ platform: row.platform, handle: link.handle, url: link.url });
  }
  return { profiles };
}
// Saved profiles back into what the form shows: "@username", "+91…" or the link
const profilesToForm = (profiles) =>
  (profiles || []).map((p) => ({ platform: p.platform, value: p.handle ? (p.platform === "whatsapp" ? p.handle : `@${p.handle}`) : p.url }));

export const WEEK_DAYS = [
  { id: "mon", label: "Monday" },
  { id: "tue", label: "Tuesday" },
  { id: "wed", label: "Wednesday" },
  { id: "thu", label: "Thursday" },
  { id: "fri", label: "Friday" },
  { id: "sat", label: "Saturday" },
  { id: "sun", label: "Sunday" },
];
// Opening hours: free text per day ("9:00 – 18:00", "Closed"); {} when none are filled in
function cleanHours(hours) {
  const out = {};
  for (const day of WEEK_DAYS) {
    const text = cleanText(hours?.[day.id], 40);
    if (text) out[day.id] = text;
  }
  return out;
}

// Phone, email, website and address shared by Contact card and Business: { contact } or { error }
function normalizeContactDetails(input) {
  const phone = cleanPhone(input.phone);
  if (phone === null) return { error: "The phone number doesn't look right. Use digits, with the country code if you like." };
  const phone2 = cleanPhone(input.phone2);
  if (phone2 === null) return { error: "The second phone number doesn't look right." };
  const email = cleanEmail(input.email);
  if (email === null) return { error: "The email address doesn't look right." };
  const website = cleanUrl(input.website);
  if (website === null) return { error: "The website isn't a valid web address." };
  return { contact: { phone, phone2, email, website, address: cleanMultiline(input.address, 200) } };
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

  social: {
    empty: () => ({ title: "", description: "", avatar: null, theme: DEFAULT_LANDING_THEME, profiles: [{ platform: "instagram", value: "" }] }),
    normalize(input) {
      const title = cleanText(input.title, 80);
      if (!title) return { error: "Add your name or brand." };
      const avatar = cleanImage(input.avatar);
      if (avatar === undefined) return { error: `The photo must be an image of ${MAX_IMAGE_LABEL} or less.` };

      const { profiles, error } = normalizeProfiles(input.profiles, MAX_LINKS);
      if (error) return { error };
      if (profiles.length === 0) return { error: "Add at least one profile: a username or a link." };

      return { content: { title, description: cleanMultiline(input.description, 300), avatar, theme: cleanTheme(input.theme), profiles } };
    },
    toForm: (content) => ({ ...content, profiles: profilesToForm(content.profiles) }),
    summary: (content) => `${content.profiles.length} ${content.profiles.length === 1 ? "profile" : "profiles"}`,
  },

  // Contact card: a person's details with "Save contact" (lib/qr/vcard.js)
  vcard: {
    empty: () => ({
      firstName: "",
      lastName: "",
      avatar: null,
      jobTitle: "",
      company: "",
      phone: "",
      phone2: "",
      email: "",
      website: "",
      address: "",
      note: "",
      theme: DEFAULT_LANDING_THEME,
      profiles: [{ platform: "linkedin", value: "" }],
    }),
    normalize(input) {
      const firstName = cleanText(input.firstName, 50);
      const lastName = cleanText(input.lastName, 50);
      if (!firstName && !lastName) return { error: "Add your first or last name." };
      const avatar = cleanImage(input.avatar);
      if (avatar === undefined) return { error: `The photo must be an image of ${MAX_IMAGE_LABEL} or less.` };
      const { contact, error } = normalizeContactDetails(input);
      if (error) return { error };
      if (!contact.phone && !contact.email && !contact.website) return { error: "Add at least a phone number, an email address or a website." };
      const social = normalizeProfiles(input.profiles, 10);
      if (social.error) return { error: social.error };
      return {
        content: {
          firstName,
          lastName,
          avatar,
          jobTitle: cleanText(input.jobTitle, 80),
          company: cleanText(input.company, 80),
          ...contact,
          note: cleanMultiline(input.note, 300),
          theme: cleanTheme(input.theme),
          profiles: social.profiles,
        },
      };
    },
    toForm: (content) => ({ ...content, profiles: profilesToForm(content.profiles) }),
    title: (content) => [content.firstName, content.lastName].filter(Boolean).join(" "),
    summary: (content) => [content.jobTitle, content.company].filter(Boolean).join(", "),
  },

  // Business: name, contact details, opening hours and location, with "Save contact"
  business: {
    empty: () => ({
      businessName: "",
      avatar: null,
      description: "",
      phone: "",
      email: "",
      website: "",
      address: "",
      hours: {},
      theme: DEFAULT_LANDING_THEME,
      profiles: [{ platform: "instagram", value: "" }],
    }),
    normalize(input) {
      // "businessName", not "name": the form keeps a field called name for the code's private name
      const businessName = cleanText(input.businessName, 80);
      if (!businessName) return { error: "Add your business name." };
      const avatar = cleanImage(input.avatar);
      if (avatar === undefined) return { error: `The logo must be an image of ${MAX_IMAGE_LABEL} or less.` };
      const { contact, error } = normalizeContactDetails(input);
      if (error) return { error };
      if (!contact.phone && !contact.email && !contact.website && !contact.address) {
        return { error: "Add at least one way to reach you: a phone number, email, website or address." };
      }
      const social = normalizeProfiles(input.profiles, 10);
      if (social.error) return { error: social.error };
      return {
        content: {
          businessName,
          avatar,
          description: cleanMultiline(input.description, 500),
          ...contact,
          hours: cleanHours(input.hours),
          theme: cleanTheme(input.theme),
          profiles: social.profiles,
        },
      };
    },
    toForm: (content) => ({ ...content, profiles: profilesToForm(content.profiles) }),
    title: (content) => content.businessName,
    summary: (content) => content.address?.split("\n")[0] || content.phone || content.website || "",
  },
};

/** Saved content as the edit form expects it */
export const contentToForm = (type, content) => (RULES[type]?.toForm ? RULES[type].toForm(content) : content);

export const hasContentRules = (type) => !!RULES[type];

/** A blank form for the type */
export const emptyContent = (type) => RULES[type]?.empty() || {};

/** { content } with the cleaned content, or { error } with a message for the person filling in the form */
export function normalizeContent(type, input) {
  const rules = RULES[type];
  if (!rules) return { error: "This QR code type isn't available yet." };
  return rules.normalize(input && typeof input === "object" && !Array.isArray(input) ? input : {});
}

/** The page's name for lists and the browser tab: its title, business name or person's name */
export function contentTitle(type, content) {
  if (!content) return "";
  return (RULES[type]?.title ? RULES[type].title(content) : content.title) || "";
}

/** Short description for lists, e.g. "4 links" */
export function contentSummary(type, content) {
  try {
    return content ? RULES[type]?.summary(content) || "" : "";
  } catch {
    return "";
  }
}
