import prisma from "../../../lib/prisma";
import { activateBasicSubscriptionForUser, getRazorpayPeriodEnd } from "../../../lib/activateBasicSubscription";
import { sendPlanEmails } from "../../../lib/subscriptionEmails";
import { issueInvoiceForPayment } from "../../../lib/invoices";
import { verifyWebhookSignature } from "../../../lib/razorpayVerify";
import { trimEnv } from "../../../lib/razorpayClient";

export const config = {
  api: {
    bodyParser: false,
  },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/**
 * Backup activation path when the browser never calls /api/checkout/razorpay/verify.
 * Configure in Razorpay Dashboard → Webhooks (test mode): point to this URL.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const webhookSecret = trimEnv("RAZORPAY_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET not set");
    return res.status(500).json({ error: "Webhook not configured" });
  }

  let raw;
  try {
    raw = await getRawBody(req);
  } catch (e) {
    return res.status(400).end();
  }

  const bodyStr = raw.toString("utf8");
  const signature = req.headers["x-razorpay-signature"];
  if (!verifyWebhookSignature(bodyStr, signature, webhookSecret)) {
    return res.status(400).end();
  }

  let event;
  try {
    event = JSON.parse(bodyStr);
  } catch {
    return res.status(400).end();
  }

  const eventName = event.event;
  if (eventName !== "subscription.activated" && eventName !== "subscription.charged") {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const subscription = event.payload?.subscription?.entity;
  if (!subscription?.notes?.userId) {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const userId = subscription.notes.userId;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    // Uses Razorpay's period end, so activated + charged for the same payment, and webhook retries, don't stack
    const payment = event.payload?.payment?.entity;
    const activation = await activateBasicSubscriptionForUser({
      userId,
      periodEnd: getRazorpayPeriodEnd(subscription),
      razorpayCustomerId: subscription.customer_id || undefined,
      razorpaySubscriptionId: subscription.id,
      razorpayPaymentId: payment?.id || undefined,
    });

    // Not awaited, so Razorpay gets its answer quickly. A new subscription and each renewal payment are emailed once,
    // whether checkout or this webhook reports them first.
    sendPlanEmails({ userId, subscription, paymentId: payment?.id, payment, activation, source: "webhook" });
    // Every charge (the first payment and each renewal) gets a GST invoice, once per payment
    if (payment?.id) issueInvoiceForPayment({ userId, payment, subscription });
  } catch (err) {
    console.error("Razorpay webhook activate:", err);
    return res.status(500).json({ error: "Processing failed" });
  }

  return res.status(200).json({ ok: true });
}
