import prisma from "../../lib/prisma";
import { getUserFromRequest } from "../../lib/auth";
import { getClientIp } from "../../lib/clientIp";
import { hashIp } from "../../lib/scanUtils";
import { isRateLimited } from "../../lib/rateLimit";
import { sendContactNotification } from "../../lib/email";
import { verifyTurnstile } from "../../lib/turnstile";
import { SUPPORT_EMAIL, CONTACT_TOPICS } from "../../lib/site";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEN_MINUTES = 10 * 60 * 1000;

// Where contact-form messages are emailed: CONTACT_NOTIFY_EMAIL (comma-separated for several), else the support inbox
const contactRecipients = () => (process.env.CONTACT_NOTIFY_EMAIL || "").trim().replace(/^["']|["']$/g, "") || SUPPORT_EMAIL;

/**
 * POST /api/contact — save a contact-form message and forward it to CONTACT_NOTIFY_EMAIL (else the support inbox).
 * Spam protection: hidden honeypot field, per-IP rate limit, and Cloudflare Turnstile once its keys are set.
 * The message is stored first, so it is never lost if email delivery isn't configured or fails.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, topic, message, website, turnstileToken } = req.body || {};

  // Hidden "website" field: people never see it, bots fill it in. Pretend it worked.
  if (website) {
    return res.status(200).json({ success: true });
  }

  const ip = getClientIp(req);
  if (isRateLimited(`contact:${ip}`, TEN_MINUTES, 5)) {
    return res.status(429).json({ error: `Too many messages. Please try again later or email ${SUPPORT_EMAIL}.` });
  }

  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const cleanMessage = typeof message === "string" ? message.trim() : "";
  const topicOption = CONTACT_TOPICS.find((t) => t.value === topic) || CONTACT_TOPICS[0];

  const errors = {};
  if (!cleanName || cleanName.length > 100) errors.name = "Enter your name (up to 100 characters).";
  if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 200) errors.email = "Enter a valid email address.";
  if (cleanMessage.length < 10) errors.message = "Tell us a little more (at least 10 characters).";
  if (cleanMessage.length > 5000) errors.message = "Keep your message under 5,000 characters.";
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: "Please check the highlighted fields.", fields: errors });
  }

  const human = await verifyTurnstile(turnstileToken, ip);
  if (!human.ok) {
    return res.status(400).json({ error: "Please complete the security check, then send your message again.", turnstile: true });
  }

  try {
    const user = await getUserFromRequest(req);
    const saved = await prisma.contactMessage.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        topic: topicOption.value,
        message: cleanMessage,
        userId: user?.id || null,
        ipHash: hashIp(ip),
      },
    });

    await sendContactNotification({
      to: contactRecipients(),
      name: cleanName,
      email: cleanEmail,
      topicLabel: topicOption.label,
      message: cleanMessage,
      messageId: saved.id,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return res.status(500).json({ error: `We couldn't send your message. Please email us at ${SUPPORT_EMAIL}.` });
  }
}
