import MailChecker from "mailchecker";
import { promises as dns } from "node:dns";

// Used only when the server's own DNS resolver can't answer at all
const publicDns = new dns.Resolver({ timeout: 3000, tries: 1 });
publicDns.setServers(["1.1.1.1", "8.8.8.8"]);

// Checks for addresses used to create accounts: real format, not a throwaway/temp-mail provider,
// and a domain that can actually receive email.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CACHE_MS = 6 * 60 * 60 * 1000;
const domainCache = new Map(); // domain -> { ok, at }

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), ms))]);
}

const NOT_FOUND = new Set(["ENOTFOUND", "ENODATA", "ENODOMAIN"]);

// A definite "no such record" is final; any other failure means our resolver couldn't answer, so ask a public one
async function query(method, domain) {
  try {
    return await withTimeout(dns[method](domain), 4000);
  } catch (err) {
    if (NOT_FOUND.has(err.code)) throw err;
    return await withTimeout(publicDns[method](domain), 4000);
  }
}

/** true when the domain has mail servers (or, per the email standard, at least an address record) */
async function domainAcceptsMail(domain) {
  const cached = domainCache.get(domain);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.ok;

  let ok;
  try {
    const records = await query("resolveMx", domain);
    // A "null MX" (exchange ".") means the domain explicitly accepts no email
    ok = records.some((r) => r.exchange && r.exchange !== ".");
  } catch (err) {
    if (!NOT_FOUND.has(err.code)) return true; // DNS unreachable: don't block real people, and don't cache the guess
    ok = false;
    for (const method of ["resolve4", "resolve6"]) {
      try {
        await query(method, domain);
        ok = true;
        break;
      } catch (err2) {
        if (!NOT_FOUND.has(err2.code)) return true;
      }
    }
  }
  if (domainCache.size > 5000) domainCache.clear();
  domainCache.set(domain, { ok, at: Date.now() });
  return ok;
}

/**
 * @returns {Promise<{ ok: true, email: string } | { ok: false, email: string, error: string }>}
 * email is trimmed and lower-cased either way.
 */
export async function checkAccountEmail(input) {
  const email = String(input || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, email, error: "Please enter a valid email address." };
  }
  if (!MailChecker.isValid(email)) {
    return { ok: false, email, error: "Temporary or disposable email addresses can't be used. Please use your regular email address." };
  }
  if (!(await domainAcceptsMail(email.split("@")[1]))) {
    return { ok: false, email, error: "That email domain can't receive email. Please check the address." };
  }
  return { ok: true, email };
}
