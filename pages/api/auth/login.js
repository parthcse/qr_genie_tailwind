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
        error: "Database error. Please try again later." 
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
    
    // Ensure we always return JSON, never HTML
    return res.status(500).json({ 
      error: error.message || "An unexpected error occurred. Please try again later." 
    });
  }
}
