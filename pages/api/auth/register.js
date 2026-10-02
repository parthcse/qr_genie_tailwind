import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { setLoginSession } from "../../../lib/auth";
import { getClientIp } from "../../../lib/clientIp";
import { isRateLimited } from "../../../lib/rateLimit";
import { verifyTurnstile } from "../../../lib/turnstile";
import { checkAccountEmail } from "../../../lib/emailCheck";
import { sendVerificationCode } from "../../../lib/emailVerification";

const HOUR = 60 * 60 * 1000;
const TRIAL_DAYS = 14;

/**
 * POST /api/auth/register
 * Bot and abuse protection: hidden honeypot field, 5 sign-ups per hour per IP, Cloudflare Turnstile,
 * and no throwaway or undeliverable email addresses. The terms must be accepted (stored as termsAcceptedAt),
 * and a 6-digit code is emailed: the account works only after it is entered (/auth/verify-email).
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { email, password, name, website, turnstileToken, acceptTerms } = req.body || {};

    // Hidden field that people never see; bots that fill it in are refused
    if (website) {
      return res.status(400).json({ success: false, error: "We couldn't create your account. Please try again." });
    }

    const ip = getClientIp(req);
    if (isRateLimited(`register:${ip}`, HOUR, 5)) {
      return res.status(429).json({ success: false, error: "Too many sign-ups from your network. Please try again in an hour." });
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, error: "Password must be 8 to 128 characters long." });
    }
    if (acceptTerms !== true) {
      return res.status(400).json({ success: false, error: "Please accept the Terms of Service and Privacy Policy to create an account.", field: "terms" });
    }

    const human = await verifyTurnstile(turnstileToken, ip);
    if (!human.ok) {
      return res.status(400).json({ success: false, error: "Please complete the security check and try again.", turnstile: true });
    }

    const emailCheck = await checkAccountEmail(email);
    if (!emailCheck.ok) {
      return res.status(400).json({ success: false, error: emailCheck.error });
    }

    const existing = await prisma.user.findUnique({ where: { email: emailCheck.email }, select: { id: true } });
    if (existing) {
      return res.status(400).json({ success: false, error: "An account with this email already exists. Please log in instead." });
    }

    const now = new Date();
    const user = await prisma.user.create({
      data: {
        email: emailCheck.email,
        password: await bcrypt.hash(password, 10),
        name: typeof name === "string" && name.trim() ? name.trim().slice(0, 100) : null,
        subscriptionPlan: "TRIAL",
        trialStartedAt: now,
        trialEndsAt: new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
        termsAcceptedAt: now,
      },
    });

    // Signed in straight away, but the dashboard stays locked until the emailed code is entered
    setLoginSession(res, user);
    const codeSent = await sendVerificationCode(user).catch((err) => {
      console.error("Register: verification email failed:", err.message);
      return false;
    });
    return res.status(201).json({ success: true, id: user.id, email: user.email, needsVerification: true, codeSent, message: "Account created successfully" });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ success: false, error: "An account with this email already exists. Please log in instead." });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, error: "Registration is temporarily unavailable. Please try again in a few moments." });
  }
}
