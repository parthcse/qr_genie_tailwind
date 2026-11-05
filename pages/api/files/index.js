import { getUserFromRequest, VERIFY_EMAIL_FIRST } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";
import { canCreateQR, getUserSubscriptionStatus } from "@/lib/billing/subscription";
import { FILE_KINDS, MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, cleanFileName, fileUrl, formatFileSize } from "@/lib/qr/fileRules";
import { removeUnusedFiles, saveUpload, sniffFile, storageLimitFor, storageUsed } from "@/lib/qr/fileStore";

// The file is the request's body (application/octet-stream), read here with a size limit. Not a form upload: proxy.js
// refuses those, because a form on another website could send one.
export const config = { api: { bodyParser: false } };

async function readBody(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * POST /api/files?kind=image|audio|pdf&name=<file name>: stores one file for a hosted page and answers
 * { file: { id, name, size }, url }. The file's real type is read from its bytes and must match the kind.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!user.emailVerified) {
      return res.status(403).json({ error: VERIFY_EMAIL_FIRST, verifyEmail: true });
    }
    if (!canCreateQR(user)) {
      return res.status(403).json({ error: "Your plan has ended. Choose a plan again to upload files." });
    }
    if (isRateLimited(`upload:${user.id}`, 60 * 60 * 1000, 120)) {
      return res.status(429).json({ error: "You're uploading files very quickly. Please wait a few minutes and try again." });
    }

    const kind = String(req.query.kind || "");
    if (!Object.hasOwn(FILE_KINDS, kind)) {
      return res.status(400).json({ error: "This kind of file can't be uploaded." });
    }
    const tooLarge = `The file must be ${MAX_UPLOAD_LABEL} or smaller.`;
    if (Number(req.headers["content-length"]) > MAX_UPLOAD_BYTES) {
      return res.status(413).json({ error: tooLarge });
    }

    const bytes = await readBody(req, MAX_UPLOAD_BYTES);
    if (bytes === null) {
      return res.status(413).json({ error: tooLarge });
    }
    if (bytes.length === 0) {
      return res.status(400).json({ error: "That file is empty." });
    }

    const found = sniffFile(bytes);
    if (!found || found.kind !== kind) {
      return res.status(400).json({ error: `That doesn't look like ${FILE_KINDS[kind].noun}. Please use ${FILE_KINDS[kind].label}.` });
    }

    const limit = storageLimitFor(getUserSubscriptionStatus(user).status === "TRIAL_ACTIVE");
    if ((await storageUsed(user.id)) + bytes.length > limit) {
      return res.status(403).json({
        error: `Your account's ${formatFileSize(limit)} of file space is full. Remove files you no longer need from your QR codes.`,
      });
    }

    const row = await saveUpload({ userId: user.id, kind, mime: found.mime, name: cleanFileName(req.query.name), bytes });
    removeUnusedFiles(user.id); // in the background: forms left unsaved shouldn't use up the space for good
    return res.status(201).json({ file: { id: row.id, name: row.name, size: row.size }, url: fileUrl(row.id) });
  } catch (error) {
    console.error("File upload failed:", error);
    return res.status(500).json({ error: "The file couldn't be saved. Please try again." });
  }
}
