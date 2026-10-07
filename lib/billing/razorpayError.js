/**
 * Razorpay Node SDK rejects with { statusCode, error } where error is a string or { description, ... }.
 */
export function normalizeRazorpayApiError(err) {
  const statusCode = err?.statusCode;
  let message =
    typeof err?.error === "string"
      ? err.error
      : err?.error?.description || err?.message || "Razorpay request failed";
  if (!message || message === "undefined") {
    message = "Razorpay request failed (see server log for details).";
  }

  if (statusCode === 401) {
    message +=
      " — Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env: they must be the matching Live key pair from the same Razorpay account, with no extra spaces. Restart the dev server after changing .env.";
  }

  if (
    statusCode === 400 &&
    typeof message === "string" &&
    message.toLowerCase().includes("not found")
  ) {
    message +=
      " — Often this means RAZORPAY_BASIC_PLAN_ID is wrong or doesn't exist. Make sure you created a Plan (plan_…) in the Live mode Razorpay Dashboard and copied the correct Plan ID.";
  }

  return { statusCode: statusCode || 500, message };
}
