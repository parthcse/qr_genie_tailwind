import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";

/**
 * POST /api/qrs/[id]/pause
 * Sets QR status to PAUSED. Only for Dynamic (trackable) QRs. Owner only.
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
    where: { id, userId: user.id },
  });
  if (!qr) {
    return res.status(404).json({ error: "QR code not found" });
  }
  if (qr.linkType === "STATIC") {
    return res.status(400).json({ error: "Static QR codes cannot be paused" });
  }
  const updated = await prisma.qRCode.update({
    where: { id },
    data: {
      status: "PAUSED",
      isActive: false,
      deactivatedReason: "MANUAL",
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
