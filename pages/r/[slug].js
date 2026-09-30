/**
 * Redirect handler: GET /r/:slug — every dynamic QR code points here.
 * Not found or DELETED → "QR not found or removed". PAUSED (or the owner's plan ended) → paused page, no scan logged.
 * ACTIVE → log the scan, then: password-protected → ask for the password; WiFi → network details; otherwise 302 redirect.
 */
// pages/r/[slug].js
import { useState } from "react";
import { FaLock, FaWifi, FaCopy, FaCheck, FaEye, FaEyeSlash, FaArrowRight, FaPauseCircle, FaQuestionCircle } from "react-icons/fa";
import prisma from "../../lib/prisma";
import { validateRedirectUrl } from "../../lib/redirectValidation";
import { hashIp, getDeviceType, getBrowser, getOS } from "../../lib/scanUtils";
import { getGeoFromIp } from "../../lib/geoIp";
import { isRateLimited } from "../../lib/rateLimit";
import { getQrPauseReason } from "../../lib/subscription";
import { pauseActiveQrCodes } from "../../lib/subscriptionSync";
import { getClientIp } from "../../lib/clientIp";
import { parseWifiString } from "../../lib/qrPassword";

export async function getServerSideProps({ params, req }) {
  const slug = String(params.slug);

  const ip = getClientIp(req);
  if (isRateLimited(`scan:${ip}`)) {
    return { props: { view: "rate_limited" } };
  }

  const qr = await prisma.qRCode.findUnique({
    where: { slug },
    include: { user: true },
    omit: { passwordHash: false },
  });

  // Not found or soft-deleted: show "QR not found or removed"
  if (!qr || qr.status === "DELETED") {
    return { props: { view: "not_found" } };
  }

  // Paused: show configurable paused page; do not log scan
  if (qr.status === "PAUSED") {
    const pausedMessage = qr.pausedMessage && qr.pausedMessage.trim() ? qr.pausedMessage.trim() : null;
    return { props: { view: "paused", pausedMessage, reason: qr.deactivatedReason || null } };
  }

  // ACTIVE, but the owner's trial or subscription has ended: pause their codes
  const pauseReason = getQrPauseReason(qr.user);
  if (pauseReason) {
    try {
      await pauseActiveQrCodes(qr.user.id, pauseReason);
    } catch (e) {
      console.error("Failed to pause expired QR codes:", e);
    }
    return { props: { view: "paused", pausedMessage: null, reason: pauseReason } };
  }

  // Log the scan (never blocks the visitor)
  const ua = req.headers["user-agent"] || "";
  const geo = getGeoFromIp(ip);
  try {
    await prisma.scanEvent.create({
      data: {
        qrCodeId: qr.id,
        userAgent: ua || null,
        ip: null,
        ipHash: hashIp(ip),
        os: getOS(ua),
        deviceType: getDeviceType(ua),
        browser: getBrowser(ua),
        referer: req.headers["referer"] || req.headers["referrer"] || null,
        country: geo.country,
        region: geo.region,
        city: geo.city,
      },
    });
    await prisma.qRCode.update({ where: { id: qr.id }, data: { scanCount: { increment: 1 } } });
  } catch (e) {
    console.error("Scan logging error:", e);
  }

  // WiFi (codes made before WiFi became static-only): show the network so people can join by hand
  if (qr.type === "wifi") {
    let meta = {};
    try {
      meta = qr.meta ? JSON.parse(qr.meta) : {};
    } catch {
      meta = {};
    }
    const fromCode = parseWifiString(qr.targetUrl);
    const security = fromCode.security || meta.security || "WPA";
    return {
      props: {
        view: "wifi",
        wifi: {
          ssid: fromCode.ssid || meta.ssid || "Wi-Fi network",
          security: security === "nopass" ? "Open network" : security,
          password: security === "nopass" ? "" : fromCode.password,
          hidden: fromCode.hidden || !!meta.hidden,
        },
      },
    };
  }

  // Password protected: the destination is only sent after the right password (see /api/r/[slug]/unlock)
  if (qr.passwordHash) {
    return { props: { view: "password", slug } };
  }

  // Validate targetUrl for redirect
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "/";
  let destinationUrl = (qr.targetUrl || "").trim();
  if (!destinationUrl) {
    console.error(`QR code ${qr.slug} has no targetUrl`);
    return { redirect: { destination: base, permanent: false } };
  }
  if (!/^https?:\/\//i.test(destinationUrl)) {
    destinationUrl = "https://" + destinationUrl;
  }
  const validation = validateRedirectUrl(destinationUrl);
  if (!validation.valid) {
    console.error(`QR code ${qr.slug} invalid targetUrl:`, validation.error);
    return { redirect: { destination: base, permanent: false } };
  }

  return { redirect: { destination: validation.url, permanent: false } };
}

const baseUrl = () => process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "/";

