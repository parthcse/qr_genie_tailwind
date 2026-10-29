import prisma from "@/lib/prisma";
import { getRazorpayClient } from "./razorpayClient";
import { getUserSubscriptionStatus } from "./subscription";
import { getPlanStart, findUpfrontPayment } from "./activateBasicSubscription";
import { formatDate, adminRecipients } from "./subscriptionEmails";
import { formatPrice } from "./price";
import { sendCancellationEmailToCustomer, sendCancellationEmailToAdmin } from "@/lib/email";
import { SUPPORT_EMAIL, CANCEL_REASONS } from "@/lib/site";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Razorpay answers 429 when it's busy; such a request wasn't processed, so it's safe to send again shortly
async function retryWhenBusy(call) {
  for (const wait of [1000, 2500]) {
    try {
      return await call();
    } catch (err) {
      if (err?.statusCode !== 429) throw err;
      await sleep(wait);
    }
  }
  return call();
}

/** A failure the customer should see, with the HTTP status to answer with */
export class CancelError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Refunds the upfront payment of a subscription bought during the free days, in full and once.
 * Returns { amount, refundId, paymentId } when refunded, or { amount, paymentId, error } when it couldn't be (the admin
 * email then asks for a manual refund).
 */
async function refundUpfrontPayment(subscription, userId) {
  let payment = null;
  try {
    payment = await retryWhenBusy(() => findUpfrontPayment(subscription.id));
    if (!payment) return { error: "no paid payment found for this subscription" };
    if (payment.status !== "captured" || payment.amount_refunded > 0) {
      return { amount: payment.amount, currency: payment.currency, paymentId: payment.id, error: `payment is ${payment.status}, ${payment.amount_refunded} already refunded` };
    }
    const refund = await retryWhenBusy(() =>
      getRazorpayClient().payments.refund(payment.id, {
        amount: payment.amount,
        speed: "normal",
        notes: { reason: "Cancelled before the paid months started", userId },
      })
    );
    return { amount: payment.amount, currency: payment.currency, paymentId: payment.id, refundId: refund.id };
  } catch (err) {
    console.error("Cancel subscription: refund", err?.error?.description || err.message);
    return { amount: payment?.amount, currency: payment?.currency, paymentId: payment?.id, error: err?.error?.description || err.message };
  }
}

/**
 * Cancels a customer's subscription (billing page). Two cases:
 * - Bought during the free days and the paid months haven't started yet: cancelled straight away and the payment is
 *   refunded in full. The customer goes back to their free days, which run to their original end date, and can buy a
 *   plan again.
 * - Otherwise Razorpay stops charging: a subscription in a billing cycle is cancelled at the end of that cycle, so the
 *   customer keeps the period they've paid for (no refund); one with no cycle running (not charged yet, or retrying a
 *   failed payment) is cancelled straight away. On our side the plan runs until subscriptionEndsAt and then ends,
 *   without the renewal grace days (lib/billing/subscription.js).
 *
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} [opts.reason] - a CANCEL_REASONS value
 * @param {string} [opts.comment] - free text, up to 500 characters
 * @returns {Promise<{ endsAt: Date|null, alreadyCancelled: boolean, refund?: { amount: string, ok: boolean }, freeDaysEndAt?: Date }>}
 */
