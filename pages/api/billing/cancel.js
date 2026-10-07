import { getUserFromRequest } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";
import { cancelSubscriptionForUser, CancelError } from "@/lib/billing/cancelSubscription";

/**
 * POST /api/billing/cancel  { reason?, comment? }
 * Cancels the signed-in customer's Basic subscription: no further charges, the plan runs to the end of the paid
 * period. Asking again after it's cancelled just returns the same answer.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (isRateLimited(`cancel-subscription:${user.id}`, 60 * 60 * 1000, 10)) {
    return res.status(429).json({ error: "Too many attempts. Please try again later." });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  try {
    const { endsAt, alreadyCancelled } = await cancelSubscriptionForUser({ userId: user.id, reason: body.reason, comment: body.comment });
    return res.status(200).json({ cancelled: true, endsAt, alreadyCancelled });
  } catch (err) {
    if (err instanceof CancelError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("Cancel subscription:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again, or contact us and we'll cancel it for you." });
  }
}
