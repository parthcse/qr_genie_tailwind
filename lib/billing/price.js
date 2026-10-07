// Price formatting shared by server and browser. Amounts are in the smallest unit (paise / cents), as Razorpay returns them.

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

/** "per month", "every 3 months", "per year" … from a Razorpay plan's period and interval */
export function formatPeriod(period, interval = 1) {
  const unit = { daily: "day", weekly: "week", monthly: "month", yearly: "year" }[period] || "month";
  return interval > 1 ? `every ${interval} ${unit}s` : `per ${unit}`;
}

/** "₹399 per month" */
export function formatPlanPrice(plan) {
  if (!plan) return "";
  return `${formatPrice(plan.amount, plan.currency)} ${formatPeriod(plan.period, plan.interval)}`;
}
