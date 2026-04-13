import prisma from "../../../lib/prisma";
import { activateBasicSubscriptionForUser } from "../../../lib/activateBasicSubscription";
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

    await activateBasicSubscriptionForUser({
      userId,
      razorpayCustomerId: subscription.customer_id || undefined,
      razorpaySubscriptionId: subscription.id,
      razorpayPaymentId: event.payload?.payment?.entity?.id || undefined,
      isRenewal: eventName === "subscription.charged",
    });
  } catch (err) {
    console.error("Razorpay webhook activate:", err);
    return res.status(500).json({ error: "Processing failed" });
  }

  return res.status(200).json({ ok: true });
}
