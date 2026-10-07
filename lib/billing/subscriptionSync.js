import prisma from "@/lib/prisma";
import { getQrPauseReason } from "./subscription";

const TRIAL_DAYS = 14;

/**
 * Pauses a user's live QR codes. Manually paused and deleted codes are left alone,
 * so reactivating after payment restores exactly what the plan expiry took down.
 */
export async function pauseActiveQrCodes(userId, reason) {
  await prisma.qRCode.updateMany({
    where: { userId, status: "ACTIVE" },
    data: { status: "PAUSED", deactivatedReason: reason },
  });
}

/**
 * Brings a signed-in user's plan and QR code statuses in line with their dates.
 * Runs on login and /api/auth/me. Returns the user with any changed plan fields applied.
 */
export async function syncSubscriptionState(user) {
  const plan = user.subscriptionPlan || "EXPIRED";

  // Accounts from before trials existed (no trial, never paid) get a trial if they have no codes yet
  if (plan === "EXPIRED" && !user.trialEndsAt && !user.subscriptionStartedAt) {
    const qrCount = await prisma.qRCode.count({ where: { userId: user.id } });
    if (qrCount === 0) {
      const now = new Date();
      const trial = {
        subscriptionPlan: "TRIAL",
        trialStartedAt: now,
        trialEndsAt: new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
        subscriptionStartedAt: null,
        subscriptionEndsAt: null,
      };
      await prisma.user.update({ where: { id: user.id }, data: trial });
      return { ...user, ...trial };
    }
  }

  const reason = getQrPauseReason(user);
  if (reason) {
    await pauseActiveQrCodes(user.id, reason);
  }
  return user;
}
