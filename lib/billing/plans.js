import { getRazorpayClient, trimEnv } from "./razorpayClient";
import { PLAN_TERMS } from "./terms";
import { getGeoFromIp } from "@/lib/geoIp";

/**
 * The paid plans, read from Razorpay so prices on the site always match what is charged. One Razorpay plan per term
 * and currency, billed upfront for the whole term: RAZORPAY_PLAN_ID_INR_3M, _INR_6M, _INR_12M and the same for USD.
 * A plan is offered only when its ID is set and its billing period in Razorpay matches the term (3 months = monthly
 * every 3; 12 months = yearly, or monthly every 12), so a mistyped ID never charges for the wrong length.
 */

const CACHE_MS = 10 * 60 * 1000;
const CURRENCIES = ["INR", "USD"];
let cache = { at: 0, plans: null };
const subscriptionPlanIds = new Map();

const envName = (currency, term) => `RAZORPAY_PLAN_ID_${currency}_${term.id.toUpperCase()}`;
const monthsOf = (period, interval) => ({ monthly: 1, yearly: 12 }[period] || 0) * (interval || 1);

/**
 * { INR?: { "3m"?, "6m"?, "12m"? }, USD?: { … } }, each plan = { planId, currency, amount, period, interval, term, months }.
 * amount is what's charged for the whole term, GST included.
 */
export async function getPlans() {
  if (cache.plans && Date.now() - cache.at < CACHE_MS) return cache.plans;

  const rzp = getRazorpayClient();
  const plans = {};
  for (const currency of CURRENCIES) {
    for (const term of PLAN_TERMS) {
      const planId = trimEnv(envName(currency, term));
      if (!planId) continue;
      try {
        const p = await rzp.plans.fetch(planId);
        if (p.item?.currency !== currency || monthsOf(p.period, p.interval) !== term.months) {
          console.error(`${envName(currency, term)} (${planId}) is ${p.item?.currency} every ${p.interval} ${p.period}; expected ${currency} for ${term.months} months. Not offered.`);
          continue;
        }
        plans[currency] = plans[currency] || {};
        plans[currency][term.id] = { planId: p.id, currency, amount: p.item.amount, period: p.period, interval: p.interval, term: term.id, months: term.months };
      } catch (err) {
        console.error(`Razorpay plan ${planId} could not be loaded:`, err?.error?.description || err.message);
      }
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
    Object.entries(plans).map(([currency, byTerm]) => [
      currency,
      Object.fromEntries(Object.entries(byTerm).map(([term, { planId, ...plan }]) => [term, plan])),
    ])
  );
}

/** The plan with this Razorpay plan ID, in any currency, or null */
export function planForId(plans, planId) {
  if (!planId) return null;
  for (const byTerm of Object.values(plans)) {
    for (const plan of Object.values(byTerm)) if (plan.planId === planId) return plan;
  }
  return null;
}

/**
 * The currency a visitor pays in: rupees when they connect from India, dollars from anywhere else (by IP, so someone
 * on a foreign VPN sees dollars). It isn't a choice: prices are shown and checkout charges in this currency only.
 * When only one currency is set up, that one is used everywhere.
 */
export function currencyForIp(plans, ip) {
  const available = Object.keys(plans);
  if (available.length <= 1) return available[0] || null;
  const inIndia = !!ip && getGeoFromIp(ip).country === "IN";
  return inIndia && plans.INR ? "INR" : plans.USD ? "USD" : available[0];
}

/** The plan of a user's current Razorpay subscription ({ currency, term, months, … }), or null */
export async function getSubscriptionPlan(subscriptionId, plans) {
  if (!subscriptionId) return null;
  try {
    if (!subscriptionPlanIds.has(subscriptionId)) {
      const sub = await getRazorpayClient().subscriptions.fetch(subscriptionId);
      subscriptionPlanIds.set(subscriptionId, sub.plan_id);
    }
    return planForId(plans, subscriptionPlanIds.get(subscriptionId));
  } catch (err) {
    console.error("Could not load subscription plan:", err?.error?.description || err.message);
    return null;
  }
}
