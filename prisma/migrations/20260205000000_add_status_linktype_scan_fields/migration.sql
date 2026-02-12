-- CreateEnum
CREATE TYPE "QrStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DELETED');
CREATE TYPE "LinkType" AS ENUM ('STATIC', 'DYNAMIC');

-- AlterTable QRCode: add status, linkType, pausedMessage, updatedAt
ALTER TABLE "QRCode" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "QRCode" ADD COLUMN IF NOT EXISTS "status" "QrStatus" NOT NULL DEFAULT 'ACTIVE'::"QrStatus";
ALTER TABLE "QRCode" ADD COLUMN IF NOT EXISTS "linkType" "LinkType" NOT NULL DEFAULT 'DYNAMIC'::"LinkType";
ALTER TABLE "QRCode" ADD COLUMN IF NOT EXISTS "pausedMessage" TEXT;

-- Backfill status from isActive: PAUSED where isActive = false, else ACTIVE
UPDATE "QRCode" SET "status" = 'PAUSED' WHERE "isActive" = false;
UPDATE "QRCode" SET "status" = 'ACTIVE' WHERE "isActive" = true;

-- AlterTable ScanEvent: add ipHash, deviceType, browser, referer, blockedByStatus
ALTER TABLE "ScanEvent" ADD COLUMN IF NOT EXISTS "ipHash" TEXT;
ALTER TABLE "ScanEvent" ADD COLUMN IF NOT EXISTS "deviceType" TEXT;
ALTER TABLE "ScanEvent" ADD COLUMN IF NOT EXISTS "browser" TEXT;
ALTER TABLE "ScanEvent" ADD COLUMN IF NOT EXISTS "referer" TEXT;
ALTER TABLE "ScanEvent" ADD COLUMN IF NOT EXISTS "blockedByStatus" BOOLEAN NOT NULL DEFAULT false;

-- Trigger for QRCode.updatedAt (reuse existing function if present)
CREATE OR REPLACE FUNCTION update_qrcode_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_qrcode_updated_at ON "QRCode";
CREATE TRIGGER update_qrcode_updated_at
    BEFORE UPDATE ON "QRCode"
    FOR EACH ROW
    EXECUTE PROCEDURE update_qrcode_updated_at();
