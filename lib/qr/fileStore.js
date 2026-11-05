// Uploaded files for hosted pages (Images, MP3, PDF). Server only. The bytes are kept on the server's disk in one
// folder (UPLOADS_DIR, outside anything served directly), each file named by its random id, and a row in UploadedFile
// says whose it is and what it is. Moving to other storage later means changing this file and pages/api/files/.
import fs from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import prisma from "@/lib/prisma";
import { MAX_PAID_STORAGE_BYTES, MAX_TRIAL_STORAGE_BYTES } from "./fileRules";
import { GALLERY_TOO_BIG, contentFiles, galleryTooBig } from "./qrContent";

export const storageLimitFor = (onTrial) => (onTrial ? MAX_TRIAL_STORAGE_BYTES : MAX_PAID_STORAGE_BYTES);

// A file nothing uses yet may be waiting for its form to be saved; it's kept this long
const UNUSED_FILE_GRACE_MS = 24 * 60 * 60 * 1000;

const uploadsDir = () => path.resolve(/*turbopackIgnore: true*/ process.env.UPLOADS_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads"));

/** Where a stored file is; id is the database row's id, never what a visitor typed */
export const storedFilePath = (id) => path.join(/*turbopackIgnore: true*/ uploadsDir(), id);

function looksLikeMp3(bytes) {
  if (bytes.length < 4) return false;
  if (bytes.subarray(0, 3).toString("latin1") === "ID3") return true;
  // A bare MPEG audio frame: the sync bits, then a valid version, layer, bitrate and sample rate
  if (bytes[0] !== 0xff || (bytes[1] & 0xe0) !== 0xe0) return false;
  const version = (bytes[1] >> 3) & 3;
  const layer = (bytes[1] >> 1) & 3;
  const bitrate = (bytes[2] >> 4) & 15;
  const sampleRate = (bytes[2] >> 2) & 3;
  return version !== 1 && layer !== 0 && bitrate !== 0 && bitrate !== 15 && sampleRate !== 3;
}

/** What a file really is, from its first bytes: { kind, mime }, or null. The browser's word for it isn't trusted. */
export function sniffFile(bytes) {
  const head = bytes.subarray(0, 12);
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return { kind: "image", mime: "image/jpeg" };
  if (head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { kind: "image", mime: "image/png" };
  if (head.subarray(0, 4).toString("latin1") === "RIFF" && head.subarray(8, 12).toString("latin1") === "WEBP") return { kind: "image", mime: "image/webp" };
  if (head.subarray(0, 5).toString("latin1") === "%PDF-") return { kind: "pdf", mime: "application/pdf" };
  if (looksLikeMp3(bytes)) return { kind: "audio", mime: "audio/mpeg" };
  return null;
}

/** Bytes this account's files take up */
export async function storageUsed(userId) {
  const { _sum } = await prisma.uploadedFile.aggregate({ where: { userId }, _sum: { size: true } });
  return _sum.size || 0;
}

/** Writes the file (under a temporary name first, so a half-written file is never served) and records it */
export async function saveUpload({ userId, kind, mime, name, bytes }) {
  const id = nanoid(24);
  await fs.mkdir(uploadsDir(), { recursive: true });
  const target = storedFilePath(id);
  const temporary = `${target}.tmp`;
  await fs.writeFile(temporary, bytes, { flag: "wx" });
  await fs.rename(temporary, target);
  try {
    return await prisma.uploadedFile.create({ data: { id, userId, kind, mime, name, size: bytes.length } });
  } catch (error) {
    await fs.unlink(target).catch(() => {});
    throw error;
  }
}

/**
 * Checks that every file a page's content points to belongs to this account and is the right kind, then puts the
 * stored name and size into the content, so they can't be made up. Returns { content } or { error }.
 */
export async function checkContentFiles(userId, type, content) {
  const refs = contentFiles(type, content);
  if (refs.length === 0) return { content };
  const rows = await prisma.uploadedFile.findMany({ where: { id: { in: refs.map((ref) => ref.id) }, userId } });
  const byId = new Map(rows.map((row) => [row.id, row]));
  for (const ref of refs) {
    const row = byId.get(ref.id);
    if (!row || row.kind !== ref.kind) return { error: "One of your files is no longer available. Please upload it again." };
    ref.file.name = row.name;
    ref.file.size = row.size;
  }
  // Now with the stored sizes, not the ones the form sent
  if (type === "images" && galleryTooBig(content.images)) return { error: GALLERY_TOO_BIG };
  return { content };
}

/** The ids of the uploaded files a saved QR code uses */
export function fileIdsOfCode(code) {
  try {
    return contentFiles(code.type, JSON.parse(code.meta || "{}").content).map((ref) => ref.id);
  } catch {
    return [];
  }
}

/** Removes files from the disk (their database rows are gone already). A file that can't be removed is logged. */
export async function deleteStoredFiles(ids) {
  await Promise.all(
    ids.map((id) =>
      fs.unlink(storedFilePath(id)).catch((error) => {
        if (error.code !== "ENOENT") console.error(`Stored file ${id} couldn't be removed:`, error.message);
      })
    )
  );
}

/**
 * Deletes this account's files that no QR code uses any more, row and bytes, so the space is freed. released: the files
 * a code just gave up (it was deleted, or they were taken off its page): they go straight away unless another code,
 * such as a copy, still uses them. Other files newer than a day are left alone: they may be waiting for a form that's
 * still open to be saved. Never throws: it's only tidying up.
 */
export async function removeUnusedFiles(userId, released = []) {
  try {
    const files = await prisma.uploadedFile.findMany({
      where: { userId, OR: [{ createdAt: { lt: new Date(Date.now() - UNUSED_FILE_GRACE_MS) } }, { id: { in: released } }] },
      select: { id: true },
    });
    if (files.length === 0) return;

    const codes = await prisma.qRCode.findMany({
      where: { userId, status: { not: "DELETED" }, meta: { not: null } },
      select: { type: true, meta: true },
    });
    const inUse = new Set();
    for (const code of codes) {
      try {
        contentFiles(code.type, JSON.parse(code.meta).content).forEach((ref) => inUse.add(ref.id));
      } catch {
        // a code whose saved data can't be read uses no files we can see; older files stay until it's readable
        return;
      }
    }

    const unused = files.map((file) => file.id).filter((id) => !inUse.has(id));
    await prisma.uploadedFile.deleteMany({ where: { id: { in: unused } } });
    await deleteStoredFiles(unused);
  } catch (error) {
    console.error("Unused file cleanup failed:", error);
  }
}
