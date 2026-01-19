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
  // Set Content-Type header to ensure JSON response
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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
    process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    return res.status(500).json({ 
      error: "Server configuration error: NEXT_PUBLIC_BASE_URL or NEXT_PUBLIC_APP_URL must be set" 
    });
  }
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
    let code;
    try {
      code = await prisma.qRCode.create({
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
    } catch (dbError) {
      console.error("Database error creating QR code:", dbError);
      
      // Handle unique constraint violation (slug collision - very rare)
      if (dbError.code === 'P2002') {
        return res.status(500).json({ 
          error: "Failed to create QR code. Please try again." 
        });
      }
      
      return res.status(500).json({ 
        error: "Database error. Please try again later." 
      });
    }

    const dynamicUrl = `${baseNoSlash}/r/${slug}`;

    // Generate a PNG data URL (optional preview)
    let pngDataUrl;
    try {
      pngDataUrl = await QRCode.toDataURL(dynamicUrl, {
        margin: 1,
        width: 512,
        color: {
          dark: safeQrColor,
          light: safeBgColor,
        },
      });
    } catch (qrError) {
      console.error("QR code generation error:", qrError);
      // Continue without preview - QR code is still created
      pngDataUrl = null;
    }

    return res.status(200).json({
      slug: code.slug,
      dynamicUrl,
      pngDataUrl,
      name: name || null,
      type,
    });

  } catch (error) {
    console.error("Create QR code error:", error);
    
    // Ensure we always return JSON, never HTML
    return res.status(500).json({ 
      error: error.message || "An unexpected error occurred. Please try again later." 
    });
  }
}
