import prisma from "./prisma";

/**
 * End of the paid period for a Razorpay subscription entity (current_end is unix seconds), or null if not set yet.
 */
export function getRazorpayPeriodEnd(subscription) {
  return subscription?.current_end ? new Date(subscription.current_end * 1000) : null;
}

/**
 * Puts a user on the Basic plan until the end of their current Razorpay billing period.
 * Because periodEnd comes from Razorpay, repeated calls for the same period (verify plus the
 * activated/charged webhooks, webhook retries, replayed requests) all land on the same date.
 * The end date never moves backwards.
 *
 * @param {object} opts
 * @param {string} opts.userId
 * @param {Date|null} opts.periodEnd - from getRazorpayPeriodEnd; falls back to one month from now when Razorpay hasn't set it yet
 * @param {string} [opts.razorpayCustomerId]
 * @param {string} [opts.razorpaySubscriptionId]
 * @param {string} [opts.razorpayPaymentId]
 */
export async function activateBasicSubscriptionForUser({
  userId,
  periodEnd,
  razorpayCustomerId,
  razorpaySubscriptionId,
  razorpayPaymentId,
}) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionEndsAt: true },
  });

  const now = new Date();
  let endsAt = periodEnd;
  if (!endsAt) {
    endsAt = new Date(now);
    endsAt.setUTCMonth(endsAt.getUTCMonth() + 1);
  }
  if (existing?.subscriptionEndsAt && new Date(existing.subscriptionEndsAt) > endsAt) {
    endsAt = new Date(existing.subscriptionEndsAt);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionPlan: "BASIC",
      subscriptionStartedAt: now,
      subscriptionEndsAt: endsAt,
      ...(razorpayCustomerId ? { razorpayCustomerId } : {}),
      ...(razorpaySubscriptionId ? { razorpaySubscriptionId } : {}),
      ...(razorpayPaymentId ? { razorpayLastPaymentId: razorpayPaymentId } : {}),
    },
  });

  // Bring back codes that plan expiry paused; manually paused and deleted codes stay as they are
  const reactivated = await prisma.qRCode.updateMany({
    where: {
      userId,
      status: { not: "DELETED" },
      deactivatedReason: { in: ["TRIAL_EXPIRED", "SUBSCRIPTION_EXPIRED"] },
    },
    data: {
      deactivatedReason: null,
      status: "ACTIVE",
    },
  });

  return { plan: "BASIC", expiresAt: endsAt, reactivatedCount: reactivated.count };
}
