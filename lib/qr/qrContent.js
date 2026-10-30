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

// A store link must be on the store's own address
function cleanStoreUrl(value, hosts, storeName) {
  const url = cleanUrl(value);
  if (url === null) return { error: `The ${storeName} link isn't a valid web address.` };
  if (url && !hosts.includes(new URL(url).hostname.toLowerCase())) return { error: `Paste the app's ${storeName} link (${hosts[0]}/…).` };
  return { url };
}

// "YYYY-MM-DD" from a date field; "" when empty, null when not a real date
function cleanDate(value) {
  const raw = cleanText(value, 10);
  if (!raw) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw ? null : raw;
}

/**
 * Whether an offer's last day is over. Generous on purpose: it ends once that day is over everywhere in the world
 * (the end of the day plus 14 hours in UTC), so nobody sees "ended" while it's still that day where they are.
 */
export const offerEnded = (validUntil, now = Date.now()) =>
  !!validUntil && now > Date.parse(`${validUntil}T23:59:59Z`) + 14 * 60 * 60 * 1000;

RULES.coupon = {
  empty: () => ({ brand: "", avatar: null, headline: "", description: "", code: "", validUntil: "", terms: "", buttonText: "", buttonUrl: "", theme: "sunset" }),
  normalize(input) {
    const headline = cleanText(input.headline, 80);
    if (!headline) return { error: "Add the offer, e.g. 20% off your next order." };
    const avatar = cleanImage(input.avatar);
    if (avatar === undefined) return { error: `The logo must be an image of ${MAX_IMAGE_LABEL} or less.` };
    const validUntil = cleanDate(input.validUntil);
    if (validUntil === null) return { error: "The end date isn't a valid date." };
    const buttonUrl = cleanUrl(input.buttonUrl);
    if (buttonUrl === null) return { error: "The button's link isn't a valid web address." };
    const buttonText = cleanText(input.buttonText, 30);
    return {
      content: {
        brand: cleanText(input.brand, 60),
        avatar,
        headline,
        description: cleanMultiline(input.description, 300),
        code: cleanText(input.code, 40).replace(/\s+/g, " "),
        validUntil,
        terms: cleanMultiline(input.terms, 500),
        buttonText: buttonUrl ? buttonText || "Use the offer" : "",
        buttonUrl,
        theme: cleanTheme(input.theme),
      },
    };
  },
  title: (content) => content.headline,
  summary: (content) => [content.code && `Code ${content.code}`, content.validUntil && `until ${content.validUntil}`].filter(Boolean).join(", "),
};

RULES.apps = {
  empty: () => ({ appName: "", avatar: null, description: "", ios: "", android: "", website: "", theme: "midnight" }),
  normalize(input) {
    const appName = cleanText(input.appName, 60);
    if (!appName) return { error: "Add your app's name." };
    const avatar = cleanImage(input.avatar);
    if (avatar === undefined) return { error: `The app icon must be an image of ${MAX_IMAGE_LABEL} or less.` };
    const ios = cleanStoreUrl(input.ios, ["apps.apple.com", "itunes.apple.com"], "App Store");
    if (ios.error) return { error: ios.error };
    const android = cleanStoreUrl(input.android, ["play.google.com"], "Google Play");
    if (android.error) return { error: android.error };
    if (!ios.url && !android.url) return { error: "Add your App Store link, your Google Play link or both." };
    const website = cleanUrl(input.website);
    if (website === null) return { error: "The website isn't a valid web address." };
    return {
      content: { appName, avatar, description: cleanMultiline(input.description, 300), ios: ios.url, android: android.url, website, theme: cleanTheme(input.theme) },
    };
  },
  // iPhones go straight to the App Store and Android phones to Google Play; everyone else sees the page
  redirect(content, userAgent = "") {
    if (content.ios && /iPhone|iPad|iPod/i.test(userAgent)) return content.ios;
    if (content.android && /Android/i.test(userAgent)) return content.android;
    return null;
  },
  title: (content) => content.appName,
  summary: (content) => [content.ios && "App Store", content.android && "Google Play"].filter(Boolean).join(" and "),
};

/**
 * A YouTube or Vimeo link as { provider, videoId, hash, url } (url: the video's own page), or null when it's neither.
 * Accepts watch, short, embed, live and share links; Vimeo private links keep their hash.
 */
export function parseVideoUrl(value) {
  const url = cleanUrl(value);
  if (!url) return null;
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase().replace(/^(www|m)\./, "");
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (["youtube.com", "youtube-nocookie.com", "youtu.be"].includes(host)) {
    const id = host === "youtu.be" ? parts[0] : ["shorts", "embed", "live", "v"].includes(parts[0]) ? parts[1] : parsed.searchParams.get("v");
    return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? { provider: "youtube", videoId: id, hash: "", url: `https://www.youtube.com/watch?v=${id}` } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const index = parts.findIndex((part) => /^\d{5,12}$/.test(part));
    if (index < 0) return null;
    const hash = parsed.searchParams.get("h") || (/^[a-f0-9]{6,20}$/i.test(parts[index + 1] || "") ? parts[index + 1] : "");
    const id = parts[index];
    return { provider: "vimeo", videoId: id, hash, url: `https://vimeo.com/${id}${hash ? `/${hash}` : ""}` };
  }
  return null;
}

/** Where the player is loaded from once the visitor taps play (both allowed in the CSP's frame-src) */
export function videoEmbedUrl({ provider, videoId, hash }) {
  return provider === "vimeo"
    ? `https://player.vimeo.com/video/${videoId}?autoplay=1&dnt=1${hash ? `&h=${hash}` : ""}`
    : `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
}

RULES.video = {
  empty: () => ({ title: "", description: "", videoUrl: "", buttonText: "", buttonUrl: "", theme: "midnight" }),
  normalize(input) {
    // The form sends the pasted link (videoUrl); saved content has the parsed video (video)
    const video = parseVideoUrl(typeof input.videoUrl === "string" ? input.videoUrl : input.video?.url);
    if (!video) return { error: "Paste a YouTube or Vimeo video link." };
    const buttonUrl = cleanUrl(input.buttonUrl);
    if (buttonUrl === null) return { error: "The button's link isn't a valid web address." };
    return {
      content: {
        title: cleanText(input.title, 100),
        description: cleanMultiline(input.description, 500),
        video,
        buttonText: buttonUrl ? cleanText(input.buttonText, 30) || "Learn more" : "",
        buttonUrl,
        theme: cleanTheme(input.theme),
      },
    };
  },
  toForm: (content) => ({ ...content, videoUrl: content.video?.url || "" }),
  summary: (content) => (content.video?.provider === "vimeo" ? "Vimeo video" : "YouTube video"),
};

export const MAX_MENU_SECTIONS = 20;
export const MAX_MENU_ITEMS = 200;

RULES.menu = {
  empty: () => ({
    venueName: "",
    avatar: null,
    description: "",
    sections: [{ title: "", items: [{ name: "", description: "", price: "" }] }],
    notes: "",
    theme: "sand",
  }),
  normalize(input) {
    const venueName = cleanText(input.venueName, 80);
    if (!venueName) return { error: "Add the name of your restaurant or café." };
    const avatar = cleanImage(input.avatar);
    if (avatar === undefined) return { error: `The logo must be an image of ${MAX_IMAGE_LABEL} or less.` };

    const sections = [];
    let itemCount = 0;
    for (const raw of Array.isArray(input.sections) ? input.sections.slice(0, MAX_MENU_SECTIONS) : []) {
      const items = [];
      for (const item of Array.isArray(raw?.items) ? raw.items : []) {
        const name = cleanText(item?.name, 80);
        const description = cleanMultiline(item?.description, 200);
        const price = cleanText(item?.price, 20);
        if (!name && !description && !price) continue; // a blank row is left out
        if (!name) return { error: "Give every dish a name." };
        if (++itemCount > MAX_MENU_ITEMS) return { error: `A menu can have up to ${MAX_MENU_ITEMS} dishes.` };
        items.push({ name, description, price });
      }
      const title = cleanText(raw?.title, 60);
      if (items.length > 0) sections.push({ title, items });
    }
    if (itemCount === 0) return { error: "Add at least one dish." };

    return {
      content: { venueName, avatar, description: cleanMultiline(input.description, 300), sections, notes: cleanMultiline(input.notes, 300), theme: cleanTheme(input.theme) },
    };
  },
  title: (content) => content.venueName,
  summary: (content) => {
    const dishes = content.sections.reduce((sum, section) => sum + section.items.length, 0);
    return `${dishes} ${dishes === 1 ? "dish" : "dishes"}`;
  },
};

/** For types that send some phones straight on (App download): the address for this visitor, or null to show the page */
export const contentRedirect = (type, content, userAgent) => (RULES[type]?.redirect ? RULES[type].redirect(content, userAgent) : null);

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
