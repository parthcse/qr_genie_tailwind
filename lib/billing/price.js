// Price formatting shared by server and browser. Amounts are in the smallest unit (paise / cents), as Razorpay returns them.
// A plan here is { currency, amount, months, term }: amount is what's charged for the whole term (lib/billing/plans.js).
import { termById, BASE_TERM } from "./terms";

export const CURRENCY_NAMES = { INR: "Indian rupees", USD: "US dollars" };

export function formatPrice(amountMinor, currency) {
  const value = amountMinor / 100;
  const whole = amountMinor % 100 === 0;
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** What the plan costs per month, in the smallest unit (₹24,000 a year → 200000 paise) */
export const monthlyAmount = (plan) => Math.round(plan.amount / plan.months);

/** "₹2,000/month" */
export function formatMonthly(plan) {
  if (!plan) return "";
  return `${formatPrice(monthlyAmount(plan), plan.currency)}/month`;
}

/** "₹24,000 every year": what's charged and how often */
export function formatBilled(plan) {
  if (!plan) return "";
  return `${formatPrice(plan.amount, plan.currency)} ${termById(plan.term)?.every || `every ${plan.months} months`}`;
}

/**
 * How much a plan saves against the 3-month price: { percent: 50, perYear: "₹24,000" }, or null for the 3-month plan
 * itself. plans: the visitor's plans by term ({ "3m", "6m", "12m" }).
 */
export function savingsFor(plan, plans) {
  const base = plans?.[BASE_TERM];
  if (!plan || !base || plan.term === BASE_TERM) return null;
  const perMonth = monthlyAmount(base) - monthlyAmount(plan);
  if (perMonth <= 0) return null;
  return {
    percent: Math.round((perMonth / monthlyAmount(base)) * 100),
    perYear: formatPrice(perMonth * 12, plan.currency),
  };
}

/** The cheapest plan per month in a set of plans by term (the 12-month plan), or null */
export function cheapestPlan(plans) {
  const list = Object.values(plans || {});
  return list.length ? list.reduce((a, b) => (monthlyAmount(b) < monthlyAmount(a) ? b : a)) : null;
}
