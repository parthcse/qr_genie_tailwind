import crypto from "crypto";
import prisma from "./prisma";
import { sendVerificationCodeEmail, sendEmailChangedNotice, emailConfigured } from "./email";

/**
 * Email confirmation with a 6-digit code, for two cases that share the same fields on User:
 * - sign-up: the dashboard (plus creating codes and subscribing) stays locked until the code is entered on
 *   /auth/verify-email;
 * - changing the email on the account page: the new address is kept in pendingEmail and becomes the sign-in
 *   email only once the code sent to it is entered (the old one keeps working meanwhile).
 * Only an HMAC of the code is stored, keyed with the server secret and tied to its purpose (and, for a change, to
 * the new address), so a database copy can't be used to find or reuse it.
 */

export const CODE_TTL_MINUTES = 10;
export const MAX_WRONG_TRIES = 5;
export const RESEND_COOLDOWN_SECONDS = 60;

function hashCode(userId, scope, code) {
  return crypto.createHmac("sha256", process.env.JWT_SECRET || "").update(`${userId}:${scope}:${code}`).digest("hex");
}
const signupScope = () => "signup";
const changeScope = (newEmail) => `change:${newEmail}`;

/** Seconds until another code may be sent (0 = now) */
export function resendWaitSeconds(sentAt) {
  if (!sentAt) return 0;
  const elapsed = (Date.now() - new Date(sentAt).getTime()) / 1000;
  return Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed));
}

/** Stores a new code (replacing any earlier one) and returns it */
async function issueCode(userId, scope, extra = {}) {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...extra,
      emailCodeHash: hashCode(userId, scope, code),
      emailCodeExpiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
      emailCodeAttempts: 0,
      emailCodeSentAt: new Date(),
    },
  });
  return code;
}

/** A failed send shouldn't make them wait out the resend cooldown */
async function afterSend(userId, sent) {
  if (!sent && emailConfigured()) {
    await prisma.user.update({ where: { id: userId }, data: { emailCodeSentAt: null } });
  }
  return sent;
}

/**
 * Checks a code against the stored hash for `scope`. Every guess first takes one try in a single conditional
 * UPDATE, so parallel guesses can't exceed MAX_WRONG_TRIES. Returns { ok } or { ok: false, reason, triesLeft }.
 */
async function matchCode(user, scope, rawCode) {
  const code = String(rawCode ?? "").replace(/\D/g, "");
  if (!user.emailCodeHash) return { ok: false, reason: "missing" };
  if (!user.emailCodeExpiresAt || user.emailCodeExpiresAt < new Date()) return { ok: false, reason: "expired" };

  const reserved = await prisma.user.updateMany({
    where: { id: user.id, emailCodeAttempts: { lt: MAX_WRONG_TRIES } },
    data: { emailCodeAttempts: { increment: 1 } },
  });
  if (reserved.count === 0) return { ok: false, reason: "locked", triesLeft: 0 };

  const expected = Buffer.from(user.emailCodeHash, "hex");
  const given = Buffer.from(hashCode(user.id, scope, code), "hex");
  if (code.length === 6 && expected.length === given.length && crypto.timingSafeEqual(expected, given)) return { ok: true };

  const { emailCodeAttempts } = await prisma.user.findUnique({ where: { id: user.id }, select: { emailCodeAttempts: true } });
  const triesLeft = Math.max(0, MAX_WRONG_TRIES - emailCodeAttempts);
  return { ok: false, reason: triesLeft === 0 ? "locked" : "invalid", triesLeft };
}

// Selecting the hash explicitly overrides the global omit in lib/prisma.js
const CODE_FIELDS = { id: true, email: true, name: true, emailVerifiedAt: true, pendingEmail: true, emailCodeHash: true, emailCodeExpiresAt: true, emailCodeAttempts: true };
const CLEARED = { emailCodeHash: null, emailCodeExpiresAt: null, emailCodeAttempts: 0 };

// ---------------------------------------------------------------- sign-up

/** Emails a sign-up code to the account's address. Returns whether the email was accepted for delivery. */
export async function sendVerificationCode(user) {
  const code = await issueCode(user.id, signupScope());
  const sent = await sendVerificationCodeEmail({ to: user.email, name: user.name, code, minutes: CODE_TTL_MINUTES });
  return afterSend(user.id, sent);
}

/** Checks a sign-up code: { ok: true } once verified (also when it already was), else { ok: false, reason, triesLeft } */
export async function checkVerificationCode(userId, rawCode) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: CODE_FIELDS });
  if (!user) return { ok: false, reason: "missing" };
  if (user.emailVerifiedAt) return { ok: true };
  const result = await matchCode(user, signupScope(), rawCode);
  if (result.ok) {
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date(), ...CLEARED } });
  }
  return result;
}

// ---------------------------------------------------------------- changing the email

/**
 * Starts (or restarts) an email change: keeps `newEmail` as pendingEmail and emails a code to it.
 * The caller has already checked the password and the address. Returns whether the email was accepted.
 */
export async function sendEmailChangeCode(user, newEmail) {
  const code = await issueCode(user.id, changeScope(newEmail), { pendingEmail: newEmail });
  const sent = await sendVerificationCodeEmail({ to: newEmail, name: user.name, code, minutes: CODE_TTL_MINUTES, purpose: "change" });
  return afterSend(user.id, sent);
}

/**
 * Confirms a pending email change. On success the new address becomes the sign-in email (and counts as verified),
 * and the old address gets a notice. Returns { ok: true, email } or { ok: false, reason, triesLeft? }; reason "taken"
 * when another account claimed the address in the meantime.
 */
export async function confirmEmailChange(userId, rawCode) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: CODE_FIELDS });
  if (!user?.pendingEmail) return { ok: false, reason: "none" };
  const result = await matchCode(user, changeScope(user.pendingEmail), rawCode);
  if (!result.ok) return result;

  const newEmail = user.pendingEmail;
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail, pendingEmail: null, emailVerifiedAt: new Date(), ...CLEARED },
    });
  } catch (err) {
    if (err.code === "P2002") {
      await prisma.user.update({ where: { id: user.id }, data: { pendingEmail: null, ...CLEARED } });
      return { ok: false, reason: "taken" };
    }
    throw err;
  }
  // Security notice to the address that was just replaced
  sendEmailChangedNotice({ to: user.email, name: user.name, newEmail }).catch((err) => console.error("Email changed notice:", err.message));
  return { ok: true, email: newEmail };
}

/** Drops a pending email change and its code */
export async function cancelEmailChange(userId) {
  await prisma.user.update({ where: { id: userId }, data: { pendingEmail: null, ...CLEARED } });
}
