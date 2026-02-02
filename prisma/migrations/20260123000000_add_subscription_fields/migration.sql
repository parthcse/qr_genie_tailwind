-- AlterTable User: add subscription fields (trial + paid)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT NOT NULL DEFAULT 'EXPIRED';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialStartedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStartedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMP(3);

-- AlterTable QRCode: add activation fields
ALTER TABLE "QRCode" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "QRCode" ADD COLUMN IF NOT EXISTS "deactivatedReason" TEXT;
