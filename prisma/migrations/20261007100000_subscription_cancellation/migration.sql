-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "subscriptionCancelledAt" TIMESTAMP(3);

