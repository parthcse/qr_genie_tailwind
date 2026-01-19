
# QR-Genie – Minimal SaaS (Tailwind + Next.js)

Features:
- Ultra minimal, Apple-style landing page
- TailwindCSS styling
- Email/password auth with HTTP-only JWT cookie
- User dashboard to create and list dynamic QR codes
- Admin dashboard with basic stats
- Dynamic redirect /r/[slug]
- Prisma + SQLite

## Setup (local)

1. Copy `.env.example` to `.env.local` and fill values (especially JWT_SECRET).

2. Install dependencies:

   npm install

3. Run migrations:

   npx prisma migrate dev --name init

4. Start dev server:

   npm run dev

## Production (e.g. AWS Lightsail)

1. Copy project to server, then:

   cd qr_genie_tailwind
   cp .env.example .env
   # edit .env and set JWT_SECRET, BASE_URL etc.

   npm install
   npx prisma migrate dev --name init
   npm run build
   npm start

For background running, use PM2 and Nginx reverse proxy with Let’s Encrypt SSL.