/** Centered card used by every visitor-facing state of a scan */
function ScanCard({ icon: Icon, iconClass, title, children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-indigo-100 bg-white p-7 text-center shadow-xl shadow-indigo-500/10">
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${iconClass}`}>
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {children}
      </div>
      <a href={baseUrl()} className="mt-6 text-xs font-medium !text-gray-400 hover:!text-indigo-600">
        Made with QR Genie
      </a>
    </div>
  );
}

function PasswordView({ slug }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setChecking(true);
    setError("");
    try {
      const res = await fetch(`/api/r/${encodeURIComponent(slug)}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.replace(data.url);
        return;
      }
      setError(data.error || "Something went wrong. Please try again.");
    } catch {
      setError("Couldn't connect. Check your internet connection and try again.");
    }
    setChecking(false);
  };

  return (
    <ScanCard icon={FaLock} iconClass="bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30" title="This QR code is protected">
      <p className="mt-2 text-sm text-gray-600">Enter the password you were given to continue.</p>
      <form onSubmit={submit} className="mt-6 space-y-3 text-left">
        <label htmlFor="qr-password" className="sr-only">
          Password
        </label>
        <div className="relative">
          <input
            id="qr-password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            autoFocus
            autoComplete="off"
            maxLength={64}
            placeholder="Password"
            aria-invalid={!!error}
            className={`h-12 w-full rounded-xl border bg-white pl-4 pr-12 text-base text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
              error ? "border-red-300 focus:border-red-400 focus:ring-red-500/20" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
            }`}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 hover:text-gray-600"
          >
            {show ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={checking || !password}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60"
        >
          {checking ? "Checking…" : "Continue"}
          {!checking && <FaArrowRight className="h-3.5 w-3.5" />}
        </button>
      </form>
    </ScanCard>
  );
}

function WifiView({ wifi }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(wifi.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShow(true);
    }
  };

  return (
    <ScanCard icon={FaWifi} iconClass="bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30" title={`Join "${wifi.ssid}"`}>
      <p className="mt-2 text-sm text-gray-600">Connect to this Wi-Fi network from your phone's settings.</p>

      <dl className="mt-6 space-y-3 rounded-2xl bg-gray-50 p-4 text-left">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Network</dt>
          <dd className="mt-0.5 break-all text-base font-semibold text-gray-900">
            {wifi.ssid}
            {wifi.hidden && <span className="ml-2 text-xs font-normal text-gray-500">(hidden network)</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Security</dt>
          <dd className="mt-0.5 text-sm text-gray-800">{wifi.security}</dd>
        </div>
        {wifi.password && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Password</dt>
            <dd className="mt-1 flex items-center gap-2">
              <span className="min-w-0 flex-1 break-all font-mono text-base text-gray-900">{show ? wifi.password : "•".repeat(Math.min(wifi.password.length, 12))}</span>
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Hide password" : "Show password"}
                className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:text-gray-700"
              >
                {show ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
              </button>
            </dd>
          </div>
        )}
      </dl>

      {wifi.password && (
        <button
          type="button"
          onClick={copy}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-purple-700"
        >
          {copied ? <FaCheck className="h-4 w-4" /> : <FaCopy className="h-4 w-4" />}
          {copied ? "Password copied" : "Copy password"}
        </button>
      )}

      <ol className="mt-6 space-y-2 text-left text-sm text-gray-600">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">1</span>
          <span>
            Open <strong className="font-semibold text-gray-800">Settings → Wi-Fi</strong> on your phone.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">2</span>
          <span>
            Choose <strong className="font-semibold text-gray-800">{wifi.ssid}</strong>
            {wifi.hidden ? " (add it by name, as it's hidden)" : ""}.
          </span>
        </li>
        {wifi.password && (
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">3</span>
            <span>Paste the password and join.</span>
          </li>
        )}
      </ol>
    </ScanCard>
  );
}

export default function RedirectPage({ view, pausedMessage, reason, slug, wifi }) {
  if (view === "password") return <PasswordView slug={slug} />;
  if (view === "wifi") return <WifiView wifi={wifi} />;

  if (view === "paused") {
    const reasonMessage =
      reason === "TRIAL_EXPIRED" || reason === "SUBSCRIPTION_EXPIRED"
        ? "This QR code isn't active right now. Please check back later."
        : pausedMessage || "This campaign is not active right now.";
    return (
      <ScanCard icon={FaPauseCircle} iconClass="bg-amber-50 text-amber-500" title="QR code paused">
        <p className="mt-2 text-sm text-gray-600">{reasonMessage}</p>
      </ScanCard>
    );
  }

  if (view === "rate_limited") {
    return (
      <ScanCard icon={FaPauseCircle} iconClass="bg-gray-100 text-gray-500" title="Too many requests">
        <p className="mt-2 text-sm text-gray-600">Please try again in a minute.</p>
      </ScanCard>
    );
  }

  return (
    <ScanCard icon={FaQuestionCircle} iconClass="bg-gray-100 text-gray-500" title="QR not found or removed">
      <p className="mt-2 text-sm text-gray-600">This QR code does not exist or has been removed.</p>
    </ScanCard>
  );
}
