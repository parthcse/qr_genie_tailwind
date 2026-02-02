import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  // Set Content-Type header to ensure JSON response
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, password, confirmPassword } = req.body;
  
  if (!token || !password || !confirmPassword) {
    return res.status(400).json({ error: "Token, password, and confirmation are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long" });
  }

  try {
    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date() // Token must not be expired
        }
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: "Invalid or expired reset token. Please request a new password reset link." 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null
      }
    });

    return res.status(200).json({ 
      message: "Password has been reset successfully. You can now log in with your new password." 
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ 
      error: "An error occurred. Please try again later." 
    });
  }
}

