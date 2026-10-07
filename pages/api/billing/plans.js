import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { getClientIp } from "@/lib/clientIp";
import { getBasicPlans, publicPlans, currencyForIp, getSubscriptionCurrency } from "@/lib/billing/plans";

/**
 * GET /api/billing/plans
 * The Basic Package price (from Razorpay) in the currency this visitor pays in (rupees in India, dollars elsewhere),
 * and for subscribers the currency of their current subscription, whose price is included too.
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
      select: { razorpaySubscriptionId: true },
    });
    const currentCurrency = await getSubscriptionCurrency(account?.razorpaySubscriptionId, plans);
    const currency = currencyForIp(plans, getClientIp(req));
    const shown = Object.entries(publicPlans(plans)).filter(([c]) => c === currency || c === currentCurrency);

    return res.status(200).json({
      plans: Object.fromEntries(shown),
      currency,
      currentCurrency,
    });
  } catch (err) {
    console.error("Billing plans:", err);
    return res.status(500).json({ error: "Couldn't load prices. Please try again." });
  }
}
