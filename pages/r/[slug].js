/**
 * Redirect handler: GET /r/:slug
 * Lookup by slug. Not found or DELETED → "QR not found or removed". PAUSED → configurable paused page (no redirect, no scan).
 * ACTIVE → validate targetUrl, log scan (ipHash, device, browser, geo), increment scanCount, 302 redirect. WiFi type shows connection page.
 */
// pages/r/[slug].js
import prisma from "../../lib/prisma";
import { validateRedirectUrl } from "../../lib/redirectValidation";
import { hashIp, getDeviceFingerprint, getDeviceType, getBrowser, getOS } from "../../lib/scanUtils";
import { getGeoFromIp } from "../../lib/geoIp";
import { isRateLimited } from "../../lib/rateLimit";

/**
 * Extract client IP from request headers (handles Nginx/proxy forwarding).
 * Checks multiple headers in order: cf-connecting-ip, x-forwarded-for, x-real-ip, true-client-ip, cf-connecting-ipv6
 */
function getClientIp(req) {
  // Cloudflare
  if (req.headers["cf-connecting-ip"]) {
    const ip = req.headers["cf-connecting-ip"];
    if (typeof ip === "string") return ip.split(",")[0].trim();
  }
  
  // Standard proxy headers
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor && typeof forwardedFor === "string") {
    // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
    return forwardedFor.split(",")[0].trim();
  }
  
  // Nginx real IP
  if (req.headers["x-real-ip"]) {
    const ip = req.headers["x-real-ip"];
    if (typeof ip === "string") return ip.split(",")[0].trim();
  }
  
  // Other common headers
  if (req.headers["true-client-ip"]) {
    const ip = req.headers["true-client-ip"];
    if (typeof ip === "string") return ip.split(",")[0].trim();
  }
  
  // IPv6 Cloudflare
  if (req.headers["cf-connecting-ipv6"]) {
    const ip = req.headers["cf-connecting-ipv6"];
    if (typeof ip === "string") return ip.split(",")[0].trim();
  }
  
  // Fallback to socket address (direct connection)
  return req.socket?.remoteAddress || null;
}

