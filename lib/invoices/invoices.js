import prisma from "@/lib/prisma";
import { getRazorpayClient, trimEnv } from "@/lib/billing/razorpayClient";
import { describeMethod } from "@/lib/billing/subscriptionEmails";
import { renderInvoicePdf } from "./invoicePdf";
import { describeInvoice } from "./invoiceFormat";
import { sendInvoiceEmail, emailConfigured } from "@/lib/email";
import { SUPPORT_EMAIL } from "@/lib/site";
import {
  decideSupply,
  splitInclusiveTotal,
  financialYear,
  invoiceNumber,
  findStateCode,
  stateLabel,
  isValidGstin,
  normalizeGstin,
} from "./gst";

/**
 * GST tax invoices: one per successful Razorpay payment (the first one and every renewal), numbered
 * QG/<financial year>/<sequence> and emailed to the customer as a PDF. Prices include GST, so the tax is worked out
 * backwards from the amount paid (lib/invoices/gst.js).
 *
 * The seller's details come from INVOICE_SELLER_NAME, INVOICE_SELLER_ADDRESS (lines separated by "|") and
 * INVOICE_SELLER_GSTIN; until all three are set (with a valid GSTIN), no invoices are issued. Optional:
 * INVOICE_SAC (printed on the invoice) and INVOICE_LUT_ARN (exports billed in dollars carry no GST under that LUT).
 */

const PAYABLE = ["captured", "authorized"];
const RETRY_DELAYS_MS = [0, 15_000, 120_000];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let warnedNotConfigured = false;

export function sellerDetails() {
  const name = trimEnv("INVOICE_SELLER_NAME");
  const address = trimEnv("INVOICE_SELLER_ADDRESS").split("|").map((line) => line.trim()).filter(Boolean);
  const gstin = normalizeGstin(trimEnv("INVOICE_SELLER_GSTIN"));
  if (!name || !address.length || !isValidGstin(gstin)) return null;
  return {
    name,
    address,
    gstin,
    sac: trimEnv("INVOICE_SAC") || null,
    lutArn: trimEnv("INVOICE_LUT_ARN") || null,
    email: SUPPORT_EMAIL,
  };
}

/**
 * Issues (if needed) and emails the invoice for a payment. Checkout verify and the Razorpay webhooks may both call
 * this for the same payment, in any order: the payment ID is unique on Invoice, and the email is claimed before
 * sending, so each payment gets one invoice and one email. Never throws: the plan is already active by now.
 *
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} [opts.paymentId]
 * @param {object} [opts.payment] - Razorpay payment entity, when the caller already has it (webhooks)
 * @param {object} [opts.subscription] - Razorpay subscription entity, for the service period
 */
export async function issueInvoiceForPayment(opts) {
  try {
    await issueAndSend(opts);
  } catch (err) {
    console.error("Invoice:", err?.error?.description || err.message);
  }
}

async function issueAndSend({ userId, paymentId, payment, subscription }) {
  const id = payment?.id || paymentId;
  if (!id || !userId) return;

  const seller = sellerDetails();
  if (!seller) {
    if (!warnedNotConfigured) {
      console.warn("Invoices are off: set INVOICE_SELLER_NAME, INVOICE_SELLER_ADDRESS and a valid INVOICE_SELLER_GSTIN.");
      warnedNotConfigured = true;
    }
    return;
  }

  let invoice = await prisma.invoice.findUnique({ where: { razorpayPaymentId: id } });
  if (!invoice) {
    const paid = payment?.amount != null ? payment : await getRazorpayClient().payments.fetch(id);
    if (!PAYABLE.includes(paid.status)) {
      console.warn(`Invoice: payment ${id} is ${paid.status}, so no invoice`);
      return;
    }
    invoice = await createInvoice({ userId, payment: paid, subscription, seller });
    if (!invoice) return;
  }
  await emailInvoice(invoice);
}

