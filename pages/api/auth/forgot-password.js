import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { createResetToken } from "@/lib/resetToken";
import { getClientIp } from "@/lib/clientIp";
import { isRateLimited } from "@/lib/rateLimit";
import { verifyTurnstile } from "@/lib/turnstile";

const HOUR = 60 * 60 * 1000;
// Same answer whether or not the account exists, so this can't be used to discover accounts
const DONE = { message: "If an account with that email exists, we've sent you a password reset link." };

/**
 * POST /api/auth/forgot-password
 * Abuse protection: 5 requests per hour per IP, 3 reset emails per hour per address, Cloudflare Turnstile.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, turnstileToken } = req.body || {};
  if (typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ error: "Email is required." });
  }
  const cleanEmail = email.trim().toLowerCase();

  const ip = getClientIp(req);
  if (isRateLimited(`forgot-ip:${ip}`, HOUR, 5)) {
    return res.status(429).json({ error: "Too many requests. Please try again in an hour." });
  }

  const human = await verifyTurnstile(turnstileToken, ip);
  if (!human.ok) {
    return res.status(400).json({ error: "Please complete the security check and try again.", turnstile: true });
  }

  // Stop anyone flooding one inbox with reset emails
  if (isRateLimited(`forgot-email:${cleanEmail}`, HOUR, 3)) {
    return res.status(200).json(DONE);
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: cleanEmail }, select: { id: true, email: true, name: true } });
    if (!user) return res.status(200).json(DONE);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
    if (!appUrl) {
      console.error("NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_BASE_URL is not set");
      return res.status(500).json({ error: "Something went wrong. Please try again later." });
    }

    const { token, tokenHash } = createResetToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: tokenHash, resetTokenExpires: new Date(Date.now() + HOUR) },
    });

    const resetUrl = `${appUrl.replace(/\/$/, "")}/auth/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl, user.name);
    return res.status(200).json(DONE);
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: "Something went wrong. Please try again later." });
  }
}
