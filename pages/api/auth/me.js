// pages/api/auth/me.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";
import { getUserSubscriptionStatus } from "../../../lib/subscription";

const TRIAL_DAYS = 14;

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

      // Check if trial expired and pause QR codes if needed
      const now = new Date();
      if (user.subscriptionPlan === "TRIAL" && user.trialEndsAt && new Date(user.trialEndsAt) < now) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionPlan: "EXPIRED" },
          });
          await prisma.qRCode.updateMany({
            where: { userId: user.id, isActive: true },
            data: { isActive: false, deactivatedReason: "TRIAL_EXPIRED" },
          });
          user = { ...user, subscriptionPlan: "EXPIRED" };
        } catch (err) {
          console.error("Auth me: trial expiry check failed", err);
        }
      }

      // Fetch full user from DB so account/billing fields are included (getUserFromRequest returns subset)
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionPlan: true,
          trialStartedAt: true,
          trialEndsAt: true,
          subscriptionStartedAt: true,
          subscriptionEndsAt: true,
          telephone: true,
          company: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          language: true,
          billingName: true,
          billingCompany: true,
          billingAddress: true,
          billingCity: true,
          billingState: true,
          billingZipCode: true,
          billingCountry: true,
          taxId: true,
        },
      });
      const u = fullUser || user;
      const subscriptionStatus = getUserSubscriptionStatus(u);
      res.status(200).json({
        user: {
          id: u.id,
          email: u.email,
          name: u.name || null,
          subscriptionPlan: u.subscriptionPlan ?? "EXPIRED",
          trialStartedAt: u.trialStartedAt,
          trialEndsAt: u.trialEndsAt,
          subscriptionStartedAt: u.subscriptionStartedAt,
          subscriptionEndsAt: u.subscriptionEndsAt,
          telephone: u.telephone || null,
          company: u.company || null,
          address: u.address || null,
          city: u.city || null,
          state: u.state || null,
          zipCode: u.zipCode || null,
          country: u.country || null,
          language: u.language || "English",
          billingName: u.billingName || null,
          billingCompany: u.billingCompany || null,
          billingAddress: u.billingAddress || null,
          billingCity: u.billingCity || null,
          billingState: u.billingState || null,
          billingZipCode: u.billingZipCode || null,
          billingCountry: u.billingCountry || null,
          taxId: u.taxId || null,
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