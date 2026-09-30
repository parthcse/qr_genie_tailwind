import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { hashResetToken } from "../../../lib/resetToken";
import { getClientIp } from "../../../lib/clientIp";
import { isRateLimited } from "../../../lib/rateLimit";

const HOUR = 60 * 60 * 1000;

/**
 * POST /api/auth/reset-password
 * Sets a new password from an emailed reset link, then signs out every existing session.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, password, confirmPassword } = req.body || {};
  if (!token || !password || !confirmPassword) {
    return res.status(400).json({ error: "Token, password, and confirmation are required." });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match." });
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: "Password must be 8 to 128 characters long." });
  }

  if (isRateLimited(`reset-ip:${getClientIp(req)}`, HOUR, 10)) {
    return res.status(429).json({ error: "Too many attempts. Please try again in an hour." });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { resetToken: hashResetToken(token), resetTokenExpires: { gt: new Date() } },
      select: { id: true },
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid or expired reset link. Please request a new password reset link." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(password, 10),
        resetToken: null,
        resetTokenExpires: null,
        sessionVersion: { increment: 1 }, // sign out everywhere
      },
    });

    return res.status(200).json({ message: "Password has been reset successfully. You can now log in with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "Something went wrong. Please try again later." });
  }
}
