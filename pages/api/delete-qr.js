// pages/api/delete-qr.js
import prisma from "../../lib/prisma";
import { getUserFromRequest } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Accept id from query (reliable for DELETE) or body
    const id = req.query.id || req.body?.id;

    if (!id) {
      return res.status(400).json({ error: "QR code ID is required" });
    }

    // Check if QR code exists and belongs to the user
    const qrCode = await prisma.qRCode.findUnique({
      where: { id: String(id) },
    });

    if (!qrCode) {
      return res.status(404).json({ error: "QR code not found" });
    }

    if (qrCode.userId !== user.id) {
      return res.status(403).json({ error: "You don't have permission to delete this QR code" });
    }

    // Soft delete: set status to DELETED so /r/:slug shows "not found", list hides it, scan history preserved
    await prisma.qRCode.update({
      where: { id: String(id) },
      data: {
        status: "DELETED",
        isActive: false,
        deactivatedReason: "MANUAL",
      },
    });

    return res.status(200).json({ success: true, message: "QR code deleted successfully" });
  } catch (error) {
    console.error("Delete QR code error:", error);
    return res.status(500).json({ error: "Failed to delete QR code" });
  }
}
