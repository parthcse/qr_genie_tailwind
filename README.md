# QR Genie

SaaS for creating QR codes that can be edited after printing and tracked when scanned.
New accounts get a 14-day trial (2 QR codes); the Basic plan is a monthly Razorpay subscription.

**Stack:** Next.js 16 (Pages Router), React 18, Tailwind 3, Prisma 5 + PostgreSQL, JWT cookie auth, Razorpay, email over SMTP (AWS SES) with nodemailer.

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
3. Commit the new folder under `prisma/migrations/`. The next deploy applies it on the server (`prisma migrate deploy`).

Never edit or delete a migration folder that has already been applied on the server.

## Deploying

Every push to `main` deploys automatically. `.github/workflows/deploy.yml` connects to the Lightsail server over SSH, moves `/var/www/qr-genie` to the pushed commit and runs `scripts/deploy.sh`, which:

1. reinstalls dependencies (only when `package-lock.json` changed),
2. applies database migrations (`prisma migrate deploy`),
3. builds into `.next-build` while the live site keeps running,
4. swaps the new build in and restarts PM2 (a few seconds of downtime),
5. checks the site answers; if not, it puts the previous build back and the workflow fails (GitHub emails you).

Watch a deploy under the repository's **Actions** tab; **Run workflow** there redeploys `main` by hand. On the server the same can be done with:

```bash
cd /var/www/qr-genie && git fetch origin main && git reset --hard origin/main && bash scripts/deploy.sh
```

The workflow uses the repository secrets `LIGHTSAIL_HOST`, `LIGHTSAIL_USER`, `LIGHTSAIL_SSH_KEY` and `REMOTE_PATH`. The server reads its own secrets from `/var/www/qr-genie/.env` (see `.env.example`); `ecosystem.config.js` holds no secrets. Never edit files on the server by hand: the next deploy resets them to what's in git (`.env` is untouched).

### Server requirements

- **Node.js 24 LTS** (NodeSource) and **PM2**, registered to start on boot (`pm2 startup` + `pm2 save`). The app listens on `127.0.0.1:3000` only.
- **Nginx** proxies to `http://127.0.0.1:3000` and must pass the client address: `proxy_set_header X-Real-IP $remote_addr;` and `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`. Scan analytics and the rate limits rely on it. It also has `server_tokens off`, an extra per-IP limit on `/api/auth/*` (`/etc/nginx/conf.d/qr-genie-limits.conf`), and a default server that drops requests for any other host name.
- **Security headers** (CSP, HSTS, frame blocking and others) are sent by the app itself in production; see `next.config.js`. A new third-party script or iframe has to be added to the Content-Security-Policy there.
- **Razorpay plans** (Live mode): create a monthly Basic plan for each currency you want to offer and set `RAZORPAY_PLAN_ID_INR` and/or `RAZORPAY_PLAN_ID_USD`. A currency appears on the site only when its plan is set; prices shown on the site are read from the plans (cached for 10 minutes), so change a price by creating a new plan and updating the ID. Visitors in India see rupees by default, everyone else dollars, with a switch when both exist.
- **Razorpay webhook** (Live mode): URL `https://qr-genie.co/api/webhooks/razorpay`, events `subscription.activated` and `subscription.charged`, secret = `RAZORPAY_WEBHOOK_SECRET`.
- **Email (AWS SES over SMTP):** in the SES console (ap-south-1) verify the `qr-genie.co` domain (DKIM DNS records), create SMTP credentials (SES → SMTP settings; not your AWS access keys) and request production access (the sandbox only sends to verified addresses). Then set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `EMAIL_FROM`, restart, and check with `npm run email:test -- you@example.com`. Without SMTP settings, password-reset links and contact messages are printed to the server log instead; contact messages are always saved in the `ContactMessage` table (view them with `npx prisma studio`).
- **Cloudflare Turnstile** (bot check on sign-up, login, password reset and the contact form): create a widget in Cloudflare (mode: Managed, hostname `qr-genie.co`, plus `localhost` if you want it locally), then set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. The site key is baked in at build time, so rebuild after changing it. With both empty the check is skipped.
- **Sign-up checks:** addresses from temporary/disposable email providers (the `mailchecker` list) and domains that can't receive email are refused, as are sign-ups that fill the hidden honeypot field. Each IP can create 5 accounts per hour.
- **Support email** shown on the site lives in `lib/site.js` (`SUPPORT_EMAIL`).
