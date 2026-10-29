import prisma from "@/lib/prisma";
import { activateBasicSubscriptionForUser, getRazorpayPeriodEnd, getPlanStart, findUpfrontPayment } from "@/lib/billing/activateBasicSubscription";
import { sendPlanEmails } from "@/lib/billing/subscriptionEmails";
import { issueInvoiceForPayment } from "@/lib/invoices/invoices";
import { recordRazorpayCancellation } from "@/lib/billing/cancelSubscription";
import { verifyWebhookSignature } from "@/lib/billing/razorpayVerify";
import { trimEnv } from "@/lib/billing/razorpayClient";

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

  // Cancelled outside the billing page (Razorpay dashboard, failed payments) or at the end of a cycle we scheduled
  if (eventName === "subscription.cancelled") {
    try {
      await recordRazorpayCancellation(event.payload?.subscription?.entity);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("Razorpay webhook cancelled:", err);
      return res.status(500).json({ error: "Processing failed" });
    }
  }

  if (!["subscription.authenticated", "subscription.activated", "subscription.charged"].includes(eventName)) {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const subscription = event.payload?.subscription?.entity;
  if (!subscription?.notes?.userId) {
    return res.status(200).json({ ok: true, ignored: true });
  }
  // Bought during the free days: paid upfront when the customer authorises it (authenticated), while Razorpay's own
  // charges start when the paid months end. Other subscriptions are switched on by activated / charged.
  const boughtInFreeDays = !!getPlanStart(subscription);
  if (eventName === "subscription.authenticated" && !boughtInFreeDays) {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const userId = subscription.notes.userId;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    let payment = event.payload?.payment?.entity;
    if (!payment && eventName === "subscription.authenticated") {
      payment = await findUpfrontPayment(subscription.id);
      if (!payment) return res.status(200).json({ ok: true, ignored: true }); // authorised but not paid yet
    }

    // Uses Razorpay's period end, so activated + charged for the same payment, and webhook retries, don't stack
    const activation = await activateBasicSubscriptionForUser({
      userId,
      periodEnd: getRazorpayPeriodEnd(subscription),
      planStartsAt: getPlanStart(subscription),
      planId: subscription.plan_id,
      razorpayCustomerId: subscription.customer_id || undefined,
      razorpaySubscriptionId: subscription.id,
      razorpayPaymentId: payment?.id || undefined,
    });

    // When Razorpay starts charging a subscription bought in the free days, "activated" comes with that first renewal
    // charge; the charged event emails and invoices it, so activated adds nothing.
    if (eventName === "subscription.activated" && boughtInFreeDays) return res.status(200).json({ ok: true });

    // Not awaited, so Razorpay gets its answer quickly. A new subscription and each renewal payment are emailed once,
    // whether checkout or this webhook reports them first.
    sendPlanEmails({ userId, subscription, paymentId: payment?.id, payment, activation, source: "webhook" });
    // Every payment (the first one and each renewal) gets a GST invoice, once per payment
    if (payment?.id) issueInvoiceForPayment({ userId, payment, subscription });
  } catch (err) {
    console.error("Razorpay webhook activate:", err);
    return res.status(500).json({ error: "Processing failed" });
  }

  return res.status(200).json({ ok: true });
}
