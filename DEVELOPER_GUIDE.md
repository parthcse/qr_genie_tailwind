# QR Genie developer guide

How QR Genie works and how to build, test and ship changes. The [README](README.md) is the short version.

> This repository is public. Keep passwords, keys, server addresses and other private details out of this file and out of git: they belong in `.env` files and the team's password manager.

**Contents:** [What the app does](#what-the-app-does) · [Stack](#stack) · [Project layout](#project-layout) · [Local development](#local-development) · [Environment variables](#environment-variables) · [Data model](#data-model) · [Accounts and sign-in](#accounts-and-sign-in) · [Plans and the free trial](#plans-and-the-free-trial) · [QR codes](#qr-codes) · [Scanning and analytics](#scanning-and-analytics) · [Payments](#payments-razorpay) · [Email](#email) · [Coding conventions](#coding-conventions) · [Deploying](#deploying) · [Production](#production) · [Troubleshooting](#troubleshooting) · [Not built yet](#not-built-yet)

---

## What the app does

QR Genie lets businesses create QR codes whose destination can be changed after printing, and see how often they're scanned.

| Page | What's there |
|---|---|
| `/` | Landing page: hero with a product preview and stats that count up when scrolled into view, the kinds of business it's made for (restaurants, retail, events, hotels, real estate, marketing), **QR code types** (tabs for the released types, each with a phone preview of what a scan does and a button to create one), features, how it works, pricing (INR or USD), testimonials, and a closing panel with an illustration (a scannable sign-up QR code for signed-out visitors). The buttons are rendered on the server from the signed-in state, so there's no placeholder flash. The header's section links glide to their section and underline the one being read. |
| `/auth/register`, `/auth/login`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password` | Sign-up (starts a 14-day free trial; the Terms of Service and Privacy Policy must be accepted), email confirmation with a 6-digit code, login, password reset by email. Login, sign-up and verification share `components/AuthShell.js` (brand panel, animated form, field components). Sign-up, login and forgot-password are protected by a Cloudflare Turnstile check. |
| `/dashboard` (**My QR codes**) | Stats (codes, active, paused, total scans), folders as chips, search, status tabs (All / Active / Paused), type filter, sorting, pagination. Each code shows its type, dynamic/static, status, a **Protected** badge when it has a password, destination, short link (copy button), folder and scan count, with Download, Details and a menu (preview, copy link, duplicate, move to folder, pause/resume, delete). Select several codes for bulk move, pause, resume or delete. |
| `/dashboard/create-qr` | Three steps with a live phone preview: **type** (the four released types; the rest are listed as coming soon) → **content** (the form for the type, name, folder, dynamic or static — WiFi is always static — and, for websites, an optional password) → **design** (pattern color or gradient, background color, gradient or transparent, pattern style, corner styles and colors, frame with text, and a logo — big images are shrunk in the browser to 150 KB at most). After **Create QR code** a success screen shows the short link and offers Download (PNG, SVG, PDF, JPEG or print), View details and Create another. `?type=website` (or `wifi`, `whatsapp`, `instagram`) opens straight at step 2 with that type chosen; the landing page links there. |
| `/dashboard/qrs/[id]` | One code: details, change the destination, add, change or remove its password, set a custom paused message, and its scans over time, by country and by device. |
| `/dashboard/analytics` | All codes or one code over 7 days, 30 days, 90 days or 12 months: total and unique scans with the change against the previous period, daily average, busiest day, scans over time, devices, operating systems, browsers, top countries and cities, a weekday × hour heatmap (in the viewer's time zone), per-code performance and CSV export. The chosen code is kept in the address (`?qrId=`). |
| `/dashboard/account` | Profile, email change (needs the current password, then a 6-digit code sent to the new address), password change with a strength meter (signs out other devices), language, billing details. Fields use the same components as login and sign-up (`components/AuthShell.js`). |
| `/dashboard/billing` | Current plan, trial countdown, Basic plan checkout with Razorpay, currency switch. |
| `/contact` | Contact form (saved to the database and emailed to support): name, email, the topic as cards (with a tip for billing, cancellation, refund and "something isn't working" messages), message. `?topic=billing` (or another topic value from `lib/site.js`) preselects a topic. Beside it: the support email with a copy button, billing guidance and policy links. |
| `/privacy`, `/terms`, `/refund-policy` | Legal pages. |
| `/r/<slug>` | Where every dynamic QR code points: logs the scan and redirects (after asking for the password when the code is protected). |
| `/admin` | Totals and latest codes, for users with the admin role only. |

Public pages end with `components/SiteFooter.js`: the brand, a card with the support email, Product / Account / Support links, the Razorpay note and a **Back to top** button (the landing page adds the closing sign-up panel above it).

All dashboard pages share `components/DashboardLayout.js`: the sidebar has a **Create QR code** button, then *Workspace* (My QR codes, Analytics) and *Account* (My account, Billing, Help & support), each with an icon; the plan card and the signed-in user sit at the bottom. On phones the same links, with the same icons, are in the header's menu.

## Stack

| Part | What |
|---|---|
| Framework | Next.js 16 with the **Pages Router** (no App Router), React 19, Turbopack builds |
| Styling | Tailwind CSS 3.4 (theme in `tailwind.config.js`; `max-w-site` is the site width) |
| Fonts | Inter (text, `font-sans`) and Plus Jakarta Sans (headings, `font-display`), loaded with `next/font/google` in `pages/_app.js`: downloaded at build time and served from our own domain |
| Database | PostgreSQL 16 through Prisma 6 |
| Auth | JWT in an httpOnly cookie (`jsonwebtoken`, `cookie`, `bcryptjs`) |
| Payments | Razorpay subscriptions |
| Email | nodemailer over SMTP (AWS SES) |
| Bot protection | Cloudflare Turnstile |
| QR rendering | `qr-code-styling` (designed codes in the browser), `qrcode` (server PNGs) |
| Charts | `recharts` |
| Location | `geoip-lite` (bundled IP database) |
| Runtime | Node 24 LTS in production, Node 22 or newer locally |

Prisma 7 and Tailwind 4 are major rewrites and haven't been adopted yet. The `overrides` entry in `package.json` patches a Prisma CLI dependency; drop it once Prisma ships the fix.

## Project layout

```
pages/              routes (see "What the app does"); pages/api/ is the JSON API
components/         layouts, header/footer, auth page shell (AuthShell), QR rendering, modals, Turnstile widget
components/qrFields/  the schema-driven form used by create-qr
lib/                shared and server-side logic
prisma/             schema.prisma and migrations/
scripts/            deploy.sh (production deploy), test-email.mjs
.github/workflows/  deploy.yml (deploys on every push to main)
```

**`lib/`**

| File | Job |
|---|---|
| `auth.js` | Session cookie; `getUserFromRequest(req)` returns the signed-in user or `null`. |
| `prisma.js` | The shared Prisma client (leaves QR password hashes out of every query). |
| `subscription.js` | Plan rules: `getUserSubscriptionStatus`, `canCreateQR`, `checkQRCodeLimit`, `getQrPauseReason`, `TRIAL_QR_LIMIT`. No server dependencies, so pages can import it. |
| `subscriptionSync.js` | Applies plan changes: pauses codes when a plan ends. |
| `activateBasicSubscription.js` | Turns the Basic plan on after payment and restores plan-paused codes; tells the caller whether it was a renewal. |
| `plans.js`, `price.js` | Reads the Razorpay plans (prices, currencies), picks a visitor's default currency, formats prices. |
| `razorpayClient.js`, `razorpayVerify.js`, `razorpayError.js` | Razorpay SDK, signature checks, readable error messages. |
| `emailCheck.js` | Sign-up email rules (format, no temporary-mail providers, domain can receive mail). |
| `emailVerification.js` | The 6-digit email codes, for sign-up (`sendVerificationCode`, `checkVerificationCode`) and for changing the email (`sendEmailChangeCode`, `confirmEmailChange`, `cancelEmailChange`): expiry, tries and resend cooldown. |
| `email.js` | All outgoing email: password reset, email confirmation code, contact messages, and the plan emails (shared branded HTML layout). |
| `turnstile.js` | Checks a Turnstile token with Cloudflare. |
| `rateLimit.js` | `isRateLimited(key, windowMs, max)`: true when a request should be refused. |
| `clientIp.js` | The visitor's IP as passed on by Nginx. |
| `scanUtils.js`, `geoIp.js` | Scan details: hashed IP, device, OS, browser, country and city. |
| `redirectValidation.js` | Accepts only http(s) URLs as redirect targets. |
| `resetToken.js` | Password-reset tokens and their hashes. |
| `qrPassword.js` | QR code passwords: length rules, hashing and checking; also reads a `WIFI:` string back into network name and password. |
| `imageUpload.js` | The 150 KB image limit, and `prepareLogo`, which shrinks an uploaded logo in the browser (max 600 px, PNG or WebP) to fit it. |
| `qrSchemas.js` | Form definitions for each QR type. |
| `qrDownload.js` | PNG / JPG / SVG / PDF / print export of a designed code, in the browser. |
| `useCurrentUser.js` | Browser hook that loads the signed-in user (if any) for public pages and their header. |
| `site.js` | `SUPPORT_EMAIL`, contact topics, `BASIC_PLAN_FEATURES` (pricing card and plan email), `LEGAL_LAST_UPDATED` (update when the legal pages change). |
| `subscriptionEmails.js` | `sendPlanEmails`: the customer and admin emails for a new subscription or a renewal, each sent once. |

**API (`pages/api/`)**

| Area | Routes |
|---|---|
| Auth | `auth/register`, `auth/login`, `auth/logout`, `auth/me`, `auth/verify-email`, `auth/resend-verification`, `auth/forgot-password`, `auth/reset-password`, `account/email-change` |
| Account | `account/update`, `account/password`, `account/billing` |
| QR codes | `create-dynamic`, `my-qr-codes`, `qrs/[id]` (GET, PUT), `qrs/[id]/pause`, `qrs/[id]/resume`, `qrs/[id]/analytics`, `update-qr-name`, `duplicate-qr`, `delete-qr`, `move-to-folder` |
| Folders | `folders` (list, create), `folders/[id]` (rename, delete) |
| Analytics | `analytics/overview` |
| Billing | `billing/plans`, `checkout/razorpay/create-subscription`, `checkout/razorpay/verify`, `webhooks/razorpay` |
| Public | `r/[slug]/unlock` (password check for protected codes), `qr-image/[slug]`, `vcard/[slug]`, `contact` |
| Admin | `admin/summary` |

## Local development

```bash
cp .env.example .env       # fill it in, see below
npm install                # also runs prisma generate
npx prisma migrate deploy  # creates the tables
npm run dev                # http://localhost:3000
```

Use a local PostgreSQL database, never the production one. Recommended local settings:

| Variable | Local value | Why |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:password@localhost:5432/qr_genie_dev` | Your own local database. |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | Codes made locally point at your machine. |
| `RAZORPAY_*` | Test-mode keys (`rzp_test_...`) and test-mode plan IDs | No real payments. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `1x00000000000000000000AA` | Cloudflare's public test key: always passes, so forms work on localhost. |
| `TURNSTILE_SECRET_KEY` | `1x0000000000000000000000000000000AA` | Matching test secret. |
| `SMTP_*` | Empty | Emails are printed in the terminal instead of sent. |

**Commands**

| Command | Does |
|---|---|
| `npm run dev` | Development server with hot reload. |
| `npm run build` then `npm start` | Production build and server (listens on 127.0.0.1:3000). |
| `npm run prisma:studio` | Browse and edit the database in the browser. |
| `npx prisma migrate dev --name what_changed` | Create and apply a migration after editing the schema. |
| `npm run email:test -- you@example.com` | Send a test email with the current SMTP settings. |

Restart `npm run dev` after `npm install` or `prisma generate`; the running server keeps the old Prisma client. On Windows, stop the dev server before `prisma generate` or it can fail with `EPERM`.

**Changing the database:** edit `prisma/schema.prisma`, run `npx prisma migrate dev --name short_description`, and commit the new folder in `prisma/migrations/`. The next deploy applies it. Never edit or delete a migration that has already been deployed.

## Environment variables

All are listed with comments in `.env.example`. Values never go into git.

| Variable | Used for |
|---|---|
| `DATABASE_URL` | PostgreSQL connection. |
| `NEXT_PUBLIC_BASE_URL` | Public site address; used in QR short links and email links. Baked in at build time. |
| `NEXT_PUBLIC_APP_URL` | Optional; overrides the base URL for links. |
| `JWT_SECRET` | Signs login cookies. Changing it signs everyone out. |
| `SCAN_IP_HASH_SECRET` | Key for hashing scanner IPs. Changing it makes returning visitors count as new. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay API keys. |
| `RAZORPAY_PLAN_ID_INR`, `RAZORPAY_PLAN_ID_USD` | The monthly Basic plan in each currency; a currency is offered only when its plan is set. |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies Razorpay webhook calls. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile. The site key is baked in at build time; with the secret empty the check is skipped. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Outgoing email. Empty = emails are printed to the log. |
| `ADMIN_NOTIFY_EMAIL` | Optional. Where new-subscriber and renewal notices go (comma-separated for several). Empty = the support address. |
| `CONTACT_NOTIFY_EMAIL` | Optional. Where contact-form messages are emailed (comma-separated for several). Empty = the support address. |

## Data model

`prisma/schema.prisma`:

| Model | Holds |
|---|---|
| `User` | Email, password hash, profile and billing details, `role`, plan dates, Razorpay IDs, password-reset token hash, `sessionVersion`, `emailVerifiedAt` and the current confirmation code (`emailCodeHash`, expiry, wrong tries, sent time), `pendingEmail` (a new address waiting for its code), `termsAcceptedAt`, `lastPlanEmailKey` (what the plan emails were last sent for). |
| `QRCode` | `slug`, `type`, `targetUrl`, `linkType` (`DYNAMIC` / `STATIC`), `status` (`ACTIVE` / `PAUSED` / `DELETED`), `deactivatedReason` (`MANUAL` / `TRIAL_EXPIRED` / `SUBSCRIPTION_EXPIRED`), `pausedMessage`, `passwordHash` (bcrypt, only for protected codes), `scanCount`, colors, `meta`, folder. |
| `ScanEvent` | One logged scan: hashed IP, device, OS, browser, referrer, country, region, city. |
| `Folder` | A user's folder. |
| `ContactMessage` | Contact-form messages. |

- **`QRCode.meta`** is a JSON string: data for the type (e.g. WiFi network name, Instagram username, WhatsApp number and message) plus `designConfig` (the design chosen in step 3, including the logo as an image data URL). Logos live in the database, not in files, which is why they're capped at 150 KB.
- **Deleting a QR code** sets `status = DELETED`: the short link shows "not found", the code leaves all lists and the trial count, and its scan history stays.
- **Deleting a folder** moves its codes to "no folder".
- **`passwordHash` is left out of every query by default** (`omit` in `lib/prisma.js`). Code that checks a password asks for it with `omit: { passwordHash: false }`; API responses only ever say `hasPassword: true/false`.
- `scanCount` is what the dashboard list shows; the analytics pages count `ScanEvent` rows.
- IDs are CUIDs; date calculations use UTC.

## Accounts and sign-in

- **Session:** an httpOnly, SameSite=Lax cookie (Secure in production) holding a signed JWT with the user ID and `sessionVersion`, valid 7 days. `lib/auth.js`.
- **Every protected API route** starts with `getUserFromRequest(req)` and returns 401 without a user; dashboard pages call `accountRedirect(user)` in `getServerSideProps` (signed out → login, email not confirmed → `/auth/verify-email`). Queries on QR codes and folders always include the user's ID, so nobody can read or change someone else's data.
- **Signing out other devices:** changing or resetting the password increments `sessionVersion`, which invalidates every older cookie. The device that made the change gets a new cookie.
- **Passwords** are stored as bcrypt hashes; 8–128 characters.
- **Password reset:** the email link holds a one-time token that expires after an hour; only a hash of it is stored. The forgot-password form answers the same way whether or not the email has an account.
- **Sign-up** refuses addresses from temporary/disposable mail providers (`mailchecker`) and domains that can't receive email, and includes a hidden honeypot field for bots. The Terms of Service and Privacy Policy checkbox is required by the form and by `api/auth/register` (`acceptTerms: true`); the time is stored in `termsAcceptedAt`.
- **Email confirmation:** sign-up signs the person in and emails a 6-digit code (`lib/emailVerification.js`). Until it is entered on `/auth/verify-email`, the dashboard pages redirect there and creating codes, duplicating them and starting a subscription return 403 (`VERIFY_EMAIL_FIRST`). A code lasts 10 minutes and allows 5 wrong tries (each try is counted in one atomic database update, so parallel guesses can't beat it); a new code can be sent once a minute and 5 times an hour, and replaces the old one. Only an HMAC of the code is stored (keyed with `JWT_SECRET`) and it is left out of every query by default. Login tells unconfirmed accounts to go to the verification page. A password reset through the emailed link also confirms the address. Accounts created before this existed were marked confirmed by the migration.
- **Changing the email** (account page) needs the current password and passes the same email checks. It doesn't switch straight away: the address is kept in `pendingEmail` and a 6-digit code is sent to it; the sign-in email changes only once that code is entered (`api/account/email-change`: GET the pending change, POST the code, PUT to resend, DELETE to cancel), and the old address then gets a notice that it was changed. Saving the form again within a minute doesn't send another code. The code is tied to the new address, follows the same expiry, tries and resend rules as sign-up, and an address taken by another account in the meantime is refused.
- **Bot checks:** Cloudflare Turnstile (Managed mode) on sign-up, login, forgot-password and contact. `components/Turnstile.js` renders the widget; `lib/turnstile.js` verifies the token.
- **Rate limits** protect login, sign-up, email confirmation (checking and resending codes), password reset, password/email change, the contact form, scans and password guesses on protected QR codes. Each route sets its own limit with `isRateLimited`; limits are kept in memory, so they reset when the app restarts.
- **Admin:** users with `role = "admin"` can open `/admin`. Everyone else gets a "not found" page, so the admin area can't be discovered.

## Plans and the free trial

| Status (`getUserSubscriptionStatus`) | Meaning |
|---|---|
| `TRIAL_ACTIVE` | New account: 14 days, up to 2 QR codes (`TRIAL_QR_LIMIT`). |
| `TRIAL_EXPIRED` | Trial over without paying; codes are paused. |
| `SUBSCRIPTION_ACTIVE` | Basic plan: unlimited codes. |
| `SUBSCRIPTION_EXPIRED` | Plan lapsed; codes are paused. |
| `NONE` | No plan. |

- Status is calculated from the plan dates every time.
- A plan ending is applied the next time the user signs in or opens the dashboard, or when one of their codes is scanned; their active codes are then paused with a plan reason.
- Paid codes keep working for 3 days after the paid-until date, so a late renewal doesn't take printed codes offline.
- Paying restores codes paused for plan reasons; codes the user paused or deleted stay as they are.
- The trial length (14) and code limit (2) appear in several files and in the site copy (landing, billing, terms, refund policy). Search for them when changing either.

## QR codes

**Open types:** Website, WiFi, WhatsApp, Instagram. The create form also contains definitions for other types (PDF, vCard, links, menus, …) that aren't released; the API only accepts the open types (`ENABLED_TYPES` in `api/create-dynamic.js`).

**Dynamic vs static**
- **Dynamic** (default): the code holds the short link `/r/<slug>`. The destination can be changed any time, scans are counted, and the code can be paused.
- **Static:** the code holds the destination itself (a URL or, for WiFi, the network details). Nothing is tracked and it can't be edited or paused.
- **WiFi codes are always static**, because a phone's camera can only join a network from the `WIFI:` text inside the code itself, not from a web page. The API enforces this whatever the form sends.

**Password protection** (dynamic codes except WiFi; offered on the Website form):
- The password (4–64 characters) is stored only as a bcrypt hash.
- Scanning a protected code shows a password page instead of redirecting. The browser sends the password to `api/r/[slug]/unlock`, which returns the destination only when it's right; the destination never appears in the page itself.
- Wrong guesses are rate-limited per visitor and per code.
- A static code can't be protected (there's no page in between), so the form switches to Dynamic when the password is turned on.
- The owner can add, change or remove the password on the code's details page; duplicating a code copies its password.

**Creating** (`api/create-dynamic.js`): checks the plan and trial limit, then validates the input for the type (URLs must be http(s), colors must be hex, Instagram usernames and WhatsApp numbers must be valid, names have length limits, a logo may be at most 150 KB and the whole request 400 KB), then saves the code with a random 6-character slug.

**The form system:** each type's fields are defined in `lib/qrSchemas.js` and drawn by `components/qrFields/DynamicForm.js` with the field components in `components/qrFields/FieldComponents.js` (text, url, email, tel, password, textarea, select, folder, toggle (shown as a switch), color, file, repeater, icon selector; fields can depend on a toggle).

**Releasing another type:**
1. Mark it `active` in `qrTypes` in `pages/dashboard/create-qr.js` and check its preview.
2. Review its fields in `lib/qrSchemas.js`.
3. Add it to `ENABLED_TYPES` in `api/create-dynamic.js` with input validation like the open types have.
4. If the type uploads files (PDFs, videos, audio), store them outside the database (e.g. object storage) first; the forms only keep images, and those are capped at 150 KB.
5. Make sure the page or file it serves escapes everything it shows (follow `pages/pdf/[slug].js` and `api/vcard/[slug].js`), and that a password-protected code can't be opened there directly, bypassing `/r/<slug>`.
6. Update the landing page and pricing copy, and add the type to `qrTypeShowcase` in `pages/index.js` (the "QR code types" tabs only list released types).

**Downloads** are made in the browser (`lib/qrDownload.js`, and the create page's own export) using the address of the page you're on, so download codes from the live site, not from localhost. On the create page, downloading is only offered after the code is created, so the file always holds the real short link (for dynamic codes) or the final content (for static ones).

## Scanning and analytics

`pages/r/[slug].js` handles every scan:

| Code | Visitor sees | Scan logged |
|---|---|---|
| Doesn't exist or deleted | "QR not found or removed" | No |
| Paused, or the owner's plan has ended | "QR code paused" (or the owner's custom message) | No |
| Password protected | Password page; the right password sends the visitor on | Yes (once, on the password page) |
| Active dynamic WiFi code (made before WiFi became static-only) | Network name and password with a copy button and joining steps | Yes |
| Any other active code | Redirect to the destination | Yes |

- A logged scan adds a `ScanEvent` and increases `scanCount`.
- **Unique scans** are counted from a hash of the IP address and browser; raw IPs are never stored.
- **Country and city** come from the bundled `geoip-lite` database (refreshed when the package is updated). Local and private IPs have no location, so scans from localhost show "Unknown".
- Analytics endpoints: `api/analytics/overview` for the Analytics page (`days` up to 365, optional `qrId`, and `tz` — the browser's time-zone offset — so days and hours are counted in the viewer's local time) and `api/qrs/[id]/analytics` for a code's details page. Both only read scans of the signed-in user's own codes.

## Payments (Razorpay)

1. `/dashboard/billing` loads the plans from `api/billing/plans`. Prices come from the Razorpay plans; visitors in India see INR by default, others USD, with a switch when both are set up.
2. **Subscribe** calls `api/checkout/razorpay/create-subscription`, then Razorpay Checkout opens.
3. After payment the browser calls `api/checkout/razorpay/verify`, which checks the payment signature and activates the plan until Razorpay's current period end.
4. `api/webhooks/razorpay` receives `subscription.activated` and `subscription.charged` (monthly renewals) and also covers the case where the browser never called verify. A payment is never applied twice.
5. Both paths then send the plan emails (see [Email](#email)) in the background, so checkout never waits for them.

**Razorpay dashboard setup:** a monthly plan per currency (IDs into `RAZORPAY_PLAN_ID_INR` / `_USD`; to change a price, create a new plan and swap the ID), and a webhook to `<site>/api/webhooks/razorpay` for `subscription.activated` and `subscription.charged` with its secret in `RAZORPAY_WEBHOOK_SECRET`. USD needs Razorpay's international payments to be enabled.

**Cancelling** is handled by the team: customers ask through the contact form ("Cancel my subscription"), and the subscription is cancelled in the Razorpay dashboard. Access continues until the end of the paid period.

## Email

`lib/email.js` sends these emails over SMTP (AWS SES):
- **Password reset** links to the user.
- **Email confirmation code** after sign-up, to the new address when changing the email, or when a new code is requested; after a change, a **notice to the old address**.
- **Contact-form messages** to `CONTACT_NOTIFY_EMAIL`, or the support address (`SUPPORT_EMAIL` in `lib/site.js`) when it's empty, with Reply-To set to the sender. Every message is also saved in `ContactMessage` first.
- **Plan emails** (`lib/subscriptionEmails.js`), when someone subscribes or a monthly payment goes through:
  - to the customer: *Your Basic Package is active* (plan, price, amount paid, payment method, start and next renewal dates, payment and subscription IDs, what's included, links to the dashboard, billing, cancelling and the refund policy; replies go to support), or *Payment received: your plan is renewed* for later payments;
  - to the admin (`ADMIN_NOTIFY_EMAIL`, else the support address): *New subscriber* (customer name, email, company, phone, country, sign-up date, plan before, payment details, how it was confirmed, the number of paying subscribers, links to the payment and subscription in the Razorpay dashboard; replies go to the customer), or a *Renewal* notice.

  Checkout and the Razorpay webhooks report the same events in any order, so each is sent once: a new subscription is claimed by its subscription ID (whichever call switches the plan on first, which still knows the plan before and the paused codes it restored; if that call has no payment, the payment is looked up from Razorpay), a renewal by its payment ID, in `User.lastPlanEmailKey`. A mail failure is logged and never undoes the plan.

Without SMTP settings all of them are printed to the log. The SMTP connection is created once, so restart the app after changing SMTP settings. Check delivery with `npm run email:test -- you@example.com`.

## Coding conventions

- **API responses:** JSON. On failure `{ error: "message for the user" }` with a matching status code (400, 401, 403, 404, 405, 429, 500). Never send internal error details (`error.message`, stack traces) to the browser; log them with `console.error`.
- **Check the user and ownership** in every API route that touches user data (`getUserFromRequest`, and `userId: user.id` in every query).
- **Validate input on the server** even when the form already does: types, lengths, allowed values. Use `lib/redirectValidation.js` for any URL that will be redirected to.
- **Rate-limit** anything a bot could abuse: ``if (isRateLimited(`name:${ip}`, windowMs, max)) return res.status(429).json({ error: "…" })``.
- **Never send secrets or hashes to the browser.** QR password hashes and email confirmation code hashes are omitted by default (see [Data model](#data-model)); if you add another secret field, omit it the same way.
- **Server-only modules** (`lib/prisma`, `lib/auth`, `lib/email`, `lib/scanUtils`, …) may be used in pages only inside `getServerSideProps`. Don't leave unused imports of them in a page: Next.js can then ship the module to the browser.
- **Content Security Policy** (`next.config.js`, production only): scripts may come only from the site, Razorpay and Cloudflare Turnstile; inline `<script>` and `eval` are blocked. When adding a third-party script, iframe, font or API, add its domain to the policy and test with `npm run build && npm start`: the dev server doesn't apply the policy.
- **Pop-ups and dropdown menus inside dashboard pages** should be rendered with `createPortal(…, document.body)` (see `pages/dashboard/index.js`): the dashboard card clips its content and uses a blur effect, so otherwise a menu gets cut off at the card edge and overlays get trapped inside the card.
- **Links styled as buttons** need `!text-…` color classes (e.g. `!text-white`), because the global link style sets link colors.
- **Brand look:** indigo→purple gradient (`from-indigo-600 to-purple-600`) for primary actions, white cards with `rounded-2xl` and light borders, `max-w-site` for page width.
- **Buttons:** give every button and button-styled link the class `btn-shine` (coloured or dark buttons) or `btn-shine btn-shine-soft` (white or light ones). On hover a band of light sweeps once from the top-left to the bottom-right corner; it's defined in `styles/globals.css` and is off for reduced motion. It makes the element `position: relative` with `overflow: hidden`, so don't add it to elements that show content outside their box (menus, tooltips) or that already use `before:` classes. Navigation links, tabs, toggles and menu items don't get it.
- **Typography:** `h1`–`h4` use the heading font automatically (`styles/globals.css`); add `font-display` for anything else that should match, such as the logo or big numbers. The fonts are set as CSS variables on `:root` in `pages/_app.js`, so pop-ups portaled into `<body>` get them too. The build needs to reach Google Fonts once to download them; nothing is fetched from Google when the site runs, so the CSP needs no font domains.
- **Motion:** animations are decoration only. Use `motion-safe:` / `motion-reduce:` so they stop for people who turn motion off (the count-up stats, floating cards and smooth scrolling already do). Smooth scrolling for in-page links comes from `styles/globals.css` plus `data-scroll-behavior="smooth"` on `<html>` in `pages/_document.js`, which makes Next.js jump instantly on page changes. Landing page sections that the header links to need an `id` and an entry in `SECTION_LINKS` (`components/SiteHeader.js`).
- **Colour contrast:** text must meet WCAG AA (4.5:1, or 3:1 for large text). On white, `gray-500`/`slate-500` is the lightest grey allowed for text; don't use `gray-400` or lighter for anything people need to read.
- **Keep the docs current.** Any change that adds, changes or removes a feature, page, API route, environment variable, database field, dependency or deploy step updates the matching part of this guide (and the README if it's affected) **in the same commit**. Delete the docs for anything you remove. Never put secrets or private server details in either file: the repository is public.

## Deploying

**Every push to `main` goes live** (about 3 minutes). Use a branch for work that isn't ready.

`.github/workflows/deploy.yml` connects to the server over SSH, moves the app to the pushed commit and runs `scripts/deploy.sh`:

1. Installs dependencies (only when `package-lock.json` changed).
2. Applies database migrations.
3. Checks there's enough memory for a build, then builds the new version next to the running one.
4. Swaps it in and restarts the app (a few seconds of downtime).
5. Checks the site answers. If not, it puts the previous build back and the workflow fails, and GitHub emails you.

- **Watch or re-run** deploys in the repository's **Actions** tab (**Run workflow** redeploys `main`).
- **Undo a bad release:** `git revert <commit>` and push.
- **Migrations run before the new code is live**, and undoing a release doesn't undo the database. Keep migrations backward compatible: adding tables and columns (with defaults) is safe; to rename or remove a column, first deploy code that no longer uses it, then remove it in a later release.
- **`NEXT_PUBLIC_*` values are baked in at build time.** After changing one on the server, redeploy. Other `.env` changes only need an app restart.
- Files on the server other than `.env` are reset on every deploy, so change them in git, not on the server.

## Production

- The app runs with **PM2** (process `qr-genie-next`, started with `npm start`) behind **Nginx**, which handles HTTPS (Let's Encrypt, renewed automatically). PM2 restarts the app on crashes and reboots.
- The app listens on `127.0.0.1:3000` only; Nginx forwards requests to it and **must pass the visitor's address** (`X-Real-IP` and `X-Forwarded-For`). Scan analytics and rate limits depend on it. If a CDN or proxy is ever added in front of Nginx, configure Nginx's real-IP handling first.
- Production secrets live in the `.env` file in the app folder on the server.
- The app sends its own security headers in production (see `next.config.js`).
- Useful commands on the server: `pm2 list`, `pm2 logs qr-genie-next`, `pm2 restart qr-genie-next`, `sudo nginx -t && sudo systemctl reload nginx`.

## Troubleshooting

| Problem | Check |
|---|---|
| Site shows 502 | The app isn't running: `pm2 list`, then `pm2 logs qr-genie-next`. |
| Deploy failed | Actions tab → the failed run shows which step broke. If the health check failed, the previous version is already back. |
| Deploy stops during the build with `Killed` (exit 137), or says there's too little memory | The server ran out of memory. The build needs about 1.5 GB including swap: check `swapon --show`, and that the swap file is listed in `/etc/fstab` so it comes back after a reboot. |
| Deploy can't connect (`i/o timeout` on port 22) | The server's firewall must allow SSH, and the repository's deploy secrets must be correct. |
| Prisma `P1001` | The database can't be reached; check that PostgreSQL is running and `DATABASE_URL`. |
| Prisma `P2002` | A unique value already exists (e.g. an email that's already registered). |
| Emails not arriving | `npm run email:test -- you@example.com`; check the SMTP settings and the SES console. |
| "Please complete the security check" on every form | The Turnstile site key doesn't allow this hostname. Locally, use the test keys. |
| Browser console shows "Content Security Policy" errors | A new third-party resource isn't in the policy in `next.config.js`. |
| A visitor can't open a protected QR code | They may have hit the guessing limit ("Too many attempts"): it clears after 15 minutes. The owner can set a new password on the code's details page. |
| Something changed in `schema.prisma` but the app doesn't see it | Run `npx prisma generate` and restart the app. |

**After a deploy**, a quick check on the live site: log in, create a code, scan it with a phone and see the scan counted, open Analytics. For changes to payments or email, also start a checkout and request a password reset.

## Not built yet

- **Self-service cancellation** and handling of Razorpay cancellation/failed-payment events.
- **Translations:** only English is available, although a language can be chosen in the account settings.
- **Other QR types** (PDF, vCard, menus, …) are defined but not released.
