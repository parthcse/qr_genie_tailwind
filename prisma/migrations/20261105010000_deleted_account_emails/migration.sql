-- CreateTable
CREATE TABLE "DeletedAccountEmail" (
    "emailHash" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletedAccountEmail_pkey" PRIMARY KEY ("emailHash")
);
