/**
 * Example content for the create page's live preview, so people see the whole layout of a hosted page before they've
 * filled anything in: every option, including the optional button or a dummy video. previewContent() puts what's been
 * typed over the example, field by field. Examples never reach a saved page: the server only sees the form.
 */

const LINK = "https://example.com";
const BUTTON = { buttonUrl: LINK, buttonText: "Learn more" };

// A soft drawn landscape, in place of a photo
const scene = (from, to) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><circle cx="600" cy="170" r="70" fill="#fff" fill-opacity=".55"/><path d="M0 460 190 270l150 140 140-110 320 220v80H0Z" fill="#fff" fill-opacity=".28"/><path d="M0 540 240 390l230 140 170-90 160 100v60H0Z" fill="#fff" fill-opacity=".4"/></svg>`
  )}`;

// A month from now, so the example coupon never shows as ended
const inAMonth = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const profile = (platform, handle) => ({ platform, handle, url: LINK });

const SAMPLES = {
  links: () => ({
    title: "Café Aroma",
    description: "Fresh coffee and good company. Everything you need, in one place.",
    avatar: null,
    links: [
      { title: "See our menu", url: LINK },
      { title: "Book a table", url: LINK },
      { title: "Order online", url: LINK },
    ],
  }),
  social: () => ({
    title: "Café Aroma",
    description: "Follow us for new dishes and events.",
    avatar: null,
    profiles: [profile("instagram", "cafearoma"), profile("tiktok", "cafearoma"), profile("youtube", "cafearoma")],
  }),
  vcard: () => ({
    firstName: "Priya",
    lastName: "Sharma",
    avatar: null,
    jobTitle: "Marketing Manager",
    company: "Café Aroma",
    phone: "+91 98765 43210",
    phone2: "",
    email: "priya@cafearoma.com",
    website: "https://cafearoma.com",
    address: "12 MG Road, Pune",
    note: "Happy to help with events and bookings.",
    profiles: [profile("linkedin", "priyasharma")],
  }),
  business: () => ({
    businessName: "Café Aroma",
    avatar: null,
    description: "Speciality coffee and all-day breakfast in the heart of the city.",
    phone: "+91 98765 43210",
    email: "hello@cafearoma.com",
    website: "https://cafearoma.com",
    address: "12 MG Road, Pune",
    hours: { mon: "8:00 – 20:00", tue: "8:00 – 20:00", sat: "9:00 – 22:00", sun: "Closed" },
    profiles: [profile("instagram", "cafearoma")],
  }),
  coupon: () => ({
    brand: "Café Aroma",
    avatar: null,
    headline: "20% off your next order",
    description: "Show this page at the counter or use the code online.",
    code: "AROMA20",
    validUntil: inAMonth(),
    terms: "One use per customer. Can't be combined with other offers.",
    buttonUrl: LINK,
    buttonText: "Use the offer",
  }),
  apps: () => ({
    appName: "Aroma Rewards",
    avatar: null,
    description: "Collect points on every coffee and order ahead.",
    ios: "https://apps.apple.com/app/sample",
    android: "https://play.google.com/store/apps/sample",
    website: "https://cafearoma.com",
  }),
  video: () => ({
    title: "How we roast our coffee",
    description: "Two minutes inside our roastery, from green beans to your cup.",
    videoUrl: "sample",
    ...BUTTON,
  }),
  menu: () => ({
    venueName: "Café Aroma",
    avatar: null,
    description: "All-day breakfast and speciality coffee.",
    sections: [
      {
        title: "Coffee",
        items: [
          { name: "Cappuccino", price: "₹180", description: "Double shot, steamed milk" },
          { name: "Cold brew", price: "₹220", description: "" },
        ],
      },
      {
        title: "Cakes",
        items: [{ name: "Carrot cake", price: "₹160", description: "With cream cheese frosting" }],
      },
    ],
    notes: "Prices include GST. Ask us about allergens.",
  }),
  images: () => ({
    title: "Our summer collection",
    description: "A few favourites from this season.",
    images: [
      { src: scene("#818cf8", "#c084fc") },
      { src: scene("#38bdf8", "#34d399") },
      { src: scene("#fb923c", "#f472b6") },
      { src: scene("#a78bfa", "#60a5fa") },
    ],
    ...BUTTON,
  }),
  mp3: () => ({
    file: { name: "welcome.mp3", size: 3 * 1024 * 1024 },
    title: "Welcome to Café Aroma",
    artist: "Priya Sharma",
    cover: scene("#6366f1", "#ec4899"),
    description: "A short hello from our team.",
    allowDownload: true,
    ...BUTTON,
  }),
  pdf: () => ({
    file: { name: "spring-brochure.pdf", size: 2.4 * 1024 * 1024 },
    title: "Spring brochure",
    cover: null,
    description: "Our new range and prices, ready to read or save.",
    ...BUTTON,
  }),
};

// Fields shown together: an example surname next to a typed first name would be confusing
const LINKED = { vcard: [["firstName", "lastName"]] };

// Whether a form value holds anything yet: blank rows and a social row's preselected platform don't count
function isFilled(value) {
  if (Array.isArray(value)) return value.some(isFilled);
  if (value && typeof value === "object") return Object.entries(value).some(([key, inner]) => key !== "platform" && isFilled(inner));
  return typeof value === "string" ? value.trim() !== "" : !!value;
}

/**
 * The form with examples in every empty field, for the preview. __sample lists those fields, so the page can fade them
 * (Part in components/qr/landing/LandingShell.js).
 */
export function previewContent(type, form) {
  const sample = SAMPLES[type]?.();
  if (!sample) return form;
  const shown = { ...form };
  const __sample = {};
  for (const key of Object.keys(sample)) {
    if (!isFilled(form?.[key])) {
      shown[key] = sample[key];
      __sample[key] = true;
    }
  }
  for (const group of LINKED[type] || []) {
    if (group.some((key) => isFilled(form?.[key]))) {
      for (const key of group) {
        shown[key] = form?.[key] || "";
        delete __sample[key];
      }
    }
  }
  return { ...shown, __sample };
}
