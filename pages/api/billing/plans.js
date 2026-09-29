import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";
import { getClientIp } from "../../../lib/clientIp";
import { getBasicPlans, publicPlans, pickDefaultCurrency, getSubscriptionCurrency } from "../../../lib/plans";

/**
 * GET /api/billing/plans
 * Basic Package prices per currency (from Razorpay), the currency to show by default,
 * and for subscribers the currency of their current subscription.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const plans = await getBasicPlans();
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { country: true, billingCountry: true, razorpaySubscriptionId: true },
    });
    const currentCurrency = await getSubscriptionCurrency(account?.razorpaySubscriptionId, plans);

    return res.status(200).json({
      plans: publicPlans(plans),
      defaultCurrency: currentCurrency || pickDefaultCurrency(plans, { ip: getClientIp(req), user: account }),
      currentCurrency,
    });
  } catch (err) {
    console.error("Billing plans:", err);
    return res.status(500).json({ error: "Couldn't load prices. Please try again." });
  }
}
