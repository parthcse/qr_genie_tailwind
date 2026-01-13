import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { setLoginSession } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.trim().toLowerCase();

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Set login session
    setLoginSession(res, user);

    return res.status(200).json({ id: user.id, email: user.email });
  } catch (error) {
    console.error("Login error:", error);
    
    // Handle Prisma connection errors
    if (error.code === "P1001" || error.code === "P1000") {
      return res.status(500).json({ 
        error: "Database connection error. Please try again later." 
      });
    }

    // Handle other Prisma errors
    if (error.code && error.code.startsWith("P")) {
      console.error("Prisma error:", error.code, error.message);
      return res.status(500).json({ error: "Database error. Please try again." });
    }

    // Generic error
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
}
