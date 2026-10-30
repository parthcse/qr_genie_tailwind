/**
 * Codes that start an action on the phone: Email, SMS and Phone call are static (the text printed into the code makes
 * the camera open a new email, text or call), Location forwards to Google Maps (a dynamic "redirect" type).
 * Shared by the create page (preview and messages) and pages/api/create-dynamic.js, which checks again.
 * Each returns { payload, meta } (payload: what the code holds or forwards to; meta: what lists show) or { error }.
 */

const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const EMAIL = /^[^\s@<>"?&]+@[^\s@<>"?&]+\.[a-z]{2,}$/i;

// "+919876543210" from what was typed, or null when it isn't a phone number (5 to 20 digits)
function phoneNumber(value) {
  const raw = text(value, 30);
  if (!/^\+?[\d\s().-]+$/.test(raw)) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 5 || digits.length > 20) return null;
  return `${raw.startsWith("+") ? "+" : ""}${digits}`;
}

const ACTIONS = {
  email(input) {
    const to = text(input.to, 120);
    if (!to) return { error: "Add the email address." };
    if (!EMAIL.test(to)) return { error: "The email address doesn't look right." };
    const subject = text(input.subject, 120);
    const body = text(input.body, 500);
    const query = [subject && `subject=${encodeURIComponent(subject)}`, body && `body=${encodeURIComponent(body)}`].filter(Boolean).join("&");
    return { payload: `mailto:${to}${query ? `?${query}` : ""}`, meta: { to, subject } };
  },
  sms(input) {
    const raw = text(input.phone, 30);
    if (!raw) return { error: "Add the phone number to text." };
    const phone = phoneNumber(raw);
    if (!phone) return { error: "The phone number doesn't look right. Use digits, with the country code." };
    const message = text(input.message, 300);
    return { payload: `SMSTO:${phone}:${message}`, meta: { phone, message } };
  },
  phone(input) {
    const raw = text(input.phone, 30);
    if (!raw) return { error: "Add the phone number to call." };
    const phone = phoneNumber(raw);
    if (!phone) return { error: "The phone number doesn't look right. Use digits, with the country code." };
    return { payload: `tel:${phone}`, meta: { phone } };
  },
  location(input) {
    const address = text(input.address, 200).replace(/\s+/g, " ");
    if (!address) return { error: "Add an address, a place name or coordinates." };
    return { payload: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, meta: { address } };
  },
};

export const isActionType = (type) => !!ACTIONS[type];

/** { payload, meta } for the type's form data, or { error } with the message to show */
export function actionPayload(type, input) {
  const build = ACTIONS[type];
  if (!build) return { error: "This QR code type isn't available yet." };
  return build(input && typeof input === "object" && !Array.isArray(input) ? input : {});
}