export async function cancelSubscriptionForUser({ userId, reason, comment }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true, company: true, subscriptionPlan: true, trialEndsAt: true,
      subscriptionEndsAt: true, subscriptionCancelledAt: true, razorpaySubscriptionId: true,
    },
  });
  if (!user) throw new CancelError("Not authenticated", 401);
  if (user.subscriptionCancelledAt) return { endsAt: user.subscriptionEndsAt, alreadyCancelled: true };
  if (getUserSubscriptionStatus(user).status !== "SUBSCRIPTION_ACTIVE" || !user.razorpaySubscriptionId) {
    throw new CancelError("You don't have an active subscription to cancel.", 400);
  }

  const rzp = getRazorpayClient();
  let subscription;
  try {
    subscription = await retryWhenBusy(() => rzp.subscriptions.fetch(user.razorpaySubscriptionId));
  } catch (err) {
    console.error("Cancel subscription: fetch", err?.error?.description || err.message);
    throw new CancelError("We couldn't reach our payment provider. Please try again in a moment.", 502);
  }
  if (subscription.notes?.userId !== user.id) {
    console.error(`Cancel subscription: ${subscription.id} is not linked to user ${user.id}`);
    throw new CancelError("We couldn't match this subscription to your account. Please contact us and we'll cancel it for you.", 400);
  }

  // Bought during the free days, and those days aren't over: nothing paid for has been used yet
  const planStartsAt = getPlanStart(subscription);
  const beforePaidMonths = !!planStartsAt && planStartsAt > new Date();

  if (!["cancelled", "completed", "expired"].includes(subscription.status)) {
    try {
      const atCycleEnd = !beforePaidMonths && subscription.status === "active";
      await retryWhenBusy(() => rzp.subscriptions.cancel(subscription.id, atCycleEnd));
    } catch (err) {
      console.error("Cancel subscription: Razorpay", err?.error?.description || err.message);
      throw new CancelError("We couldn't cancel your subscription just now. Please try again, or contact us and we'll do it for you.", 502);
    }
  }

  const label = CANCEL_REASONS.find((r) => r.value === reason)?.label || null;
  const note = typeof comment === "string" ? comment.replace(/\s+/g, " ").trim().slice(0, 500) : "";
  const cancellationReason = [label, note].filter(Boolean).join(" - ") || null;

  // Only the first of two simultaneous requests records the cancellation, refunds and sends the emails. Before the paid
  // months the customer goes back to their free days (which end where the paid months would have started).
  const claimed = await prisma.user.updateMany({
    where: { id: user.id, subscriptionCancelledAt: null },
    data: {
      subscriptionCancelledAt: new Date(),
      cancellationReason,
      ...(beforePaidMonths
        ? { subscriptionPlan: "TRIAL", trialEndsAt: planStartsAt, subscriptionStartedAt: null, subscriptionEndsAt: null, subscriptionMonths: null }
        : {}),
    },
  });
  if (claimed.count === 0) return { endsAt: user.subscriptionEndsAt, alreadyCancelled: true };

  const refund = beforePaidMonths ? await refundUpfrontPayment(subscription, user.id) : null;
  const refundAmount = refund?.amount != null && refund.currency ? formatPrice(refund.amount, refund.currency) : null;

  // Not awaited: the customer shouldn't wait for email, and a mail problem doesn't undo the cancellation
  const endsOn = beforePaidMonths ? null : formatDate(user.subscriptionEndsAt);
  const freeDaysEndOn = beforePaidMonths ? formatDate(planStartsAt) : null;
  const invoice = refund?.paymentId
    ? await prisma.invoice.findUnique({ where: { razorpayPaymentId: refund.paymentId }, select: { number: true } }).catch(() => null)
    : null;
  Promise.all([
    sendCancellationEmailToCustomer({
      to: user.email,
      name: user.name,
      endsOn,
      supportEmail: SUPPORT_EMAIL,
      refund: refund ? { amount: refundAmount, ok: !refund.error, freeDaysEndOn } : null,
    }),
    sendCancellationEmailToAdmin({
      to: adminRecipients(),
      customer: { name: user.name, email: user.email, company: user.company },
      endsOn,
      reason: cancellationReason,
      subscriptionId: subscription.id,
      refund: refund ? { ...refund, amount: refundAmount, invoiceNumber: invoice?.number || null } : null,
    }),
  ]).catch((err) => console.error("Cancellation emails:", err.message));

  return beforePaidMonths
    ? { endsAt: null, alreadyCancelled: false, freeDaysEndAt: planStartsAt, refund: { amount: refundAmount, ok: !refund?.error } }
    : { endsAt: user.subscriptionEndsAt, alreadyCancelled: false };
}

/**
 * Razorpay reports a cancelled subscription (subscription.cancelled webhook): cancelled from its dashboard, after
 * failed payments, or at the end of a cycle we scheduled. Recorded only if it's the customer's current subscription,
 * so a cancelled old one never marks a newer subscription.
 */
export async function recordRazorpayCancellation(subscription) {
  const userId = subscription?.notes?.userId;
  if (!userId || !subscription.id) return;
  await prisma.user.updateMany({
    where: { id: userId, razorpaySubscriptionId: subscription.id, subscriptionCancelledAt: null },
    data: { subscriptionCancelledAt: new Date() },
  });
}
