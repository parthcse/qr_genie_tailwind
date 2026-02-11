-- Add account and billing fields to User table
-- Run this migration: npx prisma migrate dev --name add_account_billing_fields

-- Add General Information (Account) fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telephone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "zipCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "language" TEXT DEFAULT 'English';

-- Add Billing Information fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingCompany" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingAddress" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingCity" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingState" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingZipCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingCountry" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "taxId" TEXT;

-- Add updatedAt timestamp
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
