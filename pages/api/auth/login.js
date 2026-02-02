import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { setLoginSession } from "../../../lib/auth";

// Disable body parsing limit for this route (Next.js default is 1mb)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req, res) {
  // Set Content-Type header to ensure JSON response
  res.setHeader('Content-Type', 'application/json');

  // Log request method for debugging (remove in production if needed)
  if (process.env.NODE_ENV === 'development') {
    console.log('Login API - Method:', req.method);
    console.log('Login API - Headers:', req.headers);
  }

  // Check method - be more explicit
  if (req.method !== "POST") {
    console.error(`Login API - Wrong method: ${req.method}, expected POST`);
    return res.status(405).json({ 
      error: "Method not allowed",
      received: req.method,
      expected: "POST"
    });
  }

  try {
    // Ensure body exists and is parsed
    if (!req.body) {
      console.error('Login API - No request body received');
      return res.status(400).json({ error: "Request body is required" });
    }


  const { email, password } = req.body;
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Find user
    let user;
    try {
      user = await prisma.user.findUnique({ 
        where: { email: email.trim().toLowerCase() } 
      });
    } catch (dbError) {
      console.error("Database error finding user:", dbError);
      return res.status(500).json({ 

        error: "Login is temporarily unavailable. Please try again in a few moments." 
      });
    }

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    let valid;
    try {
      valid = await bcrypt.compare(password, user.password);
    } catch (compareError) {
      console.error("Password comparison error:", compareError);
      return res.status(500).json({ 
        error: "Server error. Please try again later." 
      });
    }

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }


    const now = new Date();

    // Trial / subscription initialization (first-time or backward compat)
    const plan = user.subscriptionPlan ?? null;
    const needsMigration = plan === null || plan === "EXPIRED" || plan === "";

    try {
      if (needsMigration) {
        const qrCount = await prisma.qRCode.count({ where: { userId: user.id } });
        if (qrCount > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionPlan: "EXPIRED" },
          });
          await prisma.qRCode.updateMany({
            where: { userId: user.id },
            data: { isActive: false, deactivatedReason: "TRIAL_EXPIRED" },
          });
          user.subscriptionPlan = "EXPIRED";
        } else {
          const trialEndsAt = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionPlan: "TRIAL",
              trialStartedAt: now,
              trialEndsAt,
              subscriptionStartedAt: null,
              subscriptionEndsAt: null,
            },
          });
          user.subscriptionPlan = "TRIAL";
          user.trialStartedAt = now;
          user.trialEndsAt = trialEndsAt;
        }
      } else if (user.subscriptionPlan === "TRIAL" && user.trialEndsAt && new Date(user.trialEndsAt) < now) {
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionPlan: "EXPIRED" },
        });
        await prisma.qRCode.updateMany({
          where: { userId: user.id },
          data: { isActive: false, deactivatedReason: "TRIAL_EXPIRED" },
        });
        user.subscriptionPlan = "EXPIRED";
      }
    } catch (subError) {
      // Prisma client/schema out of sync (e.g. Unknown argument subscriptionPlan) or DB error
      console.error("Login: subscription update failed (run npx prisma generate):", subError);
      // Continue login with current user; subscription state may be stale until prisma generate + migrate
    }

    // Set login session
    try {
  setLoginSession(res, user);
    } catch (sessionError) {
      console.error("Session creation error:", sessionError);
      return res.status(500).json({ 
        error: "Failed to create session. Please try again." 
      });
    }

    return res.status(200).json({ 
      id: user.id, 
      email: user.email,
      message: "Login successful"
    });

  } catch (error) {
    console.error("Login error:", error);

    // Never expose technical errors to the client
    return res.status(500).json({ 
      error: "Login is temporarily unavailable. Please try again in a few moments." 
    });
  }
}
