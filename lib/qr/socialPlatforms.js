/**
 * Social platforms for the Social media page (and Facebook codes): how a profile link is made from what someone
 * types. A username (with or without "@") becomes the platform's profile link; a pasted link is used as it is.
 * Icons and brand colours are in components/qr/landing/brandIcons.js.
 *
 * profile(handle): the link for a username; linkOnly: the platform has no username links, so a link is required.
 * phone: the value is a phone number with its country code (WhatsApp).
 */
import { validateRedirectUrl } from "./redirectValidation";

export const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram", placeholder: "@username or profile link", profile: (h) => `https://www.instagram.com/${h}/` },
  { id: "facebook", label: "Facebook", placeholder: "Page name or link", profile: (h) => `https://www.facebook.com/${h}` },
  { id: "tiktok", label: "TikTok", placeholder: "@username or profile link", profile: (h) => `https://www.tiktok.com/@${h}` },
  { id: "youtube", label: "YouTube", placeholder: "@channel or link", profile: (h) => `https://www.youtube.com/@${h}` },
  { id: "x", label: "X (Twitter)", placeholder: "@username or profile link", profile: (h) => `https://x.com/${h}` },
  { id: "linkedin", label: "LinkedIn", placeholder: "Profile or company page link", profile: (h) => `https://www.linkedin.com/in/${h}` },
  { id: "whatsapp", label: "WhatsApp", placeholder: "Number with country code, e.g. +91 98765 43210", phone: true },
  { id: "telegram", label: "Telegram", placeholder: "@username or link", profile: (h) => `https://t.me/${h}` },
  { id: "threads", label: "Threads", placeholder: "@username or profile link", profile: (h) => `https://www.threads.net/@${h}` },
  { id: "snapchat", label: "Snapchat", placeholder: "Username or link", profile: (h) => `https://www.snapchat.com/add/${h}` },
  { id: "pinterest", label: "Pinterest", placeholder: "Username or profile link", profile: (h) => `https://www.pinterest.com/${h}/` },
  { id: "spotify", label: "Spotify", placeholder: "Link to your artist page or playlist", linkOnly: true },
  { id: "github", label: "GitHub", placeholder: "Username or link", profile: (h) => `https://github.com/${h}` },
  { id: "twitch", label: "Twitch", placeholder: "Channel name or link", profile: (h) => `https://www.twitch.tv/${h}` },
  { id: "discord", label: "Discord", placeholder: "Server invite link", linkOnly: true },
  { id: "behance", label: "Behance", placeholder: "Username or link", profile: (h) => `https://www.behance.net/${h}` },
  { id: "dribbble", label: "Dribbble", placeholder: "Username or link", profile: (h) => `https://dribbble.com/${h}` },
  { id: "website", label: "Website", placeholder: "https://", linkOnly: true },
];

export const socialPlatform = (id) => SOCIAL_PLATFORMS.find((platform) => platform.id === id) || null;

// A domain followed by a path ("instagram.com/cafe") or anything starting with http(s) is a link, not a username
const looksLikeLink = (value) => /^https?:\/\//i.test(value) || /^[a-z0-9-]+(\.[a-z0-9-]+)+\//i.test(value);
const HANDLE = /^[a-z0-9._-]{1,100}$/i;

/**
 * { url, handle } for what was typed for a platform (handle: the username to show, "" for links),
 * { error } when it isn't a usable username, number or link, or {} when it's empty.
 */
export function socialProfileLink(platformId, rawValue) {
  const platform = socialPlatform(platformId);
  const value = typeof rawValue === "string" ? rawValue.trim() : "";
  if (!platform) return { error: "Choose a platform for every profile." };
  if (!value) return {};

  if (platform.phone && !looksLikeLink(value)) {
    const digits = value.replace(/[\s()+.-]/g, "");
    if (!/^\d{6,15}$/.test(digits)) return { error: `Add the ${platform.label} number with its country code, e.g. +91 98765 43210.` };
    return { url: `https://wa.me/${digits}`, handle: `+${digits}` };
  }
  if (looksLikeLink(value) || platform.linkOnly) {
    const checked = validateRedirectUrl(value);
    if (!checked.valid || checked.url.length > 2048 || (platform.linkOnly && !looksLikeLink(value) && !value.includes("."))) {
      return { error: `The ${platform.label} link isn't a valid web address.` };
    }
    return { url: checked.url, handle: "" };
  }
  const handle = value.replace(/^@/, "");
  if (!HANDLE.test(handle)) return { error: `"${value}" isn't a valid ${platform.label} username. Paste the profile link instead.` };
  return { url: platform.profile(handle), handle };
}
