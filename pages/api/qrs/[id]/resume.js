import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";
import { getQrPauseReason } from "../../../../lib/subscription";

/**
 * POST /api/qrs/[id]/resume
 * Sets QR status to ACTIVE. Owner only, and only while their trial or subscription is active.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
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
    where: { id, userId: user.id, status: { not: "DELETED" } },
  });
  if (!qr) {
    return res.status(404).json({ error: "QR code not found" });
  }
  const pauseReason = getQrPauseReason(user);
  if (pauseReason) {
    return res.status(403).json({
      error: pauseReason === "TRIAL_EXPIRED"
        ? "Your free trial has ended. Subscribe to reactivate your QR codes."
        : "Your subscription has ended. Renew to reactivate your QR codes.",
    });
  }
  const updated = await prisma.qRCode.update({
    where: { id },
    data: {
      status: "ACTIVE",
      deactivatedReason: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      linkType: true,
    },
  });
  return res.status(200).json({ success: true, qrCode: updated });
}