export async function getServerSideProps({ params, req }) {
  const { slug } = params;

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return { props: { view: "rate_limited" } };
  }

  const qr = await prisma.qRCode.findUnique({
    where: { slug },
    include: { user: true },
  });

  // Not found or soft-deleted: show "QR not found or removed"
  if (!qr || qr.status === "DELETED") {
    return { props: { view: "not_found" } };
  }

  // Paused: show configurable paused page; do not log scan (Option A)
  if (qr.status === "PAUSED") {
    const reason = qr.deactivatedReason || null;
    const pausedMessage = qr.pausedMessage && qr.pausedMessage.trim() ? qr.pausedMessage.trim() : null;
    return {
      props: {
        view: "paused",
        pausedMessage,
        reason,
      },
    };
  }

  // ACTIVE: legacy trial/subscription check
  const user = qr.user;
  const now = new Date();
  let expired = false;
  if (
    user &&
    user.subscriptionPlan === "TRIAL" &&
    user.trialEndsAt &&
    new Date(user.trialEndsAt) < now
  ) {
    expired = true;
  }
  if (expired) {
    try {
      await prisma.qRCode.update({
        where: { slug },
        data: {
          status: "PAUSED",
          isActive: false,
          deactivatedReason: "TRIAL_EXPIRED",
        },
      });
    } catch (e) {
      console.error("Failed to pause expired QR code:", e);
    }
    return {
      props: {
        view: "paused",
        pausedMessage: null,
        reason: "TRIAL_EXPIRED",
      },
    };
  }

  const ua = req.headers["user-agent"] || "";
  const referer = req.headers["referer"] || req.headers["referrer"] || null;
  const os = getOS(ua);
  const deviceType = getDeviceType(ua);
  const browser = getBrowser(ua);
  const ipHashVal = hashIp(ip);
  const geo = getGeoFromIp(ip);

  // Debug logging (development only)
  if (process.env.NODE_ENV !== "production" && !ip) {
    console.warn(`[QR Redirect] No IP extracted for slug: ${slug}. Headers:`, {
      "x-forwarded-for": req.headers["x-forwarded-for"],
      "x-real-ip": req.headers["x-real-ip"],
      "cf-connecting-ip": req.headers["cf-connecting-ip"],
      "true-client-ip": req.headers["true-client-ip"],
      socket: req.socket?.remoteAddress,
    });
  }
  
  if (process.env.NODE_ENV !== "production" && ip && !geo.country) {
    console.warn(`[QR Redirect] IP ${ip} has no geo data for slug: ${slug}`);
  }

  // WiFi: show connection page (no redirect)
  if (qr.type === "wifi") {
    const meta = qr.meta ? JSON.parse(qr.meta) : {};
    try {
      await prisma.scanEvent.create({
        data: {
          qrCodeId: qr.id,
          userAgent: ua || null,
          ip: null,
          ipHash: ipHashVal,
          os,
          deviceType,
          browser,
          referer,
          country: geo.country,
          region: geo.region,
          city: geo.city,
        },
      });
    } catch (e) {
      console.error("ScanEvent create error:", e);
    }
    await prisma.qRCode.update({
      where: { slug },
      data: { scanCount: qr.scanCount + 1 },
    });
    return {
      props: {
        wifiInfo: {
          ssid: meta.ssid || "Wi-Fi Network",
          security: meta.security || "WPA",
          hidden: meta.hidden || false,
        },
      },
    };
  }

  // Validate targetUrl for redirect
  if (!qr.targetUrl || !qr.targetUrl.trim()) {
    console.error(`QR code ${qr.slug} has no targetUrl`);
    const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "/";
    return { redirect: { destination: base, permanent: false } };
  }

  let destinationUrl = qr.targetUrl.trim();
  if (!destinationUrl.match(/^https?:\/\//i)) {
    destinationUrl = "https://" + destinationUrl;
  }
  const validation = validateRedirectUrl(destinationUrl);
  if (!validation.valid) {
    console.error(`QR code ${qr.slug} invalid targetUrl:`, validation.error);
    const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "/";
    return { redirect: { destination: base, permanent: false } };
  }
  destinationUrl = validation.url;

  // Log scan (do not block redirect on failure)
  try {
    await prisma.scanEvent.create({
      data: {
        qrCodeId: qr.id,
        userAgent: ua || null,
        ip: null,
        ipHash: ipHashVal,
        os,
        deviceType,
        browser,
        referer,
        country: geo.country,
        region: geo.region,
        city: geo.city,
      },
    });
  } catch (e) {
    console.error("ScanEvent create error:", e);
  }

  await prisma.qRCode.update({
    where: { slug },
    data: { scanCount: qr.scanCount + 1 },
  });

  return {
    redirect: {
      destination: destinationUrl,
      permanent: false,
    },
  };
}

const baseUrl = () => process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "/";

export default function RedirectPage({ view, pausedMessage, reason, wifiInfo }) {
  if (view === "not_found") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold text-slate-900">QR not found or removed</h1>
          <p className="mb-4 text-sm text-slate-600">
            This QR code does not exist or has been removed.
          </p>
          <a
            href={baseUrl()}
            className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
          >
            Go to QR-Genie
          </a>
        </div>
      </div>
    );
  }

  if (view === "rate_limited") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold text-slate-900">Too many requests</h1>
          <p className="mb-4 text-sm text-slate-600">Please try again in a minute.</p>
          <a
            href={baseUrl()}
            className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
          >
            Go to QR-Genie
          </a>
        </div>
      </div>
    );
  }

  if (view === "paused") {
    const reasonMessage =
      reason === "TRIAL_EXPIRED"
        ? "Your 14-day free trial has expired. Subscribe to a plan to reactivate your QR codes."
        : reason === "SUBSCRIPTION_EXPIRED"
        ? "Your subscription has expired. Please renew to reactivate your QR codes."
        : pausedMessage || "This campaign is not active right now.";

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold text-slate-900">QR code paused</h1>
          <p className="mb-4 text-sm text-slate-600">{reasonMessage}</p>
          <a
            href={baseUrl()}
            className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
          >
            Go to QR-Genie
          </a>
        </div>
      </div>
    );
  }

  if (wifiInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-indigo-100 bg-white p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
          </div>
          <div className="text-center mb-8">
            <p className="text-lg font-medium text-gray-900">Join the &quot;{wifiInfo.ssid}&quot; Wi-fi network?</p>
            {wifiInfo.hidden && <p className="text-xs text-gray-500 mt-2">Hidden network</p>}
            <p className="text-xs text-gray-500 mt-1">Security: {wifiInfo.security}</p>
          </div>
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800 text-center">
              Scan this QR code with your phone&apos;s camera to connect automatically.
            </p>
          </div>
          <div className="space-y-3">
            <button
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              onClick={() => window.close()}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
