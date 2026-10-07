import path from "node:path";
import PDFDocument from "pdfkit";
import { describeInvoice } from "./invoiceFormat";

/**
 * A tax invoice as an A4 PDF (resolves to a Buffer), in the site's fonts and colours. The fonts are in
 * assets/fonts (Inter and Plus Jakarta Sans, SIL Open Font License); only the letters used are embedded.
 */

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");
const FONTS = {
  regular: "Inter-Regular.ttf",
  semibold: "Inter-SemiBold.ttf",
  bold: "Inter-Bold.ttf",
  display: "PlusJakartaSans-ExtraBold.ttf",
};

const COLOR = {
  ink: "#0f172a",
  body: "#334155",
  muted: "#64748b",
  line: "#e2e8f0",
  panel: "#f8fafc",
  tint: "#f5f3ff",
  tintLine: "#ddd6fe",
  accent: "#6d28d9",
  indigo: "#4f46e5",
  purple: "#9333ea",
  green: "#047857",
  greenBg: "#d1fae5",
};

// The site's logo icon (Font Awesome "qrcode", drawn on a 448 × 512 grid)
const QR_ICON =
  "M0 224h192V32H0v192zM64 96h64v64H64V96zm192-64v192h192V32H256zm128 128h-64V96h64v64zM0 480h192V288H0v192zm64-128h64v64H64v-64zm352-64h32v128h-96v-32h-32v96h-64V288h96v32h64v-32zm0 160h32v32h-32v-32zm-64 0h32v32h-32v-32z";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 48;
const CW = PAGE_W - 2 * M;

