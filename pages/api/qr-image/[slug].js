// pages/api/qr-image/[slug].js
import prisma from "../../../lib/prisma";
import QRCode from "qrcode";

export default async function handler(req, res) {
  const { slug } = req.query;

  const qr = await prisma.qRCode.findUnique({ where: { slug } });

  if (!qr) {
    res.status(404).send("QR code not found");
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    res.status(500).send("Server configuration error: NEXT_PUBLIC_BASE_URL or NEXT_PUBLIC_APP_URL must be set");
    return;
  }
  const dynamicUrl = `${baseUrl.replace(/\/$/, "")}/r/${slug}`;

  try {
    const pngBuffer = await QRCode.toBuffer(dynamicUrl, {
      type: "png",
      width: 512,
      margin: 1,
      color: {
        dark: qr.qrColor || "#000000",
        light: (qr.bgColor || "#ffffff") + "ff", // keep it opaque
      },
    });

    res.setHeader("Content-Type", "image/png");

    // Use inline for preview, attachment for download
    const disposition = req.query.download === "true" ? "attachment" : "inline";
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${slug}.png"`
    );
    res.send(pngBuffer);
  } catch (err) {
    console.error("QR image error:", err);
    res.status(500).send("Failed to generate QR image");
  }
}
