import prisma from "@/lib/prisma";
import { getRazorpayClient } from "./razorpayClient";
import { getUserSubscriptionStatus } from "./subscription";
import { formatDate, adminRecipients } from "./subscriptionEmails";
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
 * Cancels a customer's Basic subscription (billing page). Razorpay stops charging: a subscription in a billing cycle
 * is cancelled at the end of that cycle, so the customer keeps the month they've paid for; one with no cycle running
 * (not charged yet, or retrying a failed payment) is cancelled straight away. On our side the plan simply runs until
 * subscriptionEndsAt and then ends, without the renewal grace days (lib/billing/subscription.js).
 *
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} [opts.reason] - a CANCEL_REASONS value
 * @param {string} [opts.comment] - free text, up to 500 characters
 * @returns {Promise<{ endsAt: Date|null, alreadyCancelled: boolean }>}
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

  if (!["cancelled", "completed", "expired"].includes(subscription.status)) {
    try {
      await retryWhenBusy(() => rzp.subscriptions.cancel(subscription.id, subscription.status === "active"));
    } catch (err) {
      console.error("Cancel subscription: Razorpay", err?.error?.description || err.message);
      throw new CancelError("We couldn't cancel your subscription just now. Please try again, or contact us and we'll do it for you.", 502);
    }
  }

  const label = CANCEL_REASONS.find((r) => r.value === reason)?.label || null;
  const note = typeof comment === "string" ? comment.replace(/\s+/g, " ").trim().slice(0, 500) : "";
  const cancellationReason = [label, note].filter(Boolean).join(" - ") || null;

  // Only the first of two simultaneous requests records the cancellation and sends the emails
  const claimed = await prisma.user.updateMany({
    where: { id: user.id, subscriptionCancelledAt: null },
    data: { subscriptionCancelledAt: new Date(), cancellationReason },
  });
  if (claimed.count === 0) return { endsAt: user.subscriptionEndsAt, alreadyCancelled: true };

  // Not awaited: the customer shouldn't wait for email, and a mail problem doesn't undo the cancellation
  const endsOn = formatDate(user.subscriptionEndsAt);
  Promise.all([
    sendCancellationEmailToCustomer({ to: user.email, name: user.name, endsOn, supportEmail: SUPPORT_EMAIL }),
    sendCancellationEmailToAdmin({
      to: adminRecipients(),
      customer: { name: user.name, email: user.email, company: user.company },
      endsOn,
      reason: cancellationReason,
      subscriptionId: subscription.id,
    }),
  ]).catch((err) => console.error("Cancellation emails:", err.message));

  return { endsAt: user.subscriptionEndsAt, alreadyCancelled: false };
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
