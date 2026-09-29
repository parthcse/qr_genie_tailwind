import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";
import { getRazorpayClient, trimEnv } from "../../../../lib/razorpayClient";
import { normalizeRazorpayApiError } from "../../../../lib/razorpayError";
import { getUserSubscriptionStatus } from "../../../../lib/subscription";
import { getBasicPlans } from "../../../../lib/plans";

/**
 * Creates a Razorpay subscription for the Basic plan in the currency the user picked ({ currency: "INR" | "USD" }).
 * Plans come from RAZORPAY_PLAN_ID_INR / RAZORPAY_PLAN_ID_USD (Razorpay Dashboard → Subscriptions → Plans).
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Razorpay renews automatically; a second subscription would bill the user twice
  if (getUserSubscriptionStatus(user).status === "SUBSCRIPTION_ACTIVE") {
    return res.status(400).json({ error: "You already have an active Basic Package. It renews automatically." });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  let planId;
  try {
    const plans = await getBasicPlans();
    const plan = plans[body.currency] || Object.values(plans)[0];
    if (!plan) {
      console.error("No Razorpay plan could be loaded; set RAZORPAY_PLAN_ID_INR and/or RAZORPAY_PLAN_ID_USD");
      return res.status(500).json({ error: "Payment is not configured yet. Please try again later." });
    }
    planId = plan.planId;
  } catch (err) {
    console.error("Razorpay plans:", err);
    const { statusCode, message } = normalizeRazorpayApiError(err);
    return res.status(statusCode === 401 ? 401 : 500).json({ error: message });
  }

  try {
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        telephone: true,
        razorpayCustomerId: true,
      },
    });
    if (!fullUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const rzp = getRazorpayClient();

    let customerId = fullUser.razorpayCustomerId;
    if (!customerId) {
      const customerPayload = {
        name: fullUser.name || fullUser.email.split("@")[0],
        email: fullUser.email,
      };
      if (fullUser.telephone && String(fullUser.telephone).replace(/\D/g, "").length >= 10) {
        customerPayload.contact = String(fullUser.telephone).replace(/\s/g, "");
      }
      const customer = await rzp.customers.create(customerPayload);
      customerId = customer.id;
      await prisma.user.update({
        where: { id: fullUser.id },
        data: { razorpayCustomerId: customerId },
      });
    }

    const subscription = await rzp.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      customer_notify: 1,
      quantity: 1,
      total_count: 60,
      notes: {
        userId: fullUser.id,
        app: "qr_genie",
      },
    });

    return res.status(200).json({
      keyId: trimEnv("RAZORPAY_KEY_ID"),
      subscriptionId: subscription.id,
      name: "QR Genie",
      description: "Basic Package",
      prefill: {
        email: fullUser.email,
        name: fullUser.name || undefined,
      },
    });
  } catch (err) {
    console.error("Razorpay create-subscription:", err);
    const { statusCode, message } = normalizeRazorpayApiError(err);
    return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
      error: message,
    });
  }
}
