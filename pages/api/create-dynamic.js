// pages/api/create-dynamic.js
import prisma from "../../lib/prisma";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import { getUserFromRequest } from "../../lib/auth";

function normalizeUrl(u) {
  if (!u) return "";
  const trimmed = u.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Default to https
  return "https://" + trimmed;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const {
    qrType = "website",
    url,
    pdfUrl,
    name,
    vcard,
    qrColor,
    bgColor,
  } = req.body || {};

  const now = new Date();

  // If free plan and trial ended, block new QR creation
  if (
    user.plan === "free" &&
    user.trialEndsAt &&
    new Date(user.trialEndsAt) < now
  ) {
    return res.status(403).json({
      error:
        "Your 7-day free trial has expired. Upgrade to the $10 Pro plan to create more QR codes.",
    });
  }

  const slug = nanoid(6);

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://qr-genie.co";
  const baseNoSlash = baseUrl.replace(/\/$/, "");

  // Normalise colors (fallbacks if not provided or invalid)
  const safeQrColor =
    typeof qrColor === "string" && qrColor.startsWith("#")
      ? qrColor
      : "#000000";
  const safeBgColor =
    typeof bgColor === "string" && bgColor.startsWith("#")
      ? bgColor
      : "#ffffff";

  let type = qrType;
  let targetUrl = "";
  let metaObj = null;

  // ----- TYPE LOGIC -----

  if (type === "website") {
    const finalUrl = normalizeUrl(url);
    if (!finalUrl) {
      return res
        .status(400)
        .json({ error: "Website URL is required." });
    }
    targetUrl = finalUrl;
  } else if (type === "pdf") {
    const link = normalizeUrl(pdfUrl || url);
    if (!link) {
      return res.status(400).json({ error: "PDF URL is required." });
    }
    targetUrl = link;
    metaObj = { kind: "pdf" };
  } else if (type === "vcard") {
    const v = vcard || {};
    if (!v.firstName || !v.phone) {
      return res.status(400).json({
        error: "vCard requires at least first name and phone.",
      });
    }

    // Redirect to vCard download API
    targetUrl = `${baseNoSlash}/api/vcard/${slug}`;
    metaObj = {
      firstName: v.firstName || "",
      lastName: v.lastName || "",
      phone: v.phone || "",
      email: v.email || "",
      company: v.company || "",
      jobTitle: v.jobTitle || "",
      website: v.website ? normalizeUrl(v.website) : "",
    };
  } else {
    // Fallback: treat unknown types as website
    const finalUrl = normalizeUrl(url);
    if (!finalUrl) {
      return res.status(400).json({ error: "URL is required." });
    }
    type = "website";
    targetUrl = finalUrl;
  }

  const metaString = metaObj ? JSON.stringify(metaObj) : null;

  // Save QR code in DB
  const code = await prisma.qRCode.create({
    data: {
      slug,
      type,
      targetUrl,
      name: name || null,
      qrColor: safeQrColor,
      bgColor: safeBgColor,
      meta: metaString,
      user: { connect: { id: user.id } },
    },
  });

  const dynamicUrl = `${baseNoSlash}/r/${slug}`;

  // Generate a PNG data URL (optional preview)
  const pngDataUrl = await QRCode.toDataURL(dynamicUrl, {
    margin: 1,
    width: 512,
    color: {
      dark: safeQrColor,
      light: safeBgColor,
    },
  });

  return res.status(200).json({
    slug: code.slug,
    dynamicUrl,
    pngDataUrl,
    name: name || null,
    type,
  });
}
