import { getUserFromRequest } from "../../../lib/auth";
import { getClientIp } from "../../../lib/clientIp";
import { isRateLimited } from "../../../lib/rateLimit";
import { checkVerificationCode } from "../../../lib/emailVerification";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const MESSAGES = {
  expired: "This code has expired. Send a new one below.",
  locked: "Too many wrong tries for this code. Send a new one below.",
  missing: "There's no active code for your account. Send a new one below.",
};

/**
 * POST /api/auth/verify-email { code } for the signed-in user.
 * Guessing is limited by MAX_WRONG_TRIES per code (lib/emailVerification.js) and 30 tries per 15 minutes per IP.
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

  if (isRateLimited(`verify-email-ip:${getClientIp(req)}`, FIFTEEN_MINUTES, 30)) {
    return res.status(429).json({ error: "Too many tries. Please wait 15 minutes and try again." });
  }

  const code = String(req.body?.code ?? "").replace(/\D/g, "");
  if (code.length !== 6) {
    return res.status(400).json({ error: "Enter the 6-digit code from the email." });
  }

  try {
    const result = await checkVerificationCode(user.id, code);
    if (result.ok) {
      return res.status(200).json({ verified: true });
    }
    if (result.reason === "invalid") {
      const tries = result.triesLeft === 1 ? "1 try" : `${result.triesLeft} tries`;
      return res.status(400).json({ error: `That code isn't right. ${tries} left.`, triesLeft: result.triesLeft });
    }
    return res.status(400).json({ error: MESSAGES[result.reason] || MESSAGES.missing, reason: result.reason, triesLeft: 0 });
  } catch (err) {
    console.error("Verify email:", err);
    return res.status(500).json({ error: "We couldn't check the code. Please try again." });
  }
}
