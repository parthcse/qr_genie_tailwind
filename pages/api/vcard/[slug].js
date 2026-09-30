// pages/api/vcard/[slug].js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const { slug } = req.query;

  const qr = await prisma.qRCode.findUnique({ where: { slug: String(slug) } });
  if (!qr || qr.type !== "vcard" || !qr.meta || qr.status !== "ACTIVE") {
    return res.status(404).send("vCard not found");
  }

  let meta = {};
  try {
    meta = JSON.parse(qr.meta);
  } catch (e) {
    return res.status(500).send("Invalid vCard data");
  }

  // Line breaks would let a value inject extra vCard fields (\s also covers Unicode line separators); text values also escape \ , ;
  const oneLine = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 200);
  const text = (s) => oneLine(s).replace(/([\\,;])/g, "\\$1");

  const fullName = oneLine(`${meta.firstName || ""} ${meta.lastName || ""}`);

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${text(fullName) || "Contact"}`,
    meta.company ? `ORG:${text(meta.company)}` : null,
    meta.jobTitle ? `TITLE:${text(meta.jobTitle)}` : null,
    meta.phone ? `TEL;TYPE=CELL:${oneLine(meta.phone)}` : null,
    meta.email ? `EMAIL;TYPE=INTERNET:${oneLine(meta.email)}` : null,
    meta.website ? `URL:${oneLine(meta.website)}` : null,
    "END:VCARD",
  ].filter(Boolean);

  const vcardString = lines.join("\r\n");
  const fileName = (fullName || slug).replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 60) || "contact";

  res.setHeader("Content-Type", "text/vcard; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}.vcf"`);
  res.send(vcardString);
}
