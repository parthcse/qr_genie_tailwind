import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";
import { getClientIp } from "../../../lib/clientIp";
import { isRateLimited } from "../../../lib/rateLimit";
import { sendVerificationCode, resendWaitSeconds } from "../../../lib/emailVerification";
import { emailConfigured } from "../../../lib/email";

const HOUR = 60 * 60 * 1000;

/**
 * POST /api/auth/resend-verification: emails the signed-in user a new 6-digit code (the old one stops working).
 * One code a minute (stored send time), 5 an hour per account and 20 an hour per IP.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Please log in again." });
  }
  if (user.emailVerified) {
    return res.status(200).json({ verified: true });
  }

  try {
    const { emailCodeSentAt } = await prisma.user.findUnique({ where: { id: user.id }, select: { emailCodeSentAt: true } });
    const wait = resendWaitSeconds(emailCodeSentAt);
    if (wait > 0) {
      return res.status(429).json({ error: `Please wait ${wait} seconds before asking for another code.`, retryAfter: wait });
    }
    if (isRateLimited(`verify-resend:${user.id}`, HOUR, 5) || isRateLimited(`verify-resend-ip:${getClientIp(req)}`, HOUR, 20)) {
      return res.status(429).json({ error: "You've asked for a lot of codes. Please try again in an hour, or contact us." });
    }

    const sent = await sendVerificationCode(user);
    if (!sent && emailConfigured()) {
      return res.status(502).json({ error: "We couldn't send the email just now. Please try again in a minute." });
    }
    return res.status(200).json({ sent: true, retryAfter: resendWaitSeconds(new Date()) });
  } catch (err) {
    console.error("Resend verification:", err);
    return res.status(500).json({ error: "We couldn't send a new code. Please try again." });
  }
}
