// pages/api/account/password.js
import prisma from "@/lib/prisma";
import { getUserFromRequest, setLoginSession } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

/**
 * PUT /api/account/password — change password (current password required).
 * Signs out every other session; this one stays signed in with a fresh cookie.
 */
export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { currentPassword, password, confirmPassword } = req.body || {};
    if (!currentPassword || !password || !confirmPassword) {
      return res.status(400).json({ error: "Current password, new password and confirmation are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "New passwords do not match." });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: "Password must be 8 to 128 characters long." });
    }

    if (isRateLimited(`password-change:${user.id}`, 15 * 60 * 1000, 5)) {
      return res.status(429).json({ error: "Too many attempts. Please wait 15 minutes and try again." });
    }

    const account = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } });
    if (!(await bcrypt.compare(String(currentPassword).slice(0, 128), account.password))) {
      return res.status(400).json({ error: "Your current password is incorrect." });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(password, 10), sessionVersion: { increment: 1 } },
      select: { id: true, sessionVersion: true },
    });
    setLoginSession(res, updated);

    return res.status(200).json({ success: true, message: "Password updated. You've been signed out on other devices." });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({ error: "Failed to update password. Please try again." });
  }
}
