# QR Genie

SaaS for creating QR codes that can be edited after printing and tracked when scanned.
New accounts get a 14-day trial (2 QR codes); the Basic plan is a monthly Razorpay subscription.

**Stack:** Next.js 16 (Pages Router), React 18, Tailwind 3, Prisma 5 + PostgreSQL, JWT cookie auth, Razorpay, Resend.

## How it works

- **Create:** `pages/api/create-dynamic.js` saves a code with a 6-character slug. Dynamic codes encode `/r/<slug>`; static codes encode the target directly (no tracking, can't be edited or paused).
- **Scan:** `pages/r/[slug].js` checks the code's status and the owner's plan, records a `ScanEvent` (hashed IP, device, country), then redirects.
- **Plans:** `lib/subscription.js` decides what a user may do; `lib/subscriptionSync.js` pauses codes when a trial or subscription ends; `lib/activateBasicSubscription.js` restores them after payment. Paid codes keep working for 3 days after the end date to cover late renewals.
- **Payments:** billing page → `api/checkout/razorpay/create-subscription` → Razorpay Checkout → `api/checkout/razorpay/verify`. `api/webhooks/razorpay` handles renewals and is the backup if the browser never calls verify.

## Local setup

Needs Node 20+ and a local PostgreSQL.

```bash
cp .env.example .env        # then fill it in; use rzp_test_ keys and NEXT_PUBLIC_BASE_URL=http://localhost:3000
npm install
npx prisma migrate deploy   # creates the tables
npm run dev                 # http://localhost:3000
```

## Changing the database

1. Edit `prisma/schema.prisma`.
2. `npx prisma migrate dev --name short_description` creates a migration folder and applies it locally.
3. Commit the new folder under `prisma/migrations/`. On the server, `npx prisma migrate deploy` applies it.

Never edit or delete a migration folder that has already been applied on the server.

## Deploying

Every push to `main` runs `.github/workflows/deploy.yml`, which copies the source to the Lightsail server (`/var/www/qr-genie`). It does **not** build, migrate or restart, and it does **not** delete files removed from the repo. After a push, on the server:

```bash
cd /var/www/qr-genie
npm ci                       # only if package.json changed
npx prisma migrate deploy    # only if prisma/migrations changed
npx prisma generate
npm run build
pm2 restart qr-genie-next   # the name in ecosystem.config.js; check with `pm2 list`
```

The server reads its secrets from `/var/www/qr-genie/.env` (see `.env.example`); `ecosystem.config.js` holds no secrets.

### Server requirements

- **Nginx** must pass the client address: `proxy_set_header X-Real-IP $remote_addr;` and `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`. Scan analytics and the scan rate limit rely on it.
- **Razorpay plans** (Live mode): create a monthly Basic plan for each currency you want to offer and set `RAZORPAY_PLAN_ID_INR` and/or `RAZORPAY_PLAN_ID_USD`. A currency appears on the site only when its plan is set; prices shown on the site are read from the plans (cached for 10 minutes), so change a price by creating a new plan and updating the ID. Visitors in India see rupees by default, everyone else dollars, with a switch when both exist.
- **Razorpay webhook** (Live mode): URL `https://qr-genie.co/api/webhooks/razorpay`, events `subscription.activated` and `subscription.charged`, secret = `RAZORPAY_WEBHOOK_SECRET`.
- **Resend:** set `RESEND_API_KEY` and a `RESEND_FROM_EMAIL` on a domain verified in Resend, or password reset emails and contact-form notifications won't be sent. Contact messages are always saved in the `ContactMessage` table, so none are lost (view them with `npx prisma studio`).
- **Cloudflare Turnstile** (contact form spam check): create a widget in Cloudflare (mode: Managed, hostname `qr-genie.co`), then set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. The site key is baked in at build time, so run `npm run build` after adding it. With both empty the check is skipped.
- **Support email** shown on the site lives in `lib/site.js` (`SUPPORT_EMAIL`).
