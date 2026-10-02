-- Email verification with a 6-digit code (lib/emailVerification.js): after sign-up and when changing the email
-- (pendingEmail), plus a record of accepting the terms
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "emailCodeHash" TEXT;
ALTER TABLE "User" ADD COLUMN "emailCodeExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "emailCodeAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "emailCodeSentAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "pendingEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);

-- Accounts created before verification existed count as verified, so nobody already signed up is locked out
UPDATE "User" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;
