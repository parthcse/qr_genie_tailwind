import { formatInvoiceAmount, amountInWords, GST_RATE_PERCENT } from "./gst";

// Display text for an Invoice row, shared by the PDF (lib/invoices/invoicePdf.js) and the invoice email

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
export const formatInvoiceDate = (date) => (date ? dateFormat.format(new Date(date)) : null);

const HALF_RATE = GST_RATE_PERCENT / 2;

export function describeInvoice(invoice) {
  const money = (amount) => formatInvoiceAmount(amount, invoice.currency);
  const taxRows = {
    INTRA_STATE: [[`CGST @ ${HALF_RATE}%`, invoice.cgst], [`SGST @ ${HALF_RATE}%`, invoice.sgst]],
    INTER_STATE: [[`IGST @ ${GST_RATE_PERCENT}%`, invoice.igst]],
    EXPORT_WITH_IGST: [[`IGST @ ${GST_RATE_PERCENT}%`, invoice.igst]],
    EXPORT_LUT: [["IGST @ 0%", 0]],
  }[invoice.supplyType].map(([label, amount]) => ({ label, amount: money(amount) }));

  const lutArn = invoice.seller?.lutArn;
  const notes = {
    INTRA_STATE: [`The amount paid includes GST at ${GST_RATE_PERCENT}%.`],
    INTER_STATE: [`The amount paid includes GST at ${GST_RATE_PERCENT}%.`],
    EXPORT_WITH_IGST: ["Supply meant for export on payment of IGST.", `The amount paid includes IGST at ${GST_RATE_PERCENT}%.`],
    EXPORT_LUT: [`Supply meant for export under Letter of Undertaking without payment of IGST${lutArn ? ` (ARN ${lutArn})` : ""}.`],
  }[invoice.supplyType];

  const start = formatInvoiceDate(invoice.periodStart);
  const end = formatInvoiceDate(invoice.periodEnd);
  return {
    number: invoice.number,
    issuedOn: formatInvoiceDate(invoice.issuedAt),
    paidOn: formatInvoiceDate(invoice.paidAt),
    period: start && end ? `${start} – ${end}` : null,
    taxable: money(invoice.taxableValue),
    taxableLabel: invoice.supplyType === "EXPORT_LUT" ? "Taxable value" : "Taxable value (excl. GST)",
    taxRows,
    total: money(invoice.total),
    totalLabel: invoice.supplyType === "EXPORT_LUT" ? "Total" : "Total (incl. GST)",
    words: amountInWords(invoice.total, invoice.currency),
    notes: [...notes, "Tax payable on reverse charge: No."],
    filename: `QR-Genie-invoice-${invoice.number.replace(/\//g, "-")}.pdf`,
  };
}
