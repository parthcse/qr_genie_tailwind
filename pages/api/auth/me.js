// pages/api/auth/me.js
import { getUserFromRequest } from "../../../lib/auth";
import { getUserSubscriptionStatus } from "../../../lib/subscription";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getUserFromRequest(req);

    if (user) {
      const subscriptionStatus = getUserSubscriptionStatus(user);
      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name || null,
          subscriptionPlan: user.subscriptionPlan ?? "EXPIRED",
          trialStartedAt: user.trialStartedAt,
          trialEndsAt: user.trialEndsAt,
          subscriptionStartedAt: user.subscriptionStartedAt,
          subscriptionEndsAt: user.subscriptionEndsAt,
        },
        subscriptionStatus,
      });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}