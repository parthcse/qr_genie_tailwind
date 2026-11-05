// Deleting an account for good (pages/api/account/delete.js). Server only.
import crypto from "node:crypto";
import prisma from "@/lib/prisma";
import { deleteStoredFiles } from "@/lib/qr/fileStore";

// A one-way fingerprint of an address, so nothing about the person can be read back from it
const emailFingerprint = (email) =>
  crypto
    .createHmac("sha256", process.env.SCAN_IP_HASH_SECRET || "qr-genie-ip-salt")
    .update(String(email).trim().toLowerCase())
    .digest("hex");

/** Whether this address belonged to a deleted account: it can sign up again, but without another free trial */
export async function hadDeletedAccount(email) {
  const row = await prisma.deletedAccountEmail.findUnique({ where: { emailHash: emailFingerprint(email) }, select: { emailHash: true } });
  return !!row;
}

/** What deleting would remove or keep, for the warning: counts, not contents */
export async function accountDataSummary(userId) {
  const [qrCodes, scans, files, folders, invoices] = await Promise.all([
    prisma.qRCode.count({ where: { userId, status: { not: "DELETED" } } }),
    prisma.scanEvent.count({ where: { qrCode: { userId } } }),
    prisma.uploadedFile.aggregate({ where: { userId }, _count: true, _sum: { size: true } }),
    prisma.folder.count({ where: { userId } }),
    prisma.invoice.count({ where: { userId } }),
  ]);
  return { qrCodes, scans, files: files._count, fileBytes: files._sum.size || 0, folders, invoices };
}

/**
 * Permanently deletes an account and everything in it, in one transaction, so it either all goes or none of it does:
 * QR codes (including ones deleted earlier) with their scans, folders, contact messages, and the account with its
 * profile, billing details and uploaded files' records. Then the files themselves come off the disk.
 *
 * Kept: GST invoices, which tax law requires, no longer linked to any account (Invoice.user is SetNull); and a one-way
 * fingerprint of the email address, so deleting and signing up again doesn't give another free trial.
 */
export async function deleteAccountData({ id: userId, email }) {
  const files = await prisma.uploadedFile.findMany({ where: { userId }, select: { id: true } });

  await prisma.$transaction(
    async (tx) => {
      await tx.scanEvent.deleteMany({ where: { qrCode: { userId } } });
      await tx.qRCode.deleteMany({ where: { userId } });
      await tx.folder.deleteMany({ where: { userId } });
      await tx.contactMessage.deleteMany({ where: { OR: [{ userId }, { email: { equals: email, mode: "insensitive" } }] } });
      await tx.deletedAccountEmail.upsert({
        where: { emailHash: emailFingerprint(email) },
        create: { emailHash: emailFingerprint(email) },
        update: {},
      });
      await tx.user.delete({ where: { id: userId } }); // UploadedFile rows go with it
    },
    { timeout: 60_000 } // a long-used account can have many scans
  );

  await deleteStoredFiles(files.map((file) => file.id));
}
