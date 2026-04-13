import prisma from "./prisma";

/**
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} [opts.razorpayCustomerId]
 * @param {string} [opts.razorpaySubscriptionId]
 * @param {string} [opts.razorpayPaymentId]
 * @param {boolean} [opts.isRenewal=false] - Pass true for subscription.charged events so the end
 *   date is extended from the existing end date rather than from now (avoids shrinking the window
 *   when Razorpay charges a few days before the period ends).
 */
export async function activateBasicSubscriptionForUser({
  userId,
  razorpayCustomerId,
  razorpaySubscriptionId,
  razorpayPaymentId,
  isRenewal = false,
}) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionPlan: true,
      subscriptionEndsAt: true,
      razorpaySubscriptionId: true,
    },
  });

  const now = new Date();

  // For renewals extend from the later of (existing end date, now) so early charges don't shorten
  // the subscription window. For initial activation always start from now.
  const baseDate =
    isRenewal && existing?.subscriptionEndsAt && new Date(existing.subscriptionEndsAt) > now
      ? new Date(existing.subscriptionEndsAt)
      : new Date(now);

  const endsAt = new Date(baseDate);
  endsAt.setUTCMonth(endsAt.getUTCMonth() + 1);

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

  await prisma.qRCode.updateMany({
    where: {
      userId,
      deactivatedReason: "TRIAL_EXPIRED",
    },
    data: {
      isActive: true,
      deactivatedReason: null,
      status: "ACTIVE",
    },
  });

  return { plan: "BASIC", expiresAt: endsAt };
}

