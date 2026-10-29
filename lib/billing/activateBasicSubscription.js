import prisma from "@/lib/prisma";
import { getPlans, planForId } from "./plans";
import { getRazorpayClient } from "./razorpayClient";

/**
 * When the paid months begin for a subscription bought during the customer's free days, or null for one that started
 * straight away. create-subscription stores it in the subscription's notes (periodStart, unix seconds).
 */
export function getPlanStart(subscription) {
  const seconds = Number(subscription?.notes?.periodStart);
  return seconds > 0 ? new Date(seconds * 1000) : null;
}

/**
 * End of the paid period for a Razorpay subscription entity (unix seconds), or null if not known yet: Razorpay's
 * current_end once it has charged a cycle, or, for a subscription bought during the free days (paid upfront, first
 * Razorpay charge later), its start_at: the paid months run from the end of the free days up to that first renewal.
 */
export function getRazorpayPeriodEnd(subscription) {
  if (subscription?.current_end) return new Date(subscription.current_end * 1000);
  if (getPlanStart(subscription) && subscription?.start_at) return new Date(subscription.start_at * 1000);
  return null;
}

/**
 * The payment that paid a free-days subscription upfront: its first invoice, paid when the customer authorised it.
 * Returns the Razorpay payment entity, or null if it isn't paid (yet).
 */
export async function findUpfrontPayment(subscriptionId) {
  const rzp = getRazorpayClient();
  const invoices = await rzp.invoices.all({ subscription_id: subscriptionId });
  const paymentId = invoices?.items?.find((inv) => inv.status === "paid" && inv.payment_id)?.payment_id;
  return paymentId ? rzp.payments.fetch(paymentId) : null;
}

/**
 * Puts a user on a paid plan (3, 6 or 12 months) until the end of their current paid period.
 * Because periodEnd comes from Razorpay, repeated calls for the same period (verify plus the
 * authenticated/activated/charged webhooks, webhook retries, replayed requests) all land on the same date.
 * The end date never moves backwards.
 *
 * @param {object} opts
 * @param {string} opts.userId
 * @param {Date|null} opts.periodEnd - from getRazorpayPeriodEnd; falls back to the plan's length from now when it isn't known yet
 * @param {Date|null} [opts.planStartsAt] - from getPlanStart: when the paid months begin, if after the free days
 * @param {string} [opts.planId] - the subscription's Razorpay plan, which says how many months were paid for
 * @param {string} [opts.razorpayCustomerId]
 * @param {string} [opts.razorpaySubscriptionId]
 * @param {string} [opts.razorpayPaymentId]
 * @returns {{ plan, months, startsAt, expiresAt, reactivatedCount, isRenewal, previousPlan }} - for the plan emails (lib/billing/subscriptionEmails.js)
 */
export async function activateBasicSubscriptionForUser({
  userId,
  periodEnd,
  planStartsAt = null,
  planId,
  razorpayCustomerId,
  razorpaySubscriptionId,
  razorpayPaymentId,
}) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionEndsAt: true, subscriptionPlan: true, subscriptionMonths: true, razorpaySubscriptionId: true, razorpayLastPaymentId: true },
  });
  const plan = planId ? planForId(await getPlans().catch(() => ({})), planId) : null;
  const months = plan?.months || existing?.subscriptionMonths || null;

  // A later payment on the same subscription that already had one: a renewal, not a new subscriber
  const isRenewal =
    !!razorpayPaymentId &&
    existing?.subscriptionPlan === "BASIC" &&
    !!existing.razorpaySubscriptionId &&
    existing.razorpaySubscriptionId === razorpaySubscriptionId &&
    !!existing.razorpayLastPaymentId &&
    existing.razorpayLastPaymentId !== razorpayPaymentId;

  const now = new Date();
  let endsAt = periodEnd;
  if (!endsAt) {
    endsAt = new Date(planStartsAt || now);
    endsAt.setUTCMonth(endsAt.getUTCMonth() + (months || 1));
  }
  if (existing?.subscriptionEndsAt && new Date(existing.subscriptionEndsAt) > endsAt) {
    endsAt = new Date(existing.subscriptionEndsAt);
  }

  // A different subscription than the one on file is a fresh start: forget an earlier cancellation. Replayed events
  // for the cancelled subscription itself keep it cancelled.
  const newSubscription = !!razorpaySubscriptionId && razorpaySubscriptionId !== existing?.razorpaySubscriptionId;
  // The paid months start now, or when the free days end; renewals and replays keep the date
  const starting = newSubscription || existing?.subscriptionPlan !== "BASIC";

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(newSubscription ? { subscriptionCancelledAt: null, cancellationReason: null } : {}),
      subscriptionPlan: "BASIC",
      ...(months ? { subscriptionMonths: months } : {}),
      ...(starting ? { subscriptionStartedAt: planStartsAt || now } : {}),
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

  return {
    plan: "BASIC",
    months,
    startsAt: planStartsAt && planStartsAt > now ? planStartsAt : null,
    expiresAt: endsAt,
    reactivatedCount: reactivated.count,
    isRenewal,
    previousPlan: existing?.subscriptionPlan || null,
  };
}
