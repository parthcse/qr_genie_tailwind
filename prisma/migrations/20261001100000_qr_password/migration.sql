-- Optional password for a QR code (bcrypt hash); scanners must enter it before being redirected
ALTER TABLE "QRCode" ADD COLUMN "passwordHash" TEXT;
