import prisma from "@/lib/prisma";
import { getQrPauseReason, PLAN_STATUS_FIELDS } from "@/lib/billing/subscription";
import { getClientIp } from "@/lib/clientIp";
import { isRateLimited } from "@/lib/rateLimit";
import { normalizeContent } from "@/lib/qr/qrContent";
import { buildVCard, vcardFileName } from "@/lib/qr/vcard";

const ONE_MINUTE = 60 * 1000;

// The contact file for each page type that offers "Save contact"
const CONTACTS = {
  vcard: (c) => ({
    firstName: c.firstName,
    lastName: c.lastName,
    organization: c.company,
    jobTitle: c.jobTitle,
    phones: [
      { type: "CELL", number: c.phone },
      { type: "WORK", number: c.phone2 },
    ],
    email: c.email,
    website: c.website,
    address: c.address,
    note: c.note,
    photo: c.avatar,
  }),
  business: (c) => ({
    organization: c.businessName,
    phones: [{ type: "WORK", number: c.phone }],
    email: c.email,
    website: c.website,
    address: c.address,
    photo: c.avatar,
  }),
};

/**
 * GET /api/r/[slug]/vcard: the "Save contact" file (.vcf) of a Contact card or Business page, only while the code is
 * active and its owner's plan is running (like the page itself). Downloading it doesn't count as a scan.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const slug = typeof req.query.slug === "string" ? req.query.slug : "";
  if (isRateLimited(`vcard:${getClientIp(req)}`, ONE_MINUTE, 30)) {
    return res.status(429).json({ error: "Too many requests. Please try again in a minute." });
  }

  try {
    const qr = await prisma.qRCode.findUnique({
      where: { slug },
      include: { user: { select: PLAN_STATUS_FIELDS } }, // only what the plan check needs
    });
    if (!qr || qr.status !== "ACTIVE" || !CONTACTS[qr.type] || getQrPauseReason(qr.user)) {
      return res.status(404).json({ error: "This contact isn't available." });
    }
    let saved = null;
    try {
      saved = qr.meta ? JSON.parse(qr.meta).content : null;
    } catch {
      saved = null;
    }
    const { content, error } = normalizeContent(qr.type, saved);
    if (error) {
      return res.status(404).json({ error: "This contact isn't available." });
    }

    const contact = CONTACTS[qr.type](content);
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.organization;
    res.setHeader("Content-Type", "text/vcard; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${vcardFileName(name)}"`);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(buildVCard(contact));
  } catch (err) {
    console.error("vCard download error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
