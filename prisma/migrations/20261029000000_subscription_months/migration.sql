-- Length of the paid plan (3, 6 or 12 months), set when a subscription is paid
ALTER TABLE "User" ADD COLUMN     "subscriptionMonths" INTEGER;
