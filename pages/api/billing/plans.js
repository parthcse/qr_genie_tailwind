import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { getClientIp } from "@/lib/clientIp";
import { getPlans, publicPlans, currencyForIp, getSubscriptionPlan } from "@/lib/billing/plans";

/**
 * GET /api/billing/plans
 * The paid plans (3, 6 and 12 months, from Razorpay) in the currency this visitor pays in (rupees in India, dollars
 * elsewhere), and for subscribers the plan they're on ({ currency, term }), whose prices are included too.
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
    const plans = await getPlans();
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { razorpaySubscriptionId: true },
    });
    const currentPlan = await getSubscriptionPlan(account?.razorpaySubscriptionId, plans);
    const currency = currencyForIp(plans, getClientIp(req));
    const shown = Object.entries(publicPlans(plans)).filter(([c]) => c === currency || c === currentPlan?.currency);

    return res.status(200).json({
      plans: Object.fromEntries(shown),
      currency,
      current: currentPlan ? { currency: currentPlan.currency, term: currentPlan.term } : null,
    });
  } catch (err) {
    console.error("Billing plans:", err);
    return res.status(500).json({ error: "Couldn't load prices. Please try again." });
  }
}
