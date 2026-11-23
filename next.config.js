// Content Security Policy: only our own code plus Razorpay checkout, Cloudflare Turnstile and Google Tag Manager with
// Google Analytics may run (Google's documented domains, including Tag Manager's Preview mode). Google Ads conversions
// send to www.googleadservices.com, pagead2.googlesyndication.com, doubleclick.net and www.google.com, so connect-src
// allows those (Google's list for Ads in its CSP guide), and the tag loads a script from googleads.g.doubleclick.net.
// www.google.com also redirects visitors to their own country's Google domain (www.google.co.in in India); see
// GOOGLE_COUNTRY_DOMAINS. Google Analytics can also send to analytics.google.com
// itself, which *.analytics.google.com doesn't cover. Tags added in Tag Manager that load other services (other ads
// pixels, chat widgets) or run custom HTML need their domains added here. Video QR code pages embed YouTube (youtube-nocookie.com) and Vimeo players after the visitor
// taps play, hence those two in frame-src. Styles stay 'unsafe-inline' because React style props and styled-jsx need it.
// Google's country domains, for that redirect. CSP can't wildcard the end of a host name, so each one is listed: India,
// then the main English-speaking, Gulf and European markets. Add a country when Google Ads starts targeting it. Google
// has about 190 (https://www.google.com/supported_domains), but listing them all would add about 5 KB to the headers of
// every response, more than common proxy limits allow.
const GOOGLE_COUNTRY_DOMAINS = ["co.in", "co.uk", "ca", "com.au", "co.nz", "ie", "ae", "com.sa", "com.sg", "co.za", "de", "fr", "nl"]
  .map((ending) => `https://www.google.${ending}`)
  .join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' https://checkout.razorpay.com https://*.razorpay.com https://challenges.cloudflare.com https://*.googletagmanager.com https://tagmanager.google.com https://googleads.g.doubleclick.net",
  "style-src 'self' 'unsafe-inline' https://tagmanager.google.com https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' https://*.razorpay.com https://challenges.cloudflare.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com https://*.doubleclick.net https://www.googleadservices.com https://pagead2.googlesyndication.com ${GOOGLE_COUNTRY_DOMAINS}`,
  "frame-src https://*.razorpay.com https://challenges.cloudflare.com https://www.googletagmanager.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.razorpay.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Razorpay may open a bank or UPI window that has to report back to the checkout
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // scripts/deploy.sh builds into a side folder while the live site keeps running, then swaps it in
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // pdfkit (invoice PDFs) reads its own data files at run time, so load it from node_modules instead of bundling it
  serverExternalPackages: ["pdfkit"],

  // Production optimizations
  compress: true,
  poweredByHeader: false,

  images: {
    unoptimized: false,
  },

  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },

  // Only in production: the dev server's hot reload needs eval and would trip the policy
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
