-- What the plan emails (lib/subscriptionEmails.js) were last sent for: a subscription ID for "plan active" /
-- "new subscriber", a payment ID for renewals. Checkout and the Razorpay webhooks report the same events, so each is emailed once.
ALTER TABLE "User" ADD COLUMN "lastPlanEmailKey" TEXT;
