import bcrypt from "bcryptjs";

// Passwords that people type after scanning a protected QR code
export const QR_PASSWORD_MIN = 4;
export const QR_PASSWORD_MAX = 64;

/** Error message for an unusable password, or null when it's fine */
export function qrPasswordProblem(password) {
  if (typeof password !== "string" || password.length < QR_PASSWORD_MIN) {
    return `The password needs at least ${QR_PASSWORD_MIN} characters.`;
  }
  if (password.length > QR_PASSWORD_MAX) {
    return `Keep the password under ${QR_PASSWORD_MAX} characters.`;
  }
  return null;
}

export function hashQrPassword(password) {
  return bcrypt.hash(password, 10);
}

export function checkQrPassword(password, hash) {
  if (typeof password !== "string" || !hash) return Promise.resolve(false);
  return bcrypt.compare(password.slice(0, QR_PASSWORD_MAX), hash);
}

/** Reads the network name, security and password back out of a `WIFI:` QR string (handles \ escapes) */
export function parseWifiString(value) {
  const out = { ssid: "", security: "", password: "", hidden: false };
  if (typeof value !== "string" || !value.startsWith("WIFI:")) return out;
  const body = value.slice(5);
  let key = "";
  let current = "";
  let readingKey = true;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "\\" && i + 1 < body.length) {
      current += body[++i];
    } else if (readingKey && ch === ":") {
      key = current;
      current = "";
      readingKey = false;
    } else if (!readingKey && ch === ";") {
      if (key === "S") out.ssid = current;
      else if (key === "T") out.security = current;
      else if (key === "P") out.password = current;
      else if (key === "H") out.hidden = current === "true";
      key = "";
      current = "";
      readingKey = true;
    } else {
      current += ch;
    }
  }
  return out;
}
