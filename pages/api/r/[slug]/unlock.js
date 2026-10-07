import prisma from "@/lib/prisma";
import { validateRedirectUrl } from "@/lib/qr/redirectValidation";
import { getQrPauseReason, PLAN_STATUS_FIELDS } from "@/lib/billing/subscription";
import { checkQrPassword } from "@/lib/qr/qrPassword";
import { getClientIp } from "@/lib/clientIp";
import { isRateLimited } from "@/lib/rateLimit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * POST /api/r/[slug]/unlock  { password }
 * Checks the password of a protected QR code. The destination is only revealed after the right password.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const slug = typeof req.query.slug === "string" ? req.query.slug : "";
  const ip = getClientIp(req);
  // Slow down guessing, per visitor and per code
  if (isRateLimited(`unlock:${ip}:${slug}`, FIFTEEN_MINUTES, 10) || isRateLimited(`unlock-code:${slug}`, FIFTEEN_MINUTES, 100)) {
    return res.status(429).json({ error: "Too many attempts. Please wait 15 minutes and try again." });
  }

  try {
    const qr = await prisma.qRCode.findUnique({
      where: { slug },
      include: { user: { select: PLAN_STATUS_FIELDS } }, // only what the plan check needs
      omit: { passwordHash: false },
    });
    if (!qr || qr.status !== "ACTIVE" || !qr.passwordHash || getQrPauseReason(qr.user)) {
      return res.status(404).json({ error: "This QR code isn't available." });
    }

    if (!(await checkQrPassword(req.body?.password, qr.passwordHash))) {
      return res.status(401).json({ error: "That password isn't right. Please try again." });
    }

    const destination = validateRedirectUrl(qr.targetUrl || "");
    if (!destination.valid) {
      return res.status(404).json({ error: "This QR code isn't available." });
    }
    return res.status(200).json({ url: destination.url });
  } catch (error) {
    console.error("QR unlock error:", error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
