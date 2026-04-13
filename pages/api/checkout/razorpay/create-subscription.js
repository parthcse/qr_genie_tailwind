import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";
import { getRazorpayClient, trimEnv } from "../../../../lib/razorpayClient";
import { normalizeRazorpayApiError } from "../../../../lib/razorpayError";

/**
 * Creates a Razorpay subscription for the Basic plan (test or live keys from env).
 * Requires RAZORPAY_BASIC_PLAN_ID from the Razorpay Dashboard (Subscriptions → Plans).
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const planId = process.env.RAZORPAY_BASIC_PLAN_ID?.trim().replace(/^["']|["']$/g, "");
  if (!planId) {
    console.error("RAZORPAY_BASIC_PLAN_ID is not set");
    return res.status(500).json({
      error: "Payment is not configured. Set RAZORPAY_BASIC_PLAN_ID in environment.",
    });
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

    try {
      await rzp.plans.fetch(planId);
    } catch (planErr) {
      const { statusCode, message } = normalizeRazorpayApiError(planErr);
      console.error("Razorpay plan fetch:", planErr);
      if (statusCode === 401) {
        return res.status(401).json({ error: message });
      }
      return res.status(400).json({
        error: `Invalid plan: ${message} Ensure RAZORPAY_BASIC_PLAN_ID is a valid subscription Plan ID (plan_…) created in your Razorpay Dashboard under Subscriptions → Plans and that it belongs to the same Live/Test account as your API keys.`,
      });
    }

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
