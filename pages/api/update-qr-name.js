// pages/api/update-qr-name.js
import prisma from "../../lib/prisma";
import { getUserFromRequest } from "../../lib/auth";

export default async function handler(req, res) {
  // Set Content-Type header to ensure JSON response
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id, name } = req.body;

    if (!id) {
      return res.status(400).json({ error: "QR code ID is required" });
    }

    // Verify QR code belongs to user
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!qrCode) {
      return res.status(404).json({ error: "QR code not found" });
    }

    // Update QR code name (trim and set to null if empty)
    const updatedQrCode = await prisma.qRCode.update({
      where: { id },
      data: {
        name: name && name.trim() ? name.trim() : null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      qrCode: updatedQrCode,
    });
  } catch (error) {
    console.error("Error updating QR code name:", error);
    return res.status(500).json({ 
      error: "Failed to update QR code name",
      message: error.message || "Unknown error occurred"
    });
  }
}
