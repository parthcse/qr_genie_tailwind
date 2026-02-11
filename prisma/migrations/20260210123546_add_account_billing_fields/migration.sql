-- AlterTable
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

-- Add updatedAt timestamp if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'updatedAt') THEN
        ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Set updatedAt to auto-update on row modification (PostgreSQL trigger)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
