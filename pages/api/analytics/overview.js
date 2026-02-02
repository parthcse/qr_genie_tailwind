// pages/api/analytics/overview.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const daysParam = parseInt(req.query.days || "7", 10);
  const days = Number.isNaN(daysParam) ? 7 : daysParam;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const qrId = req.query.qrId || null;

  const where = {
    createdAt: { gte: since },
    qrCode: { userId: user.id },
  };

  if (qrId) {
    where.qrCodeId = qrId;
  }

  const events = await prisma.scanEvent.findMany({
    where,
    include: { qrCode: true },
    orderBy: { createdAt: "asc" },
  });

  const totalScans = events.length;

  // Unique scans (by IP)
  const uniqueIPs = new Set(events.filter(e => e.ip).map(e => e.ip));
  const uniqueScans = uniqueIPs.size;

  // Daily counts
  const dailyMap = {};
  events.forEach((ev) => {
    const d = ev.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
    dailyMap[d] = (dailyMap[d] || 0) + 1;
  });
  const daily = Object.entries(dailyMap)
    .map(([date, count]) => ({

    date,
    count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Hourly counts (for last 24 hours if days <= 1, otherwise daily)
  const hourlyMap = {};
  events.forEach((ev) => {
    const date = new Date(ev.createdAt);
    const hour = date.getHours();
    hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
  });
  const hourly = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourlyMap[i] || 0,
  }));

  // Scans by OS
  const osMap = {};
  events.forEach((ev) => {
    const os = ev.os || "Unknown";
    osMap[os] = (osMap[os] || 0) + 1;
  });
  const osStats = Object.entries(osMap)
    .map(([os, count]) => ({

    os,
    count,
    }))
    .sort((a, b) => b.count - a.count);

  // Device type detection from user agent
  const deviceMap = {};
  events.forEach((ev) => {
    const ua = (ev.userAgent || "").toLowerCase();
    let device = "Unknown";
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      device = "Mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      device = "Tablet";
    } else if (ua.includes("desktop") || ua.includes("windows") || ua.includes("macintosh") || ua.includes("linux")) {
      device = "Desktop";
    }
    deviceMap[device] = (deviceMap[device] || 0) + 1;
  });
  const deviceStats = Object.entries(deviceMap)
    .map(([device, count]) => ({
      device,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Country stats
  const countryMap = {};
  events.forEach((ev) => {
    const country = ev.country || "Unknown";
    countryMap[country] = (countryMap[country] || 0) + 1;
  });
  const countryStats = Object.entries(countryMap)
    .map(([country, count]) => ({
      country,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 countries

  // City stats
  const cityMap = {};
  events.forEach((ev) => {
    const city = ev.city || "Unknown";
    const country = ev.country || "Unknown";
    const key = `${city}, ${country}`;
    cityMap[key] = (cityMap[key] || 0) + 1;
  });
  const cityStats = Object.entries(cityMap)
    .map(([city, count]) => ({
      city,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 cities

  // QR code performance
  const qrPerformanceMap = {};
  events.forEach((ev) => {
    const qrId = ev.qrCodeId;
    if (!qrPerformanceMap[qrId]) {
      qrPerformanceMap[qrId] = {
        id: qrId,
        name: ev.qrCode.name || ev.qrCode.slug,
        scans: 0,
      };
    }
    qrPerformanceMap[qrId].scans += 1;
  });
  const qrPerformance = Object.values(qrPerformanceMap)
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 10);

  // Fetch all user QR codes for dropdown
  const qrCodes = await prisma.qRCode.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    totalScans,
    uniqueScans,
    totalQrCodes: qrCodes.length,
    daily,
    hourly,
    osStats,
    deviceStats,
    countryStats,
    cityStats,
    qrPerformance,
    qrCodes: qrCodes.map((q) => ({
      id: q.id,
      slug: q.slug,
      name: q.name || q.slug,
    })),
  });
}
