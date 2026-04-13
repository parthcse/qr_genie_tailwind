import crypto from "crypto";

/**
 * Verifies Razorpay subscription payment signature (Checkout success handler).
 * @see https://razorpay.com/docs/payments/subscriptions/
 */
export function verifySubscriptionPaymentSignature({
  razorpay_payment_id,
  razorpay_subscription_id,
  razorpay_signature,
  secret,
}) {
  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature || !secret) {
    return false;
  }
  const body = `${razorpay_payment_id}|${razorpay_subscription_id}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(razorpay_signature, "hex"));
  } catch {
    return false;
  }
}

/**
 * Verifies Razorpay webhook body signature (raw JSON string).
 */
export function verifyWebhookSignature(rawBody, signatureHeader, webhookSecret) {
  if (!rawBody || !signatureHeader || !webhookSecret) return false;
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signatureHeader, "hex"));
  } catch {
    return false;
  }
}
