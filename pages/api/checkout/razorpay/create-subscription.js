import prisma from "@/lib/prisma";
import { getUserFromRequest, VERIFY_EMAIL_FIRST } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";
import { getRazorpayClient, trimEnv } from "@/lib/billing/razorpayClient";
import { normalizeRazorpayApiError } from "@/lib/billing/razorpayError";
import { getUserSubscriptionStatus } from "@/lib/billing/subscription";
import { formatDate } from "@/lib/billing/subscriptionEmails";
import { getPlans, currencyForIp } from "@/lib/billing/plans";
import { getClientIp } from "@/lib/clientIp";
import { CURRENCY_NAMES } from "@/lib/billing/price";
import { termById } from "@/lib/billing/terms";

// Subscriptions renew for up to 5 years (Razorpay needs a number of billing cycles)
const YEARS_OF_RENEWALS = 5;
// Free days that end sooner than this aren't worth deferring the plan for
const MIN_FREE_TIME_MS = 60 * 60 * 1000;

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
};

/**
 * Creates a Razorpay subscription for the plan the customer chose ({ term: "3m" | "6m" | "12m" }), paid upfront for
 * that many months and renewed for the same length: in rupees when the user connects from India, in dollars from
 * anywhere else. The browser also sends the currency it showed ({ currency: "INR" | "USD" }); if that isn't the one
 * for this location, nothing is created, so nobody is charged a price they weren't shown.
 * Plans come from RAZORPAY_PLAN_ID_<INR|USD>_<3M|6M|12M> (lib/billing/plans.js).
 *
 * First-time customers still in their free days lose none of them: they pay the full price now (an upfront add-on
 * charged when they authorise the subscription), and the paid months start when the free days end. Razorpay's own
 * charges then begin at the end of those months (start_at), so the first one is the first renewal. The end of the free
 * days is kept in the subscription's notes (periodStart) for activation, invoices and cancelling.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (!user.emailVerified) {
    return res.status(403).json({ error: VERIFY_EMAIL_FIRST, verifyEmail: true });
  }
  // Every attempt creates a subscription at Razorpay
  if (isRateLimited(`checkout:${user.id}`, 60 * 60 * 1000, 10)) {
    return res.status(429).json({ error: "Too many checkout attempts. Please wait a while and try again, or contact us." });
  }

  // Razorpay renews automatically; a second subscription would bill the user twice. A cancelled plan still runs to the
  // end of its paid period, and a new subscription would charge for days already paid for, so it waits until then.
  if (getUserSubscriptionStatus(user).status === "SUBSCRIPTION_ACTIVE") {
    return res.status(400).json({
      error: user.subscriptionCancelledAt
        ? `Your plan is active until ${formatDate(user.subscriptionEndsAt)} and won't renew. You can choose a new plan from that date.`
        : "You already have an active plan. It renews automatically.",
    });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const term = typeof body.term === "string" ? termById(body.term) : null;
  if (!term) {
    return res.status(400).json({ error: "Please choose a plan: 3, 6 or 12 months." });
  }

  let plan;
  try {
    const plans = await getPlans();
    const currency = currencyForIp(plans, getClientIp(req));
    plan = currency ? plans[currency]?.[term.id] : null;
    if (!plan) {
      console.error(`No Razorpay plan loaded for ${currency || "any currency"} ${term.id}; check RAZORPAY_PLAN_ID_* settings`);
      return res.status(500).json({ error: "This plan isn't available right now. Please try again later." });
    }
    if (body.currency && body.currency !== currency) {
      return res.status(409).json({
        error: `Your price is in ${CURRENCY_NAMES[currency] || currency}. Please refresh the page to see it, then subscribe again.`,
        currency,
      });
    }
  } catch (err) {
    console.error("Razorpay plans:", err);
    const { statusCode, message } = normalizeRazorpayApiError(err);
    return res.status(statusCode === 401 ? 401 : 500).json({ error: message });
  }

  try {
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        telephone: true,
        razorpayCustomerId: true,
      },
    });
    if (!fullUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const rzp = getRazorpayClient();

    let customerId = fullUser.razorpayCustomerId;
    if (!customerId) {
      const customerPayload = {
        name: fullUser.name || fullUser.email.split("@")[0],
        email: fullUser.email,
      };
      if (fullUser.telephone && String(fullUser.telephone).replace(/\D/g, "").length >= 10) {
        customerPayload.contact = String(fullUser.telephone).replace(/\s/g, "");
      }
      const customer = await rzp.customers.create(customerPayload);
      customerId = customer.id;
      await prisma.user.update({
        where: { id: fullUser.id },
        data: { razorpayCustomerId: customerId },
      });
    }

    // Still in the free days of a first trial: pay now, paid months from the end of the free days
    const freeDaysEnd =
      user.subscriptionPlan === "TRIAL" && !user.subscriptionStartedAt && user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    const planStartsAt = freeDaysEnd && freeDaysEnd.getTime() - Date.now() > MIN_FREE_TIME_MS ? freeDaysEnd : null;

    const subscription = await rzp.subscriptions.create({
      plan_id: plan.planId,
      customer_id: customerId,
      customer_notify: 1,
      quantity: 1,
      total_count: Math.round((YEARS_OF_RENEWALS * 12) / term.months),
      ...(planStartsAt
        ? {
            start_at: Math.floor(addMonths(planStartsAt, term.months).getTime() / 1000),
            addons: [{ item: { name: `QR-Genie ${term.planName}`, amount: plan.amount, currency: plan.currency } }],
          }
        : {}),
      notes: {
        userId: fullUser.id,
        app: "qr_genie",
        term: term.id,
        ...(planStartsAt ? { periodStart: String(Math.floor(planStartsAt.getTime() / 1000)) } : {}),
      },
    });

    return res.status(200).json({
      keyId: trimEnv("RAZORPAY_KEY_ID"),
      subscriptionId: subscription.id,
      startsAt: planStartsAt,
      name: "QR Genie",
      description: term.planName,
      prefill: {
        email: fullUser.email,
        name: fullUser.name || undefined,
      },
    });
  } catch (err) {
    console.error("Razorpay create-subscription:", err);
    const { statusCode, message } = normalizeRazorpayApiError(err);
    return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
      error: message,
    });
  }
}
