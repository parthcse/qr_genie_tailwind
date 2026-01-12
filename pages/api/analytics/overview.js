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

  // daily counts
  const dailyMap = {};
  events.forEach((ev) => {
    const d = ev.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
    dailyMap[d] = (dailyMap[d] || 0) + 1;
  });
  const daily = Object.entries(dailyMap).map(([date, count]) => ({
    date,
    count,
  }));

  // scans by OS
  const osMap = {};
  events.forEach((ev) => {
    const os = ev.os || "Other";
    osMap[os] = (osMap[os] || 0) + 1;
  });
  const osStats = Object.entries(osMap).map(([os, count]) => ({
    os,
    count,
  }));

  // fetch all user QR codes for dropdown
  const qrCodes = await prisma.qRCode.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    totalScans,
    totalQrCodes: qrCodes.length,
    daily,
    osStats,
    qrCodes: qrCodes.map((q) => ({
      id: q.id,
      slug: q.slug,
      name: q.name || q.slug,
    })),
  });
}
