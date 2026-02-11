import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

/**
 * Temporary dummy checkout API for Basic Package ($5/month)
 * This can later be replaced with Razorpay integration
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const now = new Date();
    // Basic plan: $5/month = 30 days
    const endsAt = new Date(now);
    endsAt.setUTCMonth(endsAt.getUTCMonth() + 1);

    // Update user subscription to BASIC
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionPlan: "BASIC",
        subscriptionStartedAt: now,
        subscriptionEndsAt: endsAt,
      },
    });

    // Reactivate all paused QR codes (from trial expiry)
    await prisma.qRCode.updateMany({
      where: { 
        userId: user.id,
        deactivatedReason: "TRIAL_EXPIRED"
      },
      data: { 
        isActive: true, 
        deactivatedReason: null 
      },
    });

    res.status(200).json({
      success: true,
      message: "Basic Package activated successfully!",
      plan: "BASIC",
      expiresAt: endsAt,
    });
  } catch (err) {
    console.error("Basic checkout: failed to update user/QRs", err);
    return res.status(500).json({ error: "Checkout failed. Please try again." });
  }
}
