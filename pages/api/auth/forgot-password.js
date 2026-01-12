import prisma from "../../../lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../../../lib/email";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    // Don't reveal if email exists for security reasons
    // Always return success even if user doesn't exist
    if (!user) {
      return res.status(200).json({ 
        message: "If an account with that email exists, we've sent you a password reset link." 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save reset token to database
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpires
        }
      });
    } catch (dbError) {
      console.error("Database update error:", dbError);
      // If database update fails, it might be because fields don't exist
      // Check if it's a schema issue
      if (dbError.message && dbError.message.includes('Unknown field')) {
        console.error("Schema mismatch! Run: npx prisma db push && npx prisma generate");
        return res.status(500).json({ 
          error: "Database schema needs to be updated. Please contact support." 
        });
      }
      throw dbError;
    }

    // Send email with reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    
    // Send email (will log to console in development if RESEND_API_KEY not set)
    // Don't fail the request if email sending fails - token is already saved
    try {
      await sendPasswordResetEmail(user.email, resetUrl, user.name);
    } catch (emailError) {
      console.error('Email sending failed (but token saved):', emailError);
      // Continue anyway - token is saved, user can check console for link
    }

    return res.status(200).json({ 
      message: "If an account with that email exists, we've sent you a password reset link." 
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({ 
      error: error.message || "An error occurred. Please try again later." 
    });
  }
}

