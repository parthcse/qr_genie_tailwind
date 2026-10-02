import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";
import { getClientIp } from "../../../lib/clientIp";
import { isRateLimited } from "../../../lib/rateLimit";
import { emailConfigured } from "../../../lib/email";
import { confirmEmailChange, cancelEmailChange, sendEmailChangeCode, resendWaitSeconds } from "../../../lib/emailVerification";

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

const MESSAGES = {
  expired: "This code has expired. Send a new one below.",
  locked: "Too many wrong tries for this code. Send a new one below.",
  missing: "There's no active code. Send a new one below.",
  none: "There's no email change waiting. Enter the new address in the form first.",
  taken: "Another account started using that address in the meantime, so we couldn't switch to it.",
};

/**
 * The pending email change of the signed-in user (started from PUT /api/account/update):
 * GET    -> { pendingEmail, resendIn }
 * POST   { code } -> confirm; the new address becomes the sign-in email (30 tries per 15 minutes per IP, 5 per code)
 * PUT    -> send a new code to the pending address (one a minute, 5 an hour)
 * DELETE -> cancel the change
 */
export default async function handler(req, res) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Please log in again." });
  }

  try {
    const row = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true, pendingEmail: true, emailCodeSentAt: true } });

    if (req.method === "GET") {
      return res.status(200).json({ pendingEmail: row.pendingEmail, resendIn: row.pendingEmail ? resendWaitSeconds(row.emailCodeSentAt) : 0 });
    }

    if (req.method === "POST") {
      if (isRateLimited(`email-change-code-ip:${getClientIp(req)}`, FIFTEEN_MINUTES, 30)) {
        return res.status(429).json({ error: "Too many tries. Please wait 15 minutes and try again." });
      }
      const code = String(req.body?.code ?? "").replace(/\D/g, "");
      if (code.length !== 6) {
        return res.status(400).json({ error: "Enter the 6-digit code from the email." });
      }
      const result = await confirmEmailChange(user.id, code);
      if (result.ok) {
        return res.status(200).json({ changed: true, email: result.email });
      }
      if (result.reason === "invalid") {
        const tries = result.triesLeft === 1 ? "1 try" : `${result.triesLeft} tries`;
        return res.status(400).json({ error: `That code isn't right. ${tries} left.`, triesLeft: result.triesLeft });
      }
      return res.status(400).json({ error: MESSAGES[result.reason] || MESSAGES.missing, reason: result.reason, triesLeft: 0 });
    }

    if (req.method === "PUT") {
      if (!row.pendingEmail) {
        return res.status(400).json({ error: MESSAGES.none, reason: "none" });
      }
      const wait = resendWaitSeconds(row.emailCodeSentAt);
      if (wait > 0) {
        return res.status(429).json({ error: `Please wait ${wait} seconds before asking for another code.`, retryAfter: wait });
      }
      if (isRateLimited(`email-change-resend:${user.id}`, HOUR, 5) || isRateLimited(`email-change-resend-ip:${getClientIp(req)}`, HOUR, 20)) {
        return res.status(429).json({ error: "You've asked for a lot of codes. Please try again in an hour." });
      }
      const sent = await sendEmailChangeCode({ id: user.id, name: row.name }, row.pendingEmail);
      if (!sent && emailConfigured()) {
        return res.status(502).json({ error: "We couldn't send the email just now. Please try again in a minute." });
      }
      return res.status(200).json({ sent: true, pendingEmail: row.pendingEmail, resendIn: resendWaitSeconds(new Date()) });
    }

    if (req.method === "DELETE") {
      await cancelEmailChange(user.id);
      return res.status(200).json({ cancelled: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Email change:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
