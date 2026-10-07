import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";
import { activateBasicSubscriptionForUser, getRazorpayPeriodEnd } from "../../../../lib/activateBasicSubscription";
import { sendPlanEmails } from "../../../../lib/subscriptionEmails";
import { issueInvoiceForPayment } from "../../../../lib/invoices";
import { verifySubscriptionPaymentSignature } from "../../../../lib/razorpayVerify";
import { getRazorpayClient, trimEnv } from "../../../../lib/razorpayClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const secret = trimEnv("RAZORPAY_KEY_SECRET");
  if (!secret) {
    return res.status(500).json({ error: "Server payment config missing" });
  }

  const {
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
  } = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  const ok = verifySubscriptionPaymentSignature({
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
    secret,
  });

  if (!ok) {
    return res.status(400).json({ error: "Invalid payment signature" });
  }

  let subscription;
  try {
    subscription = await getRazorpayClient().subscriptions.fetch(razorpay_subscription_id);
  } catch (err) {
    console.error("Razorpay verify: subscription fetch", err);
    return res.status(502).json({ error: "Could not confirm your payment with Razorpay. Please try again." });
  }

  // The signature proves Razorpay issued this payment, not that it belongs to the signed-in account
  if (subscription.notes?.userId !== user.id) {
    return res.status(400).json({ error: "This payment does not belong to your account" });
  }
  if (!["active", "authenticated"].includes(subscription.status)) {
    return res.status(400).json({ error: "This subscription is no longer active" });
  }

  try {
    const subUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, razorpayLastPaymentId: true },
    });
    if (!subUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Already processed (page reload, double submit, replay): don't touch the plan again
    let reactivatedCount = 0;
    if (subUser.razorpayLastPaymentId !== razorpay_payment_id) {
      const activation = await activateBasicSubscriptionForUser({
        userId: subUser.id,
        periodEnd: getRazorpayPeriodEnd(subscription),
        razorpayCustomerId: subscription.customer_id || undefined,
        razorpaySubscriptionId: razorpay_subscription_id,
        razorpayPaymentId: razorpay_payment_id,
      });
      reactivatedCount = activation.reactivatedCount;

      // Not awaited: the customer shouldn't wait for email. Sent once per subscription even if a webhook reports it too.
      sendPlanEmails({
        userId: subUser.id,
        subscription,
        paymentId: razorpay_payment_id,
        activation,
        source: "checkout",
      });
    }

    // Not awaited either. One invoice per payment, even if the webhook got here first or this request is repeated.
    issueInvoiceForPayment({ userId: subUser.id, paymentId: razorpay_payment_id, subscription });

    return res.status(200).json({
      success: true,
      message: "Basic Package activated successfully!",
      plan: "BASIC",
      reactivatedCount,
    });
  } catch (err) {
    console.error("Razorpay verify:", err);
    return res.status(500).json({ error: "Could not activate subscription. Contact support." });
  }
}
