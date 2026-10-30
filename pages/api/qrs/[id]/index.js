import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { validateRedirectUrl } from "@/lib/qr/redirectValidation";
import { qrPasswordProblem, hashQrPassword } from "@/lib/qr/qrPassword";
import { isPageType } from "@/lib/qr/qrTypes";
import { normalizeContent } from "@/lib/qr/qrContent";

function parseMeta(meta) {
  try {
    const parsed = meta ? JSON.parse(meta) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * GET /api/qrs/[id] - Fetch single QR (owner only). For detail page; hosted pages also get their `content`.
 * PUT /api/qrs/[id] - Update targetUrl, pausedMessage and/or the scan password
 *   (`password` sets or changes it, `removePassword: true` turns protection off). Owner only.
 *   Hosted pages (list of links, ...) change `content` instead of targetUrl; it's checked like a new code's.
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

  const found = await prisma.qRCode.findFirst({
    where: { id: String(id), userId: user.id, status: { not: "DELETED" } },
    include: {
      folder: { select: { id: true, name: true } },
    },
    omit: { passwordHash: false },
  });
  if (!found) {
    return res.status(404).json({ error: "QR code not found" });
  }
  const { passwordHash, ...qr } = found;
  const hasPassword = !!passwordHash;
  const isPage = isPageType(qr.type);

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
        hasPassword,
        ...(isPage ? { content: parseMeta(qr.meta).content || null } : {}),
      },
    });
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    const { targetUrl, pausedMessage, password, removePassword, content } = req.body || {};
    const updates = {};

    if (removePassword === true) {
      updates.passwordHash = null;
    } else if (password !== undefined) {
      if (qr.linkType === "STATIC" || qr.type === "wifi") {
        return res.status(400).json({ error: "Only dynamic QR codes can be password protected." });
      }
      if (isPage) {
        return res.status(400).json({ error: "Password protection is only available for codes that open a link." });
      }
      const problem = qrPasswordProblem(password);
      if (problem) {
        return res.status(400).json({ error: problem });
      }
      updates.passwordHash = await hashQrPassword(password);
    }

    if (content !== undefined) {
      if (!isPage) {
        return res.status(400).json({ error: "This QR code doesn't have a page to edit." });
      }
      const normalized = normalizeContent(qr.type, content);
      if (normalized.error) {
        return res.status(400).json({ error: normalized.error });
      }
      // Keep the rest of meta (the QR design) as it is
      updates.meta = JSON.stringify({ ...parseMeta(qr.meta), content: normalized.content });
    }

    if (targetUrl !== undefined) {
      if (qr.linkType === "STATIC") {
        return res.status(400).json({ error: "Static QR codes do not support changing the target URL" });
      }
      if (isPage) {
        return res.status(400).json({ error: "Edit this page's content instead of its link." });
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
      return res.status(200).json({ success: true, qrCode: { ...qr, hasPassword } });
    }

    const updated = await prisma.qRCode.update({
      where: { id: qr.id },
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
    const nowProtected = "passwordHash" in updates ? !!updates.passwordHash : hasPassword;
    return res.status(200).json({
      success: true,
      qrCode: { ...updated, hasPassword: nowProtected, ...(updates.meta ? { content: JSON.parse(updates.meta).content } : {}) },
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
