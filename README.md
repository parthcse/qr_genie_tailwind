# QR-Genie

Minimal SaaS for creating, managing, and tracking dynamic QR codes. Built with Next.js and Tailwind CSS.

## Features

- **QR code types**: Website, WiFi, Instagram, WhatsApp, vCard, PDF, social links, menu, coupon, and more
- **Design**: Frames, patterns, colors, logos, gradients (via `qr-code-styling`)
- **Dynamic vs static**: Dynamic = short link `/r/[slug]` with tracking; static = direct URL in QR, no tracking
- **Analytics**: Scan events, device/browser, geo (country/region/city), time-series charts (Pro)
- **Folders**: Organize QR codes (Pro)
- **Auth**: Email/password, HTTP-only JWT, password reset (Resend)
- **Billing**: 14-day trial, Pro plans; trial/limit enforcement in API

## Tech stack

- **Frontend**: Next.js, React, Tailwind CSS, Recharts, qrcode.react, qr-code-styling
- **Backend**: Next.js API routes, Prisma, PostgreSQL (production) / SQLite (dev), JWT, bcrypt, nanoid
- **Email**: Resend (optional)

## Local setup

1. Copy `.env.example` to `.env.local` and set at least:
   - `DATABASE_URL` (e.g. `file:./prisma/dev.db` for SQLite)
   - `JWT_SECRET` (e.g. `openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`)

2. Install and run migrations:
   ```bash
   npm install
   npx prisma migrate dev --name init
   ```

3. Start dev server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Production

- Set `DATABASE_URL` (PostgreSQL), `JWT_SECRET`, `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_BASE_URL`, optional `RESEND_*`.
- On server: `npm install`, `npx prisma generate`, `npm run migrate` (or `npx prisma migrate deploy`), `npm run build`, then `npm start` (or PM2). Use Nginx (or similar) as reverse proxy and SSL (e.g. Let’s Encrypt).

Full steps, Nginx config for POST/API, migration order, and troubleshooting: **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Documentation (relevant to this codebase)

| Document | Purpose |
|----------|---------|
| **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** | Project overview, tech stack, folder structure, key files, env vars, API routes, dev workflow |
| **[DATABASE_DOCUMENTATION.md](DATABASE_DOCUMENTATION.md)** | Database config, schema, tables, relationships, migrations, operations, best practices |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Production deploy (env, build, PM2, Nginx, SSL), DB migration, Nginx POST fix, SSH/firewall troubleshooting |
| **[README_EMAIL_SETUP.md](README_EMAIL_SETUP.md)** | Password reset and Resend setup (dev vs production) |
| **[SUBSCRIPTION_IMPLEMENTATION.md](SUBSCRIPTION_IMPLEMENTATION.md)** | Trial, plans, QR limits, pause/resume, billing APIs |
| **[DYNAMIC_FORM_SYSTEM.md](DYNAMIC_FORM_SYSTEM.md)** | Schema-driven QR form (qrSchemas, DynamicForm, field components) |

All other one-off fix summaries and duplicate checklists have been removed; the above files are the single source of truth for this project.
