// pages/api/analytics/overview.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";
import { getDeviceFingerprint } from "../../../lib/scanUtils";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 365;

const clamp = (value, min, max, fallback) => {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : Math.min(max, Math.max(min, n));
};

// One visitor = same hashed IP + same browser; falls back to the IP hash alone
const visitorKey = (ev) => getDeviceFingerprint(ev.ipHash, ev.userAgent || "") || ev.ipHash || null;

const countBy = (items, keyOf) => {
  const map = new Map();
  for (const item of items) {
    const key = keyOf(item);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
};

const deviceLabel = (ev) => {
  const d = (ev.deviceType || "").toLowerCase();
  if (d === "mobile" || d === "tablet" || d === "desktop") return d[0].toUpperCase() + d.slice(1);
  const ua = (ev.userAgent || "").toLowerCase();
  if (ua.includes("ipad") || ua.includes("tablet")) return "Tablet";
  if (ua.includes("mobile")) return "Mobile";
  if (/windows|macintosh|linux/.test(ua)) return "Desktop";
  return "Unknown";
};

/**
 * GET /api/analytics/overview?days=30&qrId=...&tz=-330
 * Scan statistics for the signed-in user's codes (or one code) over the last `days` days, in the viewer's
 * time zone (`tz` = minutes from Date.getTimezoneOffset()), compared with the period just before.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const days = clamp(req.query.days, 1, MAX_DAYS, 30);
  const tz = clamp(req.query.tz, -840, 840, 0); // minutes behind UTC, as the browser reports it
  const qrId = typeof req.query.qrId === "string" && req.query.qrId ? req.query.qrId : null;

  try {
    const codes = await prisma.qRCode.findMany({
      where: { userId: user.id },
      select: { id: true, slug: true, name: true, type: true, status: true, linkType: true },
      orderBy: { createdAt: "desc" },
    });
    if (qrId && !codes.some((c) => c.id === qrId)) {
      return res.status(404).json({ error: "QR code not found" });
    }

    // Local-time helpers: shift a UTC instant into the viewer's clock, then read it with getUTC*
    const toLocal = (date) => new Date(date.getTime() - tz * 60 * 1000);
    const localDayKey = (date) => toLocal(date).toISOString().slice(0, 10);
    const nowLocal = toLocal(new Date());
    const todayStartLocal = Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate());
    const since = new Date(todayStartLocal - (days - 1) * DAY_MS + tz * 60 * 1000); // local midnight, `days` days ago
    const previousSince = new Date(since.getTime() - days * DAY_MS);

    const scope = { qrCode: { userId: user.id }, ...(qrId ? { qrCodeId: qrId } : {}) };
    const fields = { createdAt: true, ipHash: true, userAgent: true, os: true, deviceType: true, browser: true, country: true, city: true, qrCodeId: true };
    const [events, previousEvents] = await Promise.all([
      prisma.scanEvent.findMany({ where: { ...scope, createdAt: { gte: since } }, select: fields, orderBy: { createdAt: "asc" } }),
      prisma.scanEvent.findMany({ where: { ...scope, createdAt: { gte: previousSince, lt: since } }, select: { ipHash: true, userAgent: true } }),
    ]);

    const uniqueCount = (list) => new Set(list.map(visitorKey).filter(Boolean)).size;

    // Every day in the period, including days without scans
    const dayBuckets = new Map();
    for (let i = 0; i < days; i++) {
      const key = new Date(todayStartLocal - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10);
      dayBuckets.set(key, { date: key, scans: 0, visitors: new Set() });
    }
    // Weekday (Mon = 0) x hour heatmap in local time
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
    const perCode = new Map();

    for (const ev of events) {
      const bucket = dayBuckets.get(localDayKey(ev.createdAt));
      const key = visitorKey(ev);
      if (bucket) {
        bucket.scans += 1;
        if (key) bucket.visitors.add(key);
      }
      const local = toLocal(ev.createdAt);
      heatmap[(local.getUTCDay() + 6) % 7][local.getUTCHours()] += 1;

      const stats = perCode.get(ev.qrCodeId) || { scans: 0, visitors: new Set(), lastScanAt: null };
      stats.scans += 1;
      if (key) stats.visitors.add(key);
      stats.lastScanAt = ev.createdAt;
      perCode.set(ev.qrCodeId, stats);
    }

    const daily = [...dayBuckets.values()].map((d) => ({ date: d.date, scans: d.scans, unique: d.visitors.size }));
    const codesById = new Map(codes.map((c) => [c.id, c]));
    const codePerformance = [...perCode.entries()]
      .map(([id, s]) => {
        const code = codesById.get(id) || {};
        return {
          id,
          name: code.name || code.slug || "QR code",
          type: code.type || "website",
          status: code.status || "ACTIVE",
          linkType: code.linkType || "DYNAMIC",
          scans: s.scans,
          unique: s.visitors.size,
          lastScanAt: s.lastScanAt,
        };
      })
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 50);

    const busiest = daily.reduce((best, d) => (d.scans > (best?.scans || 0) ? d : best), null);

    return res.status(200).json({
      period: { days, since, until: new Date() },
      totals: {
        scans: events.length,
        unique: uniqueCount(events),
        previousScans: previousEvents.length,
        previousUnique: uniqueCount(previousEvents),
        busiestDay: busiest ? { date: busiest.date, scans: busiest.scans } : null,
      },
      daily,
      heatmap,
      devices: countBy(events, deviceLabel),
      operatingSystems: countBy(events, (ev) => ev.os || "Unknown").slice(0, 8),
      browsers: countBy(events, (ev) => ev.browser || "Unknown").slice(0, 8),
      countries: countBy(events, (ev) => ev.country || "Unknown").slice(0, 10),
      cities: countBy(events, (ev) => (ev.city ? `${ev.city}${ev.country ? `, ${ev.country}` : ""}` : "Unknown")).slice(0, 10),
      codePerformance,
      // Codes to pick from: everything not deleted, plus a deleted one if it's the one being viewed
      qrCodes: codes
        .filter((c) => c.status !== "DELETED" || c.id === qrId)
        .map((c) => ({ id: c.id, name: c.name || c.slug, type: c.type, status: c.status, linkType: c.linkType })),
    });
  } catch (error) {
    console.error("Analytics overview error:", error);
    return res.status(500).json({ error: "Couldn't load analytics. Please try again." });
  }
}
