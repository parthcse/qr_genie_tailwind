// pages/api/create-dynamic.js
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import { getUserFromRequest, VERIFY_EMAIL_FIRST } from "@/lib/auth";
import { validateRedirectUrl } from "@/lib/qr/redirectValidation";
import { qrPasswordProblem, hashQrPassword } from "@/lib/qr/qrPassword";
import { MAX_IMAGE_DATA_URL_LENGTH, MAX_IMAGE_LABEL } from "@/lib/qr/imageUpload";

import { canCreateQR, checkQRCodeLimit, getUserSubscriptionStatus } from "@/lib/billing/subscription";
// QR types open for new codes; the others stay in the code for a later launch
const ENABLED_TYPES = new Set(["website", "wifi", "whatsapp", "instagram"]);
const WIFI_SECURITY = new Set(["WPA", "WEP", "WPA-EAP", "nopass"]);
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
// The design is saved in the database: a logo of up to 150 KB (as a data URL) plus the other settings
const MAX_META_LENGTH = MAX_IMAGE_DATA_URL_LENGTH + 50_000;

function normalizeUrl(u) {
  if (!u || typeof u !== "string") return "";
  const trimmed = u.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Default to https
  return "https://" + trimmed;
}

// Refuse oversized requests before reading them (a 150 KB logo plus the form fits comfortably)
export const config = { api: { bodyParser: { sizeLimit: "400kb" } } };

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
  if (!user.emailVerified) {
    return res.status(403).json({ error: VERIFY_EMAIL_FIRST, verifyEmail: true });
  }

  // Check if user can create QR codes
  if (!canCreateQR(user)) {
    const { status } = getUserSubscriptionStatus(user);
    return res.status(403).json({
      error: status === "TRIAL_EXPIRED" 
        ? "Your 14-day free trial has expired. Please subscribe to a plan to continue creating QR codes."
        : "Your subscription has expired. Please renew to continue creating QR codes.",
    });
  }

  // Check QR code limit (2 during trial, unlimited for paid plans); deleted codes don't count
  const qrCount = await prisma.qRCode.count({ where: { userId: user.id, status: { not: "DELETED" } } });
  const limitCheck = await checkQRCodeLimit(user, qrCount);
  
  if (!limitCheck.canCreate) {
    return res.status(403).json({
      error: limitCheck.reason,
      limit: limitCheck.limit,
      current: limitCheck.current,
    });
  }
  const {
    qrType = "website",
    url,
    name,
    linkType: requestedLinkType, // "STATIC" | "DYNAMIC" – Static = encode final URL only, no tracking; Dynamic = /r/slug + tracking
    folder, // Folder ID
    wifi,
    instagram, // Instagram form data
    whatsapp, // WhatsApp form data
    qrColor,
    bgColor,
    design, // Full design configuration object
    passwordEnabled, // Website form: ask scanners for a password before redirecting
    password,
  } = req.body || {};

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
    typeof qrColor === "string" && HEX_COLOR.test(qrColor)
      ? qrColor
      : "#000000";
  const safeBgColor =
    typeof bgColor === "string" && HEX_COLOR.test(bgColor)
      ? bgColor
      : "#ffffff";

  if (!ENABLED_TYPES.has(qrType)) {
    return res.status(400).json({ error: "This QR code type isn't available yet." });
  }

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
    const checked = validateRedirectUrl(finalUrl);
    if (!checked.valid || checked.url.length > 2048) {
      return res.status(400).json({ error: "Please enter a valid website URL." });
    }
    targetUrl = checked.url;
  } else if (type === "wifi") {
    const w = wifi || {};
    const ssid = typeof w.ssid === "string" ? w.ssid.trim() : "";
    if (!ssid) {
      return res.status(400).json({
        error: "WiFi SSID (Network name) is required.",
      });
    }
    if (ssid.length > 64) {
      return res.status(400).json({ error: "The network name is too long." });
    }

    // Build WiFi QR code string: WIFI:S:<SSID>;T:<SECURITY>;P:<PASSWORD>;H:<HIDDEN>;;
    const security = WIFI_SECURITY.has(w.security) ? w.security : "WPA";
    const password = typeof w.password === "string" ? w.password : "";
    if (password.length > 128) {
      return res.status(400).json({ error: "The network password is too long." });
    }
    const hidden = w.hidden === true || w.hidden === "true" ? "true" : "false";
    
    // Escape special characters in SSID and password
    const escapeWiFiString = (str) => {
      if (!str) return "";
      return str.replace(/[\\;:,"]/g, "\\$&");
    };
    
    const escapedSSID = escapeWiFiString(ssid);
    const escapedPassword = escapeWiFiString(password);
    
    // Build WiFi string
    let wifiString = `WIFI:S:${escapedSSID};T:${security};`;
    if (password && security !== "nopass") {
      wifiString += `P:${escapedPassword};`;
    }
    wifiString += `H:${hidden};;`;
    
    // For WiFi, the QR code contains the raw WiFi string, not a URL
    // We'll store it in targetUrl but it's not actually a URL
    targetUrl = wifiString;
    metaObj = {
      ssid: ssid,
      security: security,
      password: password ? "***" : "", // Don't store actual password in meta
      hidden: hidden === "true",
    };
  } else if (type === "instagram") {
    const instagramData = instagram || {};
    // Accept "@name", "name" or a pasted profile link
    const username = String(instagramData.username || "")
      .trim()
      .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")
      .replace(/^@/, "")
      .replace(/[/?#].*$/, "");
    if (!username) {
      return res.status(400).json({
        error: "Instagram username is required.",
      });
    }
    if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) {
      return res.status(400).json({ error: "Please enter a valid Instagram username." });
    }
    targetUrl = `https://instagram.com/${username}/`;
    metaObj = {
      username: username,
    };
  } else if (type === "whatsapp") {
    const whatsappData = whatsapp || {};
    const countryCode = /^\+\d{1,4}$/.test(whatsappData.countryCode) ? whatsappData.countryCode : "+91";
    const phone = String(whatsappData.phone || "").trim().replace(/[\s\-\(\)]/g, "");
    const message = typeof whatsappData.message === "string" ? whatsappData.message.slice(0, 1000) : "";
    
    if (!phone) {
      return res.status(400).json({
        error: "WhatsApp phone number is required.",
      });
    }
    if (!/^\d{4,15}$/.test(phone)) {
      return res.status(400).json({ error: "Please enter a valid WhatsApp phone number (digits only)." });
    }
    
    const fullPhone = countryCode + phone;
    const encodedMessage = message ? encodeURIComponent(message) : "";
    targetUrl = `https://wa.me/${fullPhone}${encodedMessage ? `?text=${encodedMessage}` : ""}`;
    metaObj = {
      countryCode: countryCode,
      phone: phone,
      message: message,
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


  // Add design config to metaObj if provided
  if (design && typeof design === "object" && !Array.isArray(design)) {
    // A logo is only ever an uploaded image (data URL); drop anything else
    const safeDesign = { ...design };
    if (safeDesign.logo && !(typeof safeDesign.logo === "string" && /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/i.test(safeDesign.logo))) {
      safeDesign.logo = null;
    }
    if (safeDesign.logo && safeDesign.logo.length > MAX_IMAGE_DATA_URL_LENGTH) {
      return res.status(413).json({ error: `The logo must be ${MAX_IMAGE_LABEL} or smaller. Please upload a smaller image.` });
    }
    if (!metaObj) {
      metaObj = {};
    }
    metaObj.designConfig = safeDesign;
  }

  const metaString = metaObj ? JSON.stringify(metaObj) : null;
  if (metaString && metaString.length > MAX_META_LENGTH) {
    return res.status(413).json({ error: "The QR design is too large. Please use a smaller logo." });
  }

  // WiFi codes are always static: a phone's camera joins the network straight from the code,
  // which a web page (dynamic code) can't do
  const linkType = type === "wifi" ? "STATIC" : requestedLinkType === "STATIC" ? "STATIC" : "DYNAMIC";

  // Password protection works only through the short link, so only on dynamic codes
  let passwordHash = null;
  if ((passwordEnabled === true || passwordEnabled === "true") && type !== "wifi") {
    if (linkType === "STATIC") {
      return res.status(400).json({ error: "Password protection needs a dynamic QR code. Switch to Dynamic or turn the password off." });
    }
    const problem = qrPasswordProblem(password);
    if (problem) {
      return res.status(400).json({ error: problem });
    }
    passwordHash = await hashQrPassword(password);
  }

  // Save QR code in DB
    let code;
    try {
      // Process name: trim whitespace, use null if empty
      const processedName = name && typeof name === "string" ? name.trim().slice(0, 100) : null;
      const finalName = processedName && processedName.length > 0 ? processedName : null;

      const createData = {
        slug,
        type,
        targetUrl,
        name: finalName,
        qrColor: safeQrColor,
        bgColor: safeBgColor,
        meta: metaString,
        deactivatedReason: null,
        status: "ACTIVE",
        linkType,
        passwordHash,
        user: { connect: { id: user.id } },
      };

      // Add folder if provided and valid
      if (typeof folder === "string" && folder.trim()) {
        // Verify folder belongs to user
        const folderExists = await prisma.folder.findFirst({
          where: {
            id: folder,
            userId: user.id,
          },
        });

        if (folderExists) {
          createData.folder = { connect: { id: folder } };
        }
      }

      code = await prisma.qRCode.create({
        data: createData,
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
      // Static: encode final URL only (no tracking). Dynamic: always encode short link so every scan goes through /r/slug and is tracked.
      const qrContent = linkType === "STATIC" ? targetUrl : dynamicUrl;

      pngDataUrl = await QRCode.toDataURL(qrContent, {
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
    id: code.id,
    slug: code.slug,
    dynamicUrl,
    pngDataUrl,
    name: code.name || name || null, // Return saved name from database
    type,
    linkType,
    // What the printed code must contain: the short link for dynamic codes, the content itself for static ones
    staticContent: linkType === "STATIC" ? targetUrl : null,
    protected: !!passwordHash,
  });
  } catch (error) {
    console.error("Create QR code error:", error);
    
    // Ensure we always return JSON, never HTML
    return res.status(500).json({ 
      error: "An unexpected error occurred. Please try again later."
    });
  }
}
