// The paid plans: the same features, paid upfront for 3, 6 or 12 months and renewed automatically for the same length.
// Prices come from the Razorpay plans (lib/billing/plans.js), one per term and currency. Safe to import anywhere.

export const PLAN_TERMS = [
  { id: "3m", months: 3, name: "3 months", planName: "3-month plan", every: "every 3 months" },
  { id: "6m", months: 6, name: "6 months", planName: "6-month plan", every: "every 6 months" },
  { id: "12m", months: 12, name: "12 months", planName: "12-month plan", every: "every year" },
];

// Shown as the featured "Best value" card
export const BEST_VALUE_TERM = "12m";

// The term the others are compared with for "Save 50%"
export const BASE_TERM = "3m";

export const termById = (id) => PLAN_TERMS.find((term) => term.id === id) || null;
export const termByMonths = (months) => PLAN_TERMS.find((term) => term.months === months) || null;

/** "12-month plan", or a general name when the length isn't known (e.g. before the first payment is recorded) */
export const planNameFor = (months) => termByMonths(months)?.planName || "Paid plan";
