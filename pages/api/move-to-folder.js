// pages/api/move-to-folder.js
import prisma from "../../lib/prisma";
import { getUserFromRequest } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { qrCodeId, folderId } = req.body;

    if (!qrCodeId) {
      return res.status(400).json({ error: "QR code ID is required" });
    }

    // Get the QR code
    const qrCode = await prisma.qRCode.findUnique({
      where: { id: String(qrCodeId) },
    });

    if (!qrCode) {
      return res.status(404).json({ error: "QR code not found" });
    }

    if (qrCode.userId !== user.id) {
      return res.status(403).json({ error: "You don't have permission to move this QR code" });
    }

    // If folderId is provided, verify it belongs to the user
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: String(folderId) },
      });

      if (!folder) {
        return res.status(404).json({ error: "Folder not found" });
      }

      if (folder.userId !== user.id) {
        return res.status(403).json({ error: "You don't have permission to use this folder" });
      }
    }

    // Update the QR code's folder
    const updatedQR = await prisma.qRCode.update({
      where: { id: String(qrCodeId) },
      data: {
        folderId: folderId ? String(folderId) : null,
      },
    });

    return res.status(200).json({ 
      success: true, 
      qrCode: updatedQR,
      message: folderId ? "QR code moved to folder successfully" : "QR code removed from folder successfully"
    });
  } catch (error) {
    console.error("Move to folder error:", error);
    return res.status(500).json({ error: "Failed to move QR code to folder" });
  }
}
