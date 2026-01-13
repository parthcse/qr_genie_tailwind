import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import prisma from "./prisma";

const TOKEN_NAME = "qrgenie_token";

export function setLoginSession(res, user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.setHeader(
    "Set-Cookie",
    cookie.serialize(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })
  );
}

export function clearLoginSession(res) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(TOKEN_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: -1,
      path: "/",
    })
  );
}

export async function getUserFromRequest(req) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies[TOKEN_NAME];
  if (!token) return null;

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
      trialEndsAt: user.trialEndsAt,
    };
  } catch (error) {
    // JWT verification failed or database error
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return null;
    }
    console.error("Error getting user from request:", error);
    return null;
  }
}
