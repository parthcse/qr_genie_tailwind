// pages/api/vcard/[slug].js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const { slug } = req.query;

  const qr = await prisma.qRCode.findUnique({ where: { slug } });
  if (!qr || qr.type !== "vcard" || !qr.meta) {
    return res.status(404).send("vCard not found");
  }

  let meta = {};
  try {
    meta = JSON.parse(qr.meta);
  } catch (e) {
    return res.status(500).send("Invalid vCard data");
  }

  const fullName = `${meta.firstName || ""} ${meta.lastName || ""}`.trim();

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${fullName || "Contact"}`,
    meta.company ? `ORG:${meta.company}` : null,
    meta.jobTitle ? `TITLE:${meta.jobTitle}` : null,
    meta.phone ? `TEL;TYPE=CELL:${meta.phone}` : null,
    meta.email ? `EMAIL;TYPE=INTERNET:${meta.email}` : null,
    meta.website ? `URL:${meta.website}` : null,
    "END:VCARD",
  ].filter(Boolean);

  const vcardString = lines.join("\r\n");

  res.setHeader("Content-Type", "text/vcard; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${(fullName || slug).replace(/\s+/g, "_")}.vcf"`
  );
  res.send(vcardString);
}
