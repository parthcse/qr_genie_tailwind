import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";
import { validateRedirectUrl } from "../../../../lib/redirectValidation";

/**
 * GET /api/qrs/[id] - Fetch single QR (owner only). For detail page.
 * PUT /api/qrs/[id] - Update targetUrl and/or pausedMessage (owner only, validate targetUrl).
 */
export default async function handler(req, res) {
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
    include: {
      folder: { select: { id: true, name: true } },
    },
  });
  if (!qr) {
    return res.status(404).json({ error: "QR code not found" });
  }

  if (req.method === "GET") {
    return res.status(200).json({
      qrCode: {
        id: qr.id,
        slug: qr.slug,
        name: qr.name,
        type: qr.type,
        status: qr.status,
        linkType: qr.linkType,
        targetUrl: qr.targetUrl,
        pausedMessage: qr.pausedMessage,
        scanCount: qr.scanCount,
        createdAt: qr.createdAt,
        updatedAt: qr.updatedAt,
        folderId: qr.folderId,
        folder: qr.folder,
      },
    });
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    const { targetUrl, pausedMessage } = req.body || {};
    const updates = {};

    if (targetUrl !== undefined) {
      if (qr.linkType === "STATIC") {
        return res.status(400).json({ error: "Static QR codes do not support changing the target URL" });
      }
      const trimmed = typeof targetUrl === "string" ? targetUrl.trim() : "";
      if (!trimmed) {
        return res.status(400).json({ error: "targetUrl is required" });
      }
      const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : "https://" + trimmed;
      const validation = validateRedirectUrl(withProtocol);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error || "Invalid URL" });
      }
      updates.targetUrl = validation.url;
    }

    if (pausedMessage !== undefined) {
      updates.pausedMessage = pausedMessage === null || pausedMessage === "" ? null : String(pausedMessage).trim().slice(0, 500);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(200).json({ success: true, qrCode: qr });
    }

    const updated = await prisma.qRCode.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
        status: true,
        linkType: true,
        targetUrl: true,
        pausedMessage: true,
        scanCount: true,
        updatedAt: true,
      },
    });
    return res.status(200).json({ success: true, qrCode: updated });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
