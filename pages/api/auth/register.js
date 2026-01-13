import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { setLoginSession } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Set trial end date (7 days from now)
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashed,
        name: name ? name.trim() : null,
        plan: "free",
        trialEndsAt,
      },
    });

    // Set login session
    setLoginSession(res, user);

    return res.status(201).json({ id: user.id, email: user.email });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle Prisma unique constraint violation (duplicate email)
    if (error.code === "P2002") {
      return res.status(400).json({ error: "User already exists" });
    }

    // Handle Prisma connection errors
    if (error.code === "P1001" || error.code === "P1000") {
      return res.status(500).json({
        error: "Database connection error. Please try again later.",
      });
    }

    // Handle other Prisma errors
    if (error.code && error.code.startsWith("P")) {
      console.error("Prisma error:", error.code, error.message);
      return res.status(500).json({ error: "Database error. Please try again." });
    }

    // Generic error
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
}
