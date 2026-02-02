/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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
};

module.exports = nextConfig;

