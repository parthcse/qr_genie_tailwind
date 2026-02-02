// pages/api/duplicate-qr.js
import prisma from "../../lib/prisma";
import { getUserFromRequest } from "../../lib/auth";
import { nanoid } from "nanoid";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "QR code ID is required" });
    }

    // Get the original QR code
    const originalQR = await prisma.qRCode.findUnique({
      where: { id: String(id) },
    });

    if (!originalQR) {
      return res.status(404).json({ error: "QR code not found" });
    }

    if (originalQR.userId !== user.id) {
      return res.status(403).json({ error: "You don't have permission to duplicate this QR code" });
    }

    // Create a duplicate with new slug
    const newSlug = nanoid(6);
    const duplicateQR = await prisma.qRCode.create({
      data: {
        slug: newSlug,
        type: originalQR.type,
        targetUrl: originalQR.targetUrl,
        name: `${originalQR.name || 'QR Code'} (Copy)`,
        qrColor: originalQR.qrColor,
        bgColor: originalQR.bgColor,
        meta: originalQR.meta,
        userId: user.id,
        folderId: originalQR.folderId,
      },
    });

    return res.status(200).json({ 
      success: true, 
      qrCode: duplicateQR,
      message: "QR code duplicated successfully" 
    });
  } catch (error) {
    console.error("Duplicate QR code error:", error);
    return res.status(500).json({ error: "Failed to duplicate QR code" });
  }
}
