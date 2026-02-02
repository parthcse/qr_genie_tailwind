// pages/api/create-dynamic.js
import prisma from "../../lib/prisma";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import { getUserFromRequest } from "../../lib/auth";
import { canCreateQR } from "../../lib/subscription";

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

  if (!canCreateQR(user)) {
    return res.status(403).json({
      error: "Trial expired. Please upgrade your plan.",
    });
  }

  const {
    qrType = "website",
    url,
    pdfUrl,
    name,
    folder, // Folder ID
    vcard,
    wifi,
    instagram, // Instagram form data
    whatsapp, // WhatsApp form data
    qrColor,
    bgColor,
    design, // Full design configuration object
    // PDF specific fields
    title,
    description,
    company,
    website,
    buttonText,
    thumbnail,
    primaryColor,
    secondaryColor,
    directShow, // If true, QR code points directly to PDF URL
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
    
    // If directShow is true, point QR code directly to PDF URL
    if (directShow === true || directShow === "true") {
      targetUrl = link;
      // Still store meta for potential future use
      metaObj = {
        kind: "pdf",
        pdfUrl: link,
        directShow: true,
        title: title || name || "PDF Document",
        description: description || "",
        company: company || "",
        website: website ? normalizeUrl(website) : "",
        buttonText: buttonText || "View PDF",
        thumbnail: thumbnail || "",
        primaryColor: primaryColor || "#B69EDF",
        secondaryColor: secondaryColor || "#242420",
      };
    } else {
      // For PDF, redirect to custom landing page instead of direct PDF
      targetUrl = `${baseNoSlash}/pdf/${slug}`;
      metaObj = {
        kind: "pdf",
        pdfUrl: link,
        directShow: false,
        title: title || name || "PDF Document",
        description: description || "",
        company: company || "",
        website: website ? normalizeUrl(website) : "",
        buttonText: buttonText || "View PDF",
        thumbnail: thumbnail || "",
        primaryColor: primaryColor || "#B69EDF",
        secondaryColor: secondaryColor || "#242420",
      };
    }
    
    // Note: pdfFile uploads would need to be handled separately via file upload API
    // For now, we use pdfUrl
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
  } else if (type === "wifi") {
    const w = wifi || {};
    const ssid = w.ssid || "";
    if (!ssid) {
      return res.status(400).json({
        error: "WiFi SSID (Network name) is required.",
      });
    }

    // Build WiFi QR code string: WIFI:S:<SSID>;T:<SECURITY>;P:<PASSWORD>;H:<HIDDEN>;;
    const security = w.security || "WPA";
    const password = w.password || "";
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
    const username = (instagramData.username || "").trim().replace(/^@/, "");
    if (!username) {
      return res.status(400).json({
        error: "Instagram username is required.",
      });
    }
    targetUrl = `https://instagram.com/${username}/`;
    metaObj = {
      username: username,
    };
  } else if (type === "whatsapp") {
    const whatsappData = whatsapp || {};
    const countryCode = whatsappData.countryCode || "+91";
    const phone = (whatsappData.phone || "").trim().replace(/[\s\-\(\)]/g, "");
    const message = whatsappData.message || "";
    
    if (!phone) {
      return res.status(400).json({
        error: "WhatsApp phone number is required.",
      });
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
  if (design && typeof design === "object") {
    if (!metaObj) {
      metaObj = {};
    }
    metaObj.designConfig = design;
  }

  const metaString = metaObj ? JSON.stringify(metaObj) : null;

  // Save QR code in DB
    let code;
    try {
      // Process name: trim whitespace, use null if empty
      const processedName = name && typeof name === "string" ? name.trim() : null;
      const finalName = processedName && processedName.length > 0 ? processedName : null;

      const createData = {
        slug,
        type,
        targetUrl,
        name: finalName,
        qrColor: safeQrColor,
        bgColor: safeBgColor,
        meta: metaString,
        isActive: true,
        deactivatedReason: null,
        user: { connect: { id: user.id } },
      };

      // Add folder if provided and valid
      if (folder && folder.trim()) {
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
      // For Instagram, WhatsApp, Website, and WiFi: use direct targetUrl
      // For other types: use dynamic URL (short link) for analytics tracking
      const typesWithDirectLink = ["instagram", "whatsapp", "website", "wifi"];
      const qrContent = typesWithDirectLink.includes(type) ? targetUrl : dynamicUrl;
      
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
    slug: code.slug,
    dynamicUrl,
    pngDataUrl,
    name: code.name || name || null, // Return saved name from database
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
