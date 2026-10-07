// Site-wide facts shown to users. Safe to import from pages and components.
export const SUPPORT_EMAIL = "info@qr-genie.co";

// Public site address without a trailing slash, for absolute links (sign-up QR codes, share links)
export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://qr-genie.co").replace(/\/$/, "");

// Topics offered on the contact form; the value is stored with each message
export const CONTACT_TOPICS = [
  { value: "general", label: "General question" },
  { value: "billing", label: "Billing or subscription" },
  { value: "cancel", label: "Cancel my subscription" },
  { value: "refund", label: "Refund request" },
  { value: "technical", label: "Something isn't working" },
  { value: "privacy", label: "My data and privacy" },
];

// What the free trial includes: shown on the landing page and billing page pricing cards
export const TRIAL_PLAN_FEATURES = [
  "14-day full access",
  "Create up to 2 QR codes",
  "All QR code types",
  "Dynamic link updates",
  "Basic analytics",
  "Email support",
];

// What the Basic Package includes: shown on the landing page and billing page pricing cards and in the
// plan-activated email
export const BASIC_PLAN_FEATURES = [
  "Unlimited QR codes",
  "All QR code types",
  "Dynamic link updates",
  "Basic analytics",
  "Email support",
  "Cancel anytime",
];

// Optional answers when a customer cancels the Basic Package (billing page); the label is stored with the cancellation
export const CANCEL_REASONS = [
  { value: "too_expensive", label: "It's too expensive" },
  { value: "not_using", label: "I'm not using it enough" },
  { value: "missing_feature", label: "It's missing something I need" },
  { value: "switching", label: "I'm moving to another service" },
  { value: "short_term", label: "I only needed it for a short time" },
  { value: "other", label: "Something else" },
];

export const LEGAL_LAST_UPDATED = "7 October 2026";
