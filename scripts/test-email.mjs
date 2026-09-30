// Check the SMTP settings in .env and send one test email.
// Usage (from the project folder):  npm run email:test -- you@example.com
import nodemailer from "nodemailer";

process.loadEnvFile(".env");
const env = (name) => (process.env[name] || "").trim().replace(/^["']|["']$/g, "");

const to = process.argv[2];
if (!to) {
  console.error("Usage: npm run email:test -- you@example.com");
  process.exit(1);
}

const host = env("SMTP_HOST");
const user = env("SMTP_USER");
const pass = env("SMTP_PASS");
const port = Number(env("SMTP_PORT") || 587);
const from = env("EMAIL_FROM") || "QR-Genie <noreply@qr-genie.co>";
if (!host || !user || !pass) {
  console.error("Set SMTP_HOST, SMTP_USER and SMTP_PASS in .env first.");
  process.exit(1);
}

const transport = nodemailer.createTransport({ host, port, secure: port === 465, requireTLS: port !== 465, auth: { user, pass } });

try {
  console.log(`Connecting to ${host}:${port}…`);
  await transport.verify();
  console.log("Login OK");
  const info = await transport.sendMail({
    from,
    to,
    subject: "QR-Genie test email",
    text: `This is a test email from QR-Genie, sent through ${host} from ${from}.\nIf you received it, email sending works.`,
  });
  console.log(`Sent to ${info.accepted.join(", ")} (message ID ${info.messageId})`);
} catch (err) {
  console.error("Failed:", err.message);
  if (/535|Authentication/i.test(err.message)) {
    console.error("→ Check SMTP_USER / SMTP_PASS. For AWS SES they're the SMTP credentials from SES → SMTP settings, not your AWS access keys, and SMTP_HOST must be in the same region.");
  } else if (/not verified|554/i.test(err.message)) {
    console.error("→ SES rejected the address. Verify the EMAIL_FROM domain in SES; while your account is in the SES sandbox, the recipient must be verified too.");
  } else if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(err.message)) {
    console.error("→ Can't reach the SMTP server. Check SMTP_HOST and that port " + port + " isn't blocked.");
  }
  process.exit(1);
}
