import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setLoginSession } from "@/lib/auth";
import { syncSubscriptionState } from "@/lib/billing/subscriptionSync";
import { getClientIp } from "@/lib/clientIp";
import { isRateLimited } from "@/lib/rateLimit";
import { verifyTurnstile } from "@/lib/turnstile";

const WINDOW = 15 * 60 * 1000;
// Compared against when the email doesn't exist, so response time doesn't reveal which emails have accounts
const DUMMY_HASH = bcrypt.hashSync("qr-genie-timing-equaliser", 10);

/**
 * POST /api/auth/login
 * Brute-force protection: 20 attempts per 15 minutes per IP and 10 per email address, plus Cloudflare Turnstile.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, turnstileToken } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const cleanEmail = email.trim().toLowerCase();

    const ip = getClientIp(req);
    if (isRateLimited(`login-ip:${ip}`, WINDOW, 20) || isRateLimited(`login-email:${cleanEmail}`, WINDOW, 10)) {
      return res.status(429).json({ error: "Too many login attempts. Please wait 15 minutes and try again." });
    }

    const human = await verifyTurnstile(turnstileToken, ip);
    if (!human.ok) {
      return res.status(400).json({ error: "Please complete the security check and try again.", turnstile: true });
    }

    let user = await prisma.user.findUnique({ where: { email: cleanEmail }, omit: { password: false } });
    const valid = await bcrypt.compare(password.slice(0, 128), user?.password || DUMMY_HASH);
    if (!user || !valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    try {
      user = await syncSubscriptionState(user);
    } catch (subError) {
      console.error("Login: subscription sync failed:", subError);
    }

    setLoginSession(res, user);
    // emailVerified false: the login page sends them to /auth/verify-email instead of the dashboard
    return res.status(200).json({ id: user.id, email: user.email, emailVerified: !!user.emailVerifiedAt, message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login is temporarily unavailable. Please try again in a few moments." });
  }
}
