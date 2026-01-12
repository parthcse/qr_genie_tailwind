-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QRCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "name" TEXT,
    "qrColor" TEXT NOT NULL DEFAULT '#000000',
    "bgColor" TEXT NOT NULL DEFAULT '#ffffff',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "folderId" TEXT,
    CONSTRAINT "QRCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QRCode_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_QRCode" ("createdAt", "folderId", "id", "scanCount", "slug", "targetUrl", "userId") SELECT "createdAt", "folderId", "id", "scanCount", "slug", "targetUrl", "userId" FROM "QRCode";
DROP TABLE "QRCode";
ALTER TABLE "new_QRCode" RENAME TO "QRCode";
CREATE UNIQUE INDEX "QRCode_slug_key" ON "QRCode"("slug");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
