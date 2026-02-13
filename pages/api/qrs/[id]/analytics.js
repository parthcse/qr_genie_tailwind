import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";
import { getDeviceFingerprint } from "../../../../lib/scanUtils";

/**
 * GET /api/qrs/[id]/analytics?days=7|30
 * Returns per-QR analytics: totalScans, uniqueScans (by ipHash), lastScanAt, daily[], countryStats[], deviceStats[].
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "QR code ID is required" });
  }

  const qr = await prisma.qRCode.findFirst({
    where: { id, userId: user.id },
  });
  if (!qr) {
    return res.status(404).json({ error: "QR code not found" });
  }

  const daysParam = parseInt(req.query.days || "30", 10);
  const days = Number.isNaN(daysParam) ? 30 : Math.min(90, Math.max(1, daysParam));
  const since = new Date();
  since.setDate(since.getDate() - days);

  const events = await prisma.scanEvent.findMany({
    where: {
      qrCodeId: id,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalScans = events.length;
  
  // Unique scans: Use device fingerprint (IP hash + User Agent hash) for better unique device tracking
  // This distinguishes multiple devices behind the same NAT/proxy
  const uniqueKeys = new Set();
  events.forEach((e) => {
    const fingerprint = getDeviceFingerprint(e.ipHash, e.userAgent || "");
    if (fingerprint) {
      uniqueKeys.add(fingerprint);
    } else if (e.ipHash) {
      // Fallback to IP hash only if no user agent
      uniqueKeys.add(e.ipHash);
    }
  });
  const uniqueScans = uniqueKeys.size;
  const lastScanAt = events.length > 0 ? events[events.length - 1].createdAt : null;

  const dailyMap = {};
  events.forEach((ev) => {
    const d = ev.createdAt.toISOString().slice(0, 10);
    dailyMap[d] = (dailyMap[d] || 0) + 1;
  });
  const daily = Object.entries(dailyMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const countryMap = {};
  events.forEach((ev) => {
    const country = ev.country || "Unknown";
    countryMap[country] = (countryMap[country] || 0) + 1;
  });
  const countryStats = Object.entries(countryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const deviceMap = {};
  events.forEach((ev) => {
    const device = ev.deviceType || "Unknown";
    const label = device === "mobile" ? "Mobile" : device === "tablet" ? "Tablet" : device === "desktop" ? "Desktop" : device;
    deviceMap[label] = (deviceMap[label] || 0) + 1;
  });
  const deviceStats = Object.entries(deviceMap)
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);

  return res.status(200).json({
    totalScans,
    uniqueScans,
    lastScanAt,
    daily,
    countryStats,
    deviceStats,
  });
}
