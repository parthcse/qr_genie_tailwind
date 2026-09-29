import { getRazorpayClient, trimEnv } from "./razorpayClient";
import { getGeoFromIp } from "./geoIp";

/**
 * Basic Package plans, one per currency, read from Razorpay so prices on the site always match what is charged.
 * Configure RAZORPAY_PLAN_ID_INR and/or RAZORPAY_PLAN_ID_USD; a currency is offered only when its plan is set.
 * RAZORPAY_BASIC_PLAN_ID is still read for older setups; its currency comes from the plan itself.
 */

const CACHE_MS = 10 * 60 * 1000;
let cache = { at: 0, plans: null };
const subscriptionCurrency = new Map();

function configuredPlanIds() {
  const ids = ["RAZORPAY_PLAN_ID_INR", "RAZORPAY_PLAN_ID_USD", "RAZORPAY_BASIC_PLAN_ID"].map(trimEnv).filter(Boolean);
  return [...new Set(ids)];
}

/** { INR?: plan, USD?: plan } where plan = { planId, currency, amount, period, interval } */
export async function getBasicPlans() {
  if (cache.plans && Date.now() - cache.at < CACHE_MS) return cache.plans;

  const rzp = getRazorpayClient();
  const plans = {};
  for (const planId of configuredPlanIds()) {
    try {
      const p = await rzp.plans.fetch(planId);
      const currency = p.item?.currency;
      if (currency && !plans[currency]) {
        plans[currency] = { planId: p.id, currency, amount: p.item.amount, period: p.period, interval: p.interval };
      }
    } catch (err) {
      console.error(`Razorpay plan ${planId} could not be loaded:`, err?.error?.description || err.message);
    }
  }

  if (Object.keys(plans).length > 0) {
    cache = { at: Date.now(), plans };
    return plans;
  }
  return cache.plans || {}; // keep serving the last good prices if Razorpay is briefly unreachable
}

/** Plans without Razorpay IDs, safe to send to the browser */
export function publicPlans(plans) {
  return Object.fromEntries(
    Object.entries(plans).map(([currency, p]) => [currency, { currency, amount: p.amount, period: p.period, interval: p.interval }])
  );
}

/** Rupees for visitors in India (by IP, or by the country on their account), dollars for everyone else */
export function pickDefaultCurrency(plans, { ip, user } = {}) {
  const available = Object.keys(plans);
  if (available.length <= 1) return available[0] || null;
  const country = ip ? getGeoFromIp(ip).country : null;
  const accountCountry = `${user?.country || ""} ${user?.billingCountry || ""}`.toLowerCase();
  const inIndia = country === "IN" || accountCountry.includes("india");
  return inIndia && plans.INR ? "INR" : plans.USD ? "USD" : available[0];
}

/** Currency of a user's current Razorpay subscription, or null */
export async function getSubscriptionCurrency(subscriptionId, plans) {
  if (!subscriptionId) return null;
  if (subscriptionCurrency.has(subscriptionId)) return subscriptionCurrency.get(subscriptionId);
  try {
    const sub = await getRazorpayClient().subscriptions.fetch(subscriptionId);
    const match = Object.values(plans).find((p) => p.planId === sub.plan_id);
    const currency = match?.currency || null;
    subscriptionCurrency.set(subscriptionId, currency);
    return currency;
  } catch (err) {
    console.error("Could not load subscription currency:", err?.error?.description || err.message);
    return null;
  }
}
