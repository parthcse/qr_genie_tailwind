import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { setLoginSession } from "../../../lib/auth";

// Disable body parsing limit for this route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req, res) {
  // CRITICAL: Set Content-Type FIRST, before any operations
  // This ensures JSON is returned even if an error occurs
  res.setHeader('Content-Type', 'application/json');

  // Wrap EVERYTHING in try/catch to prevent HTML error pages
  try {
    // Log request method for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Register API - Method:', req.method);
    }

    if (req.method !== "POST") {
      console.error(`Register API - Wrong method: ${req.method}, expected POST`);
      return res.status(405).json({ 
        success: false,
        error: "Method not allowed",
        received: req.method,
        expected: "POST"
      });
    }
    // Ensure body exists and is parsed
    if (!req.body) {
      console.error('Register API - No request body received');
      return res.status(400).json({ 
        success: false,
        error: "Request body is required" 
      });
    }

  const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: "Email and password required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid email format" 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: "Password must be at least 6 characters" 
      });
    }

    // Check if user already exists
    let existing;
    try {
      existing = await prisma.user.findUnique({ 
        where: { email: email.trim().toLowerCase() } 
      });
    } catch (dbError) {
      console.error("Database error checking existing user:", dbError);
      return res.status(500).json({ 
        success: false,
        error: "Database error. Please try again later." 
      });
    }

    if (existing) {
      return res.status(400).json({ 
        success: false,
        error: "User already exists" 
      });
    }

    // Hash password
    let hashed;
    try {
      hashed = await bcrypt.hash(password, 10);
    } catch (hashError) {
      console.error("Password hashing error:", hashError);
      return res.status(500).json({ 
        success: false,
        error: "Server error. Please try again later." 
      });
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          password: hashed,
          name: name ? name.trim() : null,
          plan: "free",
          trialEndsAt,
          subscriptionPlan: "TRIAL",
          trialStartedAt: now,
          subscriptionStartedAt: null,
          subscriptionEndsAt: null,
        },
      });
    } catch (createError) {
      console.error("User creation error:", createError);
      if (createError.code) console.error("Prisma code:", createError.code, "meta:", createError.meta);
      
      // Handle unique constraint violation
      if (createError.code === 'P2002') {
        return res.status(400).json({ 
          success: false,
          error: "User already exists" 
        });
      }
      
      // Prisma client/schema out of sync (e.g. "Unknown argument") or DB error: show user-friendly message only
      const userMessage = "Registration is temporarily unavailable. Please try again in a few moments.";
      return res.status(500).json({ 
        success: false,
        error: userMessage 
      });
    }

    // Set login session
    try {
  setLoginSession(res, user);
    } catch (sessionError) {
      console.error("Session creation error:", sessionError);
      // User is created, but session failed - still return success
      // Frontend can handle re-login if needed
    }

    return res.status(201).json({ 
      success: true,
      id: user.id, 
      email: user.email,
      message: "Account created successfully"
    });

  } catch (error) {
    // CRITICAL: This catch block ensures we NEVER return HTML
    console.error("Registration error (outer catch):", error);
    // Never expose technical errors to the client
    return res.status(500).json({ 
      success: false,
      error: "Registration is temporarily unavailable. Please try again in a few moments." 
    });
  }
}
