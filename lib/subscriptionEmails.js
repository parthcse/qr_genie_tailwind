import prisma from "./prisma";
import { getRazorpayClient, trimEnv } from "./razorpayClient";
import { getBasicPlans } from "./plans";
import { formatPrice, formatPeriod } from "./price";
import { sendPlanEmailToCustomer, sendPlanEmailToAdmin } from "./email";
import { SUPPORT_EMAIL, BASIC_PLAN_FEATURES } from "./site";

const METHOD_LABELS = {
  card: "Card",
  upi: "UPI",
  netbanking: "Net banking",
  wallet: "Wallet",
  emandate: "Bank mandate",
  nach: "NACH mandate",
};

// Dates in India time, where the business runs: "1 October 2026"
const formatDate = (date) =>
  date ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(date) : null;

/** "UPI", "Card", "Net banking (HDFC)": how a Razorpay payment was made */
export function describeMethod(payment) {
  if (!payment?.method) return null;
  const label = METHOD_LABELS[payment.method] || payment.method;
  if (payment.method === "netbanking" && payment.bank) return `${label} (${payment.bank})`;
  if (payment.method === "wallet" && payment.wallet) return `${label} (${payment.wallet})`;
  return label;
}

/** Where new-subscriber and renewal notices go: ADMIN_NOTIFY_EMAIL (comma-separated allowed), else the support inbox */
function adminRecipients() {
  return trimEnv("ADMIN_NOTIFY_EMAIL") || SUPPORT_EMAIL;
}

/**
 * Emails about the Basic Package: to the customer ("your plan is active", or a renewal receipt) and to the admin
 * ("new subscriber", or a renewal notice). Checkout verify and the Razorpay webhooks (activated, charged) report the
 * same events in any order, so each is claimed once in the database (User.lastPlanEmailKey) before anything is sent:
 * - a new subscription by its subscription ID, on whichever call switches the plan on first. That call still knows
 *   the plan before and how many paused codes came back; if it has no payment (subscription.activated), the
 *   payment is looked up from Razorpay
 * - a renewal by its payment ID
 * Never throws: the plan is already active by now, so a mail problem is only logged.
 *
 * @param {object} opts
 * @param {string} opts.userId
 * @param {object} opts.subscription - Razorpay subscription entity
 * @param {string} [opts.paymentId]
 * @param {object} [opts.payment] - Razorpay payment entity, when the caller already has it (webhooks)
 * @param {object} opts.activation - the result of activateBasicSubscriptionForUser
 * @param {"checkout"|"webhook"} opts.source
 */
export async function sendPlanEmails(opts) {
  try {
    await sendPlanEmailsOnce(opts);
  } catch (err) {
    console.error("Plan emails:", err.message);
  }
}

async function sendPlanEmailsOnce({ userId, subscription, paymentId, payment, activation, source }) {
  const kind = activation?.isRenewal ? "renewal" : "new";
  const key = kind === "renewal" ? paymentId : subscription?.id;
  if (!key) return;

  // Atomic claim: of several requests for the same subscription or payment, only the first one gets count 1
  const claimed = await prisma.user.updateMany({
    where: { id: userId, OR: [{ lastPlanEmailKey: null }, { lastPlanEmailKey: { not: key } }] },
    data: { lastPlanEmailKey: key },
  });
  if (claimed.count === 0) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, company: true, telephone: true, country: true, billingCountry: true, createdAt: true },
  });
  if (!user) return;

  let paid = payment;
  let paidId = paymentId || payment?.id || null;
  try {
    // subscription.activated carries no payment: find the one that paid the subscription's first invoice
    if (!paidId && subscription?.id) {
      const invoices = await getRazorpayClient().invoices.all({ subscription_id: subscription.id });
      paidId = invoices?.items?.find((inv) => inv.payment_id)?.payment_id || null;
    }
    if (!paid && paidId) paid = await getRazorpayClient().payments.fetch(paidId);
  } catch (err) {
    console.error("Plan emails: payment lookup", err?.error?.description || err.message);
  }

  const plans = await getBasicPlans().catch(() => ({}));
  const plan = Object.values(plans).find((p) => p.planId === subscription?.plan_id) || null;

  const details = {
    planName: "Basic Package",
    price: plan ? `${formatPrice(plan.amount, plan.currency)} ${formatPeriod(plan.period, plan.interval)}` : null,
    amountPaid: paid?.amount != null && paid?.currency ? formatPrice(paid.amount, paid.currency) : null,
    method: describeMethod(paid),
    paidOn: formatDate(paid?.created_at ? new Date(paid.created_at * 1000) : new Date()),
    renewsOn: formatDate(activation?.expiresAt),
    paymentId: paidId,
    subscriptionId: subscription?.id || null,
    customerId: subscription?.customer_id || null,
    reactivatedCount: activation?.reactivatedCount || 0,
    features: BASIC_PLAN_FEATURES,
  };
  const activeSubscribers = await prisma.user
    .count({ where: { subscriptionPlan: "BASIC", subscriptionEndsAt: { gt: new Date() } } })
    .catch(() => undefined);

  await Promise.all([
    sendPlanEmailToCustomer({ to: user.email, name: user.name, kind, details, supportEmail: SUPPORT_EMAIL }),
    sendPlanEmailToAdmin({
      to: adminRecipients(),
      kind,
      source,
      activeSubscribers,
      details,
      customer: {
        name: user.name,
        email: user.email,
        company: user.company,
        telephone: user.telephone,
        country: user.country || user.billingCountry,
        signedUpOn: formatDate(user.createdAt),
        previousPlan: { TRIAL: "Free trial", EXPIRED: "None (trial or plan had ended)", BASIC: "Basic Package (ended)" }[activation?.previousPlan] || activation?.previousPlan,
      },
    }),
  ]);
}
