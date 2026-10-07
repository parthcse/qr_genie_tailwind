# QR Genie

SaaS for creating QR codes that can be edited after printing and tracked when scanned (https://qr-genie.co).
New accounts get a 14-day trial (2 QR codes); the Basic plan is a monthly Razorpay subscription.

**Stack:** Next.js 16 (Pages Router), React 19, Tailwind 3, Prisma 6 + PostgreSQL 16, JWT cookie auth, Razorpay, email over SMTP (AWS SES), Cloudflare Turnstile. Node 24 LTS in production (22+ locally).

**Full reference: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)**: features, project layout, environment variables, data model, sign-in, plans, payments, email, coding conventions, deploying and troubleshooting.

## How it works

- **Create:** `pages/api/create-dynamic.js` saves a code with a 6-character slug. Dynamic codes encode `/r/<slug>`; static codes encode the target directly (no tracking, can't be edited or paused). Four types are open: Website, WiFi, WhatsApp, Instagram. WiFi codes are always static so phones can join the network straight from the camera; website codes can be password protected.
- **Scan:** `pages/r/[slug].js` checks the code's status and the owner's plan, records a `ScanEvent` (hashed IP, device, country), asks for the password if the code is protected (`api/r/[slug]/unlock` checks it), then redirects.
- **Plans:** `lib/subscription.js` decides what a user may do; `lib/subscriptionSync.js` pauses codes when a trial or subscription ends; `lib/activateBasicSubscription.js` restores them after payment. Paid codes keep working for 3 days after the end date to cover late renewals.
- **Payments:** billing page → `api/checkout/razorpay/create-subscription` → Razorpay Checkout → `api/checkout/razorpay/verify`. `api/webhooks/razorpay` handles renewals and is the backup if the browser never calls verify. Visitors in India pay in INR and everyone else in USD, decided by IP (`lib/plans.js`) and enforced at checkout. Every payment gets a GST tax invoice by email with a PDF attached (`lib/invoices.js`; set the `INVOICE_*` variables first).

## Local setup

Needs Node 22+ and a local PostgreSQL.

```bash
cp .env.example .env        # then fill it in (see below)
npm install
npx prisma migrate deploy   # creates the tables
npm run dev                 # http://localhost:3000
```

For local work use `NEXT_PUBLIC_BASE_URL=http://localhost:3000`, Razorpay `rzp_test_` keys with test-mode plans, and Cloudflare's Turnstile test keys (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`), which always pass. Leave the `SMTP_*` settings empty to see emails in the terminal instead of sending them. Restart `npm run dev` after `npm install` or `prisma generate`.

## Changing the database

1. Edit `prisma/schema.prisma`.
2. `npx prisma migrate dev --name short_description` creates a migration folder and applies it locally.
3. Commit the new folder under `prisma/migrations/`. The next deploy applies it on the server.

Never edit or delete a migration folder that has already been applied on the server, and keep migrations backward compatible (they run before the new code goes live).

## Deploying

**Every push to `main` deploys to the live site automatically** (about 3 minutes). `.github/workflows/deploy.yml` connects to the server over SSH, moves the app to the pushed commit and runs `scripts/deploy.sh`, which installs dependencies (only when the lockfile changed), applies migrations, builds beside the running site, swaps the build in, restarts PM2 and checks the site answers. If it doesn't, the previous build is put back and the workflow fails (GitHub emails you).

Watch deploys in the repository's **Actions** tab; **Run workflow** there redeploys `main` by hand. The server keeps its secrets in its own `.env` file (see `.env.example` for the list); never edit other files on the server by hand, because the next deploy resets them.

Production setup, Razorpay, email, Turnstile and troubleshooting: see the [developer guide](DEVELOPER_GUIDE.md#production).

## Support

Support email shown on the site: `info@qr-genie.co` (`lib/site.js`, `SUPPORT_EMAIL`).
