import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

/** Plan to amount (INR paise) and duration (months) - for mock only */
const PLAN_CONFIG = {
  MONTHLY: { amountPaise: 179900, months: 1 },
  QUARTERLY: { amountPaise: 299700, months: 3 },
  ANNUAL: { amountPaise: 838800, months: 12 },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const plan = req.body?.plan;
  if (!plan || !["MONTHLY", "QUARTERLY", "ANNUAL"].includes(plan)) {
    return res.status(400).json({ error: "Invalid plan. Use MONTHLY, QUARTERLY, or ANNUAL." });
  }

  const config = PLAN_CONFIG[plan];
  const orderId = `order_mock_${Date.now()}_${user.id.slice(-6)}`;

  try {
    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setUTCMonth(endsAt.getUTCMonth() + config.months);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionPlan: plan,
        subscriptionStartedAt: now,
        subscriptionEndsAt: endsAt,
      },
    });

    await prisma.qRCode.updateMany({
      where: { userId: user.id },
      data: { isActive: true, deactivatedReason: null },
    });
  } catch (err) {
    console.error("Mock checkout: failed to update user/QRs", err);
    return res.status(500).json({ error: "Checkout update failed. Please try again." });
  }

  res.status(200).json({
    orderId,
    amount: config.amountPaise,
    currency: "INR",
  });
}
