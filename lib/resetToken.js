import crypto from "crypto";

// Password-reset tokens: the raw token goes in the emailed link; only its SHA-256 is stored,
// so a leaked database can't be used to reset anyone's password.

export function createResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}
