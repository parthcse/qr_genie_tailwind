const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
let warnedMissingSecret = false;

/**
 * Check a Cloudflare Turnstile token with Cloudflare. Tokens can be used only once.
 * Returns { ok: true, skipped: true } when TURNSTILE_SECRET_KEY isn't set, so the form works before keys are added.
 */
export async function verifyTurnstile(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (!warnedMissingSecret) {
      console.warn("TURNSTILE_SECRET_KEY is not set: sign-up, login, password-reset and contact forms are not being checked for bots.");
      warnedMissingSecret = true;
    }
    return { ok: true, skipped: true };
  }
  if (!token || typeof token !== "string") return { ok: false };

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.append("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data = await res.json();
    if (!data.success) console.warn("Turnstile rejected a token:", data["error-codes"]);
    return { ok: !!data.success };
  } catch (err) {
    console.error("Turnstile verification failed:", err);
    return { ok: false };
  }
}
