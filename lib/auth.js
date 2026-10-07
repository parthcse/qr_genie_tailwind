import jwt from "jsonwebtoken";
import { parseCookie, stringifySetCookie } from "cookie";
import prisma from "./prisma";

const TOKEN_NAME = "qrgenie_token";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const secure = () => process.env.NODE_ENV === "production";

/**
 * Sign the user in. The token holds only the user id and their session version; bumping
 * User.sessionVersion (password change or reset) invalidates every token issued before.
 */
export function setLoginSession(res, user) {
  const token = jwt.sign({ userId: user.id, sv: user.sessionVersion ?? 0 }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: MAX_AGE,
  });
  res.setHeader(
    "Set-Cookie",
    stringifySetCookie({ name: TOKEN_NAME, value: token, httpOnly: true, secure: secure(), sameSite: "lax", maxAge: MAX_AGE, path: "/" })
  );
}

export function clearLoginSession(res) {
  res.setHeader(
    "Set-Cookie",
    stringifySetCookie({ name: TOKEN_NAME, value: "", httpOnly: true, secure: secure(), sameSite: "lax", maxAge: 0, expires: new Date(0), path: "/" })
  );
}

export async function getUserFromRequest(req) {
  const token = parseCookie(req.headers.cookie || "")[TOKEN_NAME];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return null;
    // Tokens from before a password change or reset are no longer valid
    if ((decoded.sv ?? 0) !== user.sessionVersion) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      trialEndsAt: user.trialEndsAt,
      subscriptionPlan: user.subscriptionPlan ?? "EXPIRED",
      trialStartedAt: user.trialStartedAt,
      subscriptionStartedAt: user.subscriptionStartedAt,
      subscriptionEndsAt: user.subscriptionEndsAt,
      subscriptionCancelledAt: user.subscriptionCancelledAt,
      sessionVersion: user.sessionVersion,
      emailVerified: !!user.emailVerifiedAt,
    };
  } catch (e) {
    return null;
  }
}

/**
 * For getServerSideProps on account pages: the redirect for someone who can't see them yet, or null.
 * Signed out -> login; signed in but email not confirmed -> the verification page.
 */
export function accountRedirect(user) {
  if (!user) return { redirect: { destination: "/auth/login", permanent: false } };
  if (!user.emailVerified) return { redirect: { destination: "/auth/verify-email", permanent: false } };
  return null;
}

/** API message for actions that need a confirmed email (creating codes, subscribing) */
export const VERIFY_EMAIL_FIRST = "Please confirm your email address first. We sent you a 6-digit code.";