export function renderInvoicePdf(invoice) {
  const info = describeInvoice(invoice);
  const { seller, customer } = invoice;

  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    font: path.join(FONT_DIR, FONTS.regular),
    info: { Title: `Tax invoice ${invoice.number}`, Author: seller.name, Subject: "Tax invoice", Creator: "QR-Genie" },
  });
  for (const [name, file] of Object.entries(FONTS)) doc.registerFont(name, path.join(FONT_DIR, file));

  const chunks = [];
  const done = new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // Draws text and returns the height it took
  const text = (str, x, y, { font = "regular", size = 9, color = COLOR.body, width, align = "left", spacing = 0, lineGap = 2 } = {}) => {
    const opts = { width, align, characterSpacing: spacing, lineGap, lineBreak: !!width };
    doc.font(font).fontSize(size).fillColor(color).text(str, x, y, opts);
    return doc.heightOfString(str, opts);
  };
  const label = (str, x, y, opts = {}) =>
    text(str.toUpperCase(), x, y, { font: "semibold", size: 7, color: COLOR.muted, spacing: 0.9, ...opts });
  const gradient = (x1, y1, x2, y2) => doc.linearGradient(x1, y1, x2, y2).stop(0, COLOR.indigo).stop(1, COLOR.purple);
  const widthOf = (str, font, size) => doc.font(font).fontSize(size).widthOfString(str);

  // Brand bar
  doc.rect(0, 0, PAGE_W, 5).fill(gradient(0, 0, PAGE_W, 0));

  // Header: logo and title
  doc.roundedRect(M, 40, 34, 34, 9).fill(gradient(M, 40, M + 34, 74));
  doc.save().translate(M + 8.9, 47.75).scale(18.5 / 512).path(QR_ICON).fill("#ffffff").restore();
  const wordX = M + 44;
  doc.font("display").fontSize(19);
  doc.fillColor(gradient(wordX, 0, wordX + doc.widthOfString("QR-Genie"), 0)).text("QR-Genie", wordX, 40.5, { lineBreak: false });
  text("qr-genie.co", wordX, 63.5, { size: 8, color: COLOR.muted });

  text("TAX INVOICE", M, 42, { font: "display", size: 17, color: COLOR.ink, width: CW, align: "right", spacing: 1.2 });
  text("Original for recipient", M, 64, { size: 8, color: COLOR.muted, width: CW, align: "right" });

  // Summary strip
  const stripY = 96;
  doc.lineWidth(0.75).roundedRect(M, stripY, CW, 64, 12).fillAndStroke(COLOR.tint, COLOR.tintLine);
  const colW = (CW - 36) / 4;
  const summary = [
    ["Invoice no.", info.number],
    ["Invoice date", info.issuedOn],
    ["Place of supply", invoice.placeOfSupply],
  ];
  summary.forEach(([name, value], i) => {
    const x = M + 18 + i * colW;
    label(name, x, stripY + 15);
    text(value, x, stripY + 31, { font: "semibold", size: 10, color: COLOR.ink, width: colW - 12 });
    doc.moveTo(x + colW - 9, stripY + 14).lineTo(x + colW - 9, stripY + 50).lineWidth(0.75).strokeColor(COLOR.tintLine).stroke();
  });
  const paidX = M + 18 + 3 * colW;
  label("Amount paid", paidX, stripY + 15);
  text(info.total, paidX, stripY + 28, { font: "display", size: 14, color: COLOR.accent });
  const pillX = paidX + widthOf(info.total, "display", 14) + 7;
  doc.roundedRect(pillX, stripY + 31.5, 30, 13, 6.5).fill(COLOR.greenBg);
  text("PAID", pillX, stripY + 34.5, { font: "bold", size: 6.5, color: COLOR.green, width: 30, align: "center", spacing: 0.6 });

  // Billed by / billed to
  const partyY = 186;
  const partyW = CW / 2 - 12;
  const party = (title, x, details) => {
    let y = partyY;
    y += label(title, x, y, { color: COLOR.accent }) + 6;
    y += text(details.name, x, y, { font: "bold", size: 11, color: COLOR.ink, width: partyW }) + 2;
    if (details.company) y += text(details.company, x, y, { font: "semibold", size: 9, color: COLOR.body, width: partyW }) + 1;
    if (details.address?.length) y += text(details.address.join("\n"), x, y, { size: 9, color: COLOR.body, width: partyW, lineGap: 2.5 }) + 3;
    if (details.gstin) y += text(`GSTIN  ${details.gstin}`, x, y, { font: "semibold", size: 9, color: COLOR.ink, width: partyW }) + 2;
    else if (details.taxId) y += text(`Tax ID  ${details.taxId}`, x, y, { font: "semibold", size: 9, color: COLOR.ink, width: partyW }) + 2;
    if (details.email) y += text(details.email, x, y, { size: 9, color: COLOR.muted, width: partyW });
    return y;
  };
  const partyBottom = Math.max(party("Billed by", M, seller), party("Billed to", M + CW / 2 + 12, customer));

  // Line item
  const tableY = partyBottom + 26;
  const cols = { num: M + 12, desc: M + 34, sac: M + 300, qty: M + 362, amountRight: M + CW - 12 };
  doc.roundedRect(M, tableY, CW, 24, 7).fill(COLOR.panel);
  label("#", cols.num, tableY + 9);
  label("Description", cols.desc, tableY + 9);
  label("SAC", cols.sac, tableY + 9);
  label("Qty", cols.qty, tableY + 9, { width: 30, align: "right" });
  label("Taxable value", cols.amountRight - 90, tableY + 9, { width: 90, align: "right" });

  let rowY = tableY + 36;
  text("1", cols.num, rowY, { size: 9.5, color: COLOR.muted });
  text("1", cols.qty, rowY, { size: 9.5, color: COLOR.body, width: 30, align: "right" });
  text(seller.sac || "—", cols.sac, rowY, { size: 9.5, color: COLOR.body });
  text(info.taxable, cols.amountRight - 90, rowY, { font: "semibold", size: 10, color: COLOR.ink, width: 90, align: "right" });
  rowY += text(invoice.description, cols.desc, rowY, { font: "semibold", size: 10, color: COLOR.ink, width: 250 }) + 3;
  rowY += text("Unlimited QR codes, all QR types, editable links and analytics", cols.desc, rowY, { size: 8.5, color: COLOR.muted, width: 250 });
  if (info.period) rowY += 2 + text(`Service period: ${info.period}`, cols.desc, rowY + 2, { size: 8.5, color: COLOR.muted, width: 250 });
  rowY += 14;
  doc.moveTo(M, rowY).lineTo(M + CW, rowY).lineWidth(0.75).strokeColor(COLOR.line).stroke();

  // Totals (right) and amount in words + payment (left)
  const blockY = rowY + 20;
  const totalsW = 228;
  const totalsX = M + CW - totalsW;
  let ty = blockY;
  const totalRow = (name, value) => {
    text(name, totalsX, ty, { size: 9, color: COLOR.body });
    text(value, totalsX, ty, { font: "semibold", size: 9.5, color: COLOR.ink, width: totalsW, align: "right" });
    ty += 19;
  };
  totalRow(info.taxableLabel, info.taxable);
  info.taxRows.forEach((row) => totalRow(row.label, row.amount));
  ty += 4;
  doc.roundedRect(totalsX, ty, totalsW, 40, 10).fill(gradient(totalsX, ty, totalsX + totalsW, ty + 40));
  text(info.totalLabel, totalsX + 14, ty + 14.5, { font: "semibold", size: 9.5, color: "#ffffff" });
  text(info.total, totalsX, ty + 10.5, { font: "display", size: 15, color: "#ffffff", width: totalsW - 14, align: "right" });
  ty += 52;
  text(`✓  Paid in full on ${info.paidOn}`, totalsX, ty, { font: "semibold", size: 8.5, color: COLOR.green, width: totalsW, align: "right" });
  ty += 14;

  const leftW = CW - totalsW - 32;
  let ly = blockY;
  ly += label("Amount in words", M, ly) + 5;
  ly += text(info.words, M, ly, { font: "semibold", size: 9.5, color: COLOR.ink, width: leftW }) + 16;
  ly += label("Payment", M, ly) + 6;
  const paymentRows = [
    ["Paid on", info.paidOn],
    ["Method", invoice.paymentMethod],
    ["Payment ID", invoice.razorpayPaymentId],
    ["Subscription ID", invoice.razorpaySubscriptionId],
  ].filter(([, value]) => value);
  for (const [name, value] of paymentRows) {
    text(name, M, ly, { size: 8.5, color: COLOR.muted });
    ly += Math.max(13, text(value, M + 82, ly, { size: 8.5, color: COLOR.body, width: leftW - 82 }) + 3);
  }

  // Notes
  const notesY = Math.max(ty, ly) + 22;
  const notesText = info.notes.map((note) => `•  ${note}`).join("\n");
  doc.font("regular").fontSize(8.5);
  const notesH = doc.heightOfString(notesText, { width: CW - 28, lineGap: 3 }) + 38;
  doc.lineWidth(0.75).roundedRect(M, notesY, CW, notesH, 10).stroke(COLOR.line);
  label("Notes", M + 14, notesY + 13);
  text(notesText, M + 14, notesY + 27, { size: 8.5, color: COLOR.body, width: CW - 28, lineGap: 3 });
  text("Thank you for choosing QR-Genie.", M, notesY + notesH + 26, { font: "display", size: 12, color: COLOR.accent });

  // Footer
  const footY = PAGE_H - 74;
  doc.moveTo(M, footY).lineTo(M + CW, footY).lineWidth(0.75).strokeColor(COLOR.line).stroke();
  text("This is a computer-generated invoice and does not need a signature.", M, footY + 14, { size: 8, color: COLOR.muted, width: CW, align: "center" });
  text(`Questions about this invoice? Write to ${seller.email}  ·  qr-genie.co`, M, footY + 28, { size: 8, color: COLOR.muted, width: CW, align: "center" });
  doc.rect(0, PAGE_H - 5, PAGE_W, 5).fill(gradient(0, 0, PAGE_W, 0));

  doc.end();
  return done;
}
