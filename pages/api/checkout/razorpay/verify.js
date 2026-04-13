import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";
import { activateBasicSubscriptionForUser } from "../../../../lib/activateBasicSubscription";
import { verifySubscriptionPaymentSignature } from "../../../../lib/razorpayVerify";
import { trimEnv } from "../../../../lib/razorpayClient";

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

  try {
    const subUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, razorpaySubscriptionId: true },
    });
    if (!subUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    await activateBasicSubscriptionForUser({
      userId: subUser.id,
      razorpaySubscriptionId: razorpay_subscription_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    return res.status(200).json({
      success: true,
      message: "Basic Package activated successfully!",
      plan: "BASIC",
    });
  } catch (err) {
    console.error("Razorpay verify:", err);
    return res.status(500).json({ error: "Could not activate subscription. Contact support." });
  }
}
