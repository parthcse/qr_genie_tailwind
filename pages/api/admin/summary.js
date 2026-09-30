
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  const user = await getUserFromRequest(req);
  // Same answer as a missing route, so the admin API isn't discoverable
  if (!user || user.role !== "admin") {
    return res.status(404).json({ error: "Not found" });
  }

  const [userCount, qrCount, totalScans, latestQrs] = await Promise.all([
    prisma.user.count(),
    prisma.qRCode.count(),
    prisma.qRCode.aggregate({ _sum: { scanCount: true } }),
    prisma.qRCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { id: true, email: true, name: true } } },
    }),
  ]);

  return res.status(200).json({
    users: userCount,
    qrCodes: qrCount,
    totalScans: totalScans._sum.scanCount || 0,
    latestQrs,
  });
}
