-- AlterTable User: add Razorpay linkage fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "razorpayCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "razorpaySubscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "razorpayLastPaymentId" TEXT;