/** The customer as printed on the invoice: billing details from the account page, else the general ones */
function customerDetails(user) {
  const hasBilling = [user.billingName, user.billingCompany, user.billingAddress, user.billingCity, user.billingState, user.billingZipCode, user.billingCountry].some(Boolean);
  const pick = (billing, general) => (hasBilling ? billing : general);
  const state = pick(user.billingState, user.state);
  const cityLine = [pick(user.billingCity, user.city), [state, pick(user.billingZipCode, user.zipCode)].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  const taxId = user.taxId?.trim() || null;
  const gstin = taxId && isValidGstin(taxId) ? normalizeGstin(taxId) : null;
  return {
    name: user.billingName || user.name || user.email,
    company: pick(user.billingCompany, user.company) || null,
    email: user.email,
    address: [pick(user.billingAddress, user.address), cityLine, pick(user.billingCountry, user.country)].filter(Boolean),
    gstin,
    taxId: gstin ? null : taxId,
    state,
  };
}

async function createInvoice({ userId, payment, subscription, seller }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true, name: true, company: true, address: true, city: true, state: true, zipCode: true, country: true,
      billingName: true, billingCompany: true, billingAddress: true, billingCity: true, billingState: true,
      billingZipCode: true, billingCountry: true, taxId: true,
    },
  });
  if (!user) return null;

  const { state, ...customer } = customerDetails(user);
  const currency = String(payment.currency || "INR").toUpperCase();
  // A registered customer's GSTIN says which state they're in; otherwise the state on their account
  const { supplyType, placeOfSupplyCode } = decideSupply({
    currency,
    sellerStateCode: seller.gstin.slice(0, 2),
    customerStateCode: customer.gstin ? customer.gstin.slice(0, 2) : findStateCode(state),
    exportUnderLut: !!seller.lutArn,
  });

  const issuedAt = new Date();
  const fy = financialYear(issuedAt);
  const data = {
    issuedAt,
    financialYear: fy,
    userId,
    razorpayPaymentId: payment.id,
    razorpaySubscriptionId: subscription?.id || null,
    paidAt: payment.created_at ? new Date(payment.created_at * 1000) : issuedAt,
    paymentMethod: describeMethod(payment),
    currency,
    total: payment.amount,
    ...splitInclusiveTotal(payment.amount, supplyType),
    supplyType,
    placeOfSupply: stateLabel(placeOfSupplyCode),
    description: "QR-Genie Basic Package (monthly subscription)",
    // Razorpay's period ends at the first second of the next one, so the last day shown is the day before
    periodStart: subscription?.current_start ? new Date(subscription.current_start * 1000) : null,
    periodEnd: subscription?.current_end ? new Date(subscription.current_end * 1000 - 1000) : null,
    seller: { name: seller.name, address: seller.address, gstin: seller.gstin, sac: seller.sac, lutArn: seller.lutArn, email: seller.email },
    customer,
  };

  // The number is taken in the same transaction as the invoice, so a failed insert leaves no gap in the series
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const counter = await tx.invoiceCounter.upsert({
          where: { financialYear: fy },
          create: { financialYear: fy, last: 1 },
          update: { last: { increment: 1 } },
        });
        return tx.invoice.create({ data: { ...data, sequence: counter.last, number: invoiceNumber(fy, counter.last) } });
      });
    } catch (err) {
      if (err.code !== "P2002") throw err;
      // Another request invoiced this payment first, or started this year's counter at the same moment
      const existing = await prisma.invoice.findUnique({ where: { razorpayPaymentId: payment.id } });
      if (existing) return existing;
    }
  }
  throw new Error(`no invoice number could be taken for payment ${payment.id}`);
}

async function emailInvoice(invoice) {
  if (invoice.emailedAt) return;
  const claimed = await prisma.invoice.updateMany({ where: { id: invoice.id, emailedAt: null }, data: { emailedAt: new Date() } });
  if (claimed.count === 0) return;

  let sent = false;
  try {
    const user = invoice.userId ? await prisma.user.findUnique({ where: { id: invoice.userId }, select: { name: true } }) : null;
    const pdf = await renderInvoicePdf(invoice);
    const info = describeInvoice(invoice);
    for (const delay of RETRY_DELAYS_MS) {
      if (delay) await sleep(delay);
      sent = await sendInvoiceEmail({
        to: invoice.customer.email,
        name: user?.name || null,
        invoice: { ...info, method: invoice.paymentMethod, paymentId: invoice.razorpayPaymentId },
        pdf,
        supportEmail: SUPPORT_EMAIL,
      });
      // Without SMTP the email only goes to the log, which isn't worth retrying
      if (sent || !emailConfigured()) break;
    }
  } finally {
    // Not delivered: release the claim so the next checkout or webhook call for this payment tries again
    if (!sent && emailConfigured()) {
      await prisma.invoice.update({ where: { id: invoice.id }, data: { emailedAt: null } }).catch(() => {});
    }
  }
}
