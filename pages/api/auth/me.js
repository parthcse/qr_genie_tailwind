// pages/api/auth/me.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";
import { getUserSubscriptionStatus } from "../../../lib/subscription";

const TRIAL_DAYS = 120;

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let user = await getUserFromRequest(req);

    if (user) {
      const plan = user.subscriptionPlan ?? null;
      const hasTrialEnd = user.trialEndsAt != null;
      const hadPaid = user.subscriptionStartedAt != null;
      const needsInit = (plan === null || plan === "" || plan === "EXPIRED") && !hasTrialEnd && !hadPaid;

      if (needsInit) {
        try {
          const qrCount = await prisma.qRCode.count({ where: { userId: user.id } });
          const now = new Date();
          if (qrCount > 0) {
            await prisma.user.update({
              where: { id: user.id },
              data: { subscriptionPlan: "EXPIRED" },
            });
            await prisma.qRCode.updateMany({
              where: { userId: user.id },
              data: { isActive: false, deactivatedReason: "TRIAL_EXPIRED" },
            });
            user = { ...user, subscriptionPlan: "EXPIRED", trialEndsAt: null };
          } else {
            const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
            await prisma.user.update({
              where: { id: user.id },
              data: {
                subscriptionPlan: "TRIAL",
                trialStartedAt: now,
                trialEndsAt,
                subscriptionStartedAt: null,
                subscriptionEndsAt: null,
              },
            });
            user = { ...user, subscriptionPlan: "TRIAL", trialStartedAt: now, trialEndsAt, subscriptionStartedAt: null, subscriptionEndsAt: null };
          }
        } catch (err) {
          console.error("Auth me: trial init failed", err);
        }
      }

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