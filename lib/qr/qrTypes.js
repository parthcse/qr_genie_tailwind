/**
 * Every QR code type: what it does and how a scan is handled. Shared by the browser and the server; icons and colours
 * are in components/qr/qrTypeVisuals.js, the form fields in lib/qr/qrSchemas.js and the content rules in
 * lib/qr/qrContent.js.
 *
 * kind:
 *   "redirect" - the short link forwards the scanner to an address made from the content (website, WhatsApp, ...)
 *   "page"     - the short link shows a mobile page QR-Genie hosts, built from the content (list of links, ...)
 *   "static"   - the content is printed into the code itself (WiFi)
 * name: how sentences on the site call it ("Choose from website, list of links and Wi-Fi codes").
 * released: offered on the create page and accepted by the API. isNew: marked "New" on the create page.
 */
export const QR_TYPES = [
  { id: "website", label: "Website", name: "website", description: "Open any web page", hint: "Editable link, scan stats, optional password", category: "links", kind: "redirect", released: true },
  { id: "links", label: "List of links", name: "list of links", description: "One page with all your links", hint: "Your photo, a title and up to 20 buttons", category: "links", kind: "page", released: true, isNew: true },
  { id: "wifi", label: "WiFi", name: "Wi-Fi", description: "Join a Wi-Fi network in one scan", hint: "No typing passwords", category: "links", kind: "static", released: true },
  { id: "whatsapp", label: "WhatsApp", name: "WhatsApp", description: "Start a WhatsApp chat with you", hint: "Optional pre-filled message", category: "social", kind: "redirect", released: true },
  { id: "instagram", label: "Instagram", name: "Instagram", description: "Open your Instagram profile", hint: "Grow your followers", category: "social", kind: "redirect", released: true },
  { id: "social", label: "Social media", name: "social media", description: "All your social profiles on one page", hint: "Instagram, TikTok, YouTube and 15 more", category: "social", kind: "page", released: true, isNew: true },
  { id: "facebook", label: "Facebook", name: "Facebook", description: "Open your Facebook page", hint: "Opens in the Facebook app", category: "social", kind: "redirect", released: true, isNew: true },
  { id: "business", label: "Business", name: "business", description: "Your business on one page: contact, hours, location", hint: "With a Save contact button", category: "business", kind: "page", released: true, isNew: true },
  { id: "vcard", label: "Contact card", name: "contact card (vCard)", description: "Your details, saved to phones in one tap", hint: "A digital business card", category: "business", kind: "page", released: true, isNew: true },
  { id: "coupon", label: "Coupon", name: "coupon", description: "A discount with a code to copy", category: "business", kind: "page", released: false },
  { id: "menu", label: "Menu", name: "menu", description: "Your restaurant menu with prices", category: "business", kind: "page", released: false },
  { id: "apps", label: "App download", name: "app download", description: "The right app store for each phone", category: "business", kind: "page", released: false },
  { id: "video", label: "Video", name: "video", description: "Play a YouTube or Vimeo video", category: "media", kind: "page", released: false },
  { id: "images", label: "Images", name: "images", description: "Show a photo gallery", category: "media", kind: "page", released: false },
  { id: "mp3", label: "MP3", name: "MP3", description: "Play an audio file", category: "media", kind: "page", released: false },
];

/** Groups on the create page, in this order */
export const QR_TYPE_CATEGORIES = [
  { id: "links", label: "Links and pages" },
  { id: "social", label: "Social and chat" },
  { id: "business", label: "Business" },
  { id: "media", label: "Media" },
];

export const qrTypeById = (id) => QR_TYPES.find((type) => type.id === id) || null;
export const isReleasedType = (id) => !!qrTypeById(id)?.released;
export const isPageType = (id) => qrTypeById(id)?.kind === "page";
export const qrTypeLabel = (id) => qrTypeById(id)?.label || "QR code";

/** How many types can be created now */
export const releasedTypeCount = () => QR_TYPES.filter((type) => type.released).length;

/** The released types for a sentence: "website, list of links, Wi-Fi, WhatsApp and Instagram" */
export function releasedTypeNames(conjunction = "and") {
  const names = QR_TYPES.filter((type) => type.released).map((type) => type.name);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} ${conjunction} ${names[names.length - 1]}` : names[0] || "";
}
