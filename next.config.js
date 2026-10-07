// Content Security Policy: only our own code plus Razorpay checkout and Cloudflare Turnstile may run.
// Styles stay 'unsafe-inline' because React style props and styled-jsx need it.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' https://checkout.razorpay.com https://*.razorpay.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.razorpay.com https://challenges.cloudflare.com",
  "frame-src https://*.razorpay.com https://challenges.cloudflare.com",
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
