import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import prisma from "@/lib/prisma";
import { getClientIp } from "@/lib/clientIp";
import { isRateLimited } from "@/lib/rateLimit";
import { getQrPauseReason, PLAN_STATUS_FIELDS } from "@/lib/billing/subscription";
import { FILE_ID } from "@/lib/qr/fileRules";
import { storedFilePath } from "@/lib/qr/fileStore";

export const config = { api: { responseLimit: false } };

// "bytes=0-1023" as { start, end } within the file; null when it can't be served, undefined when there's no range
function parseRange(header, size) {
  if (!header) return undefined;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  return start <= end && start < size ? { start, end } : null;
}

/**
 * GET /api/files/<id>: a file uploaded for a hosted page, for anyone with the address (it's random, and the page it
 * belongs to is public). Stops when the owner's plan has ended. ?download=1 saves it instead of opening it. Supports
 * ranges, which audio players need for seeking. Isn't counted as a scan.
 *
 * Uploads come from customers, so nothing here may run as part of our site: the type comes from the file's own bytes
 * (lib/qr/fileStore.js), browsers may not guess another one, and images and audio get a policy that allows nothing.
 * PDFs go without a policy, because browsers' PDF viewers don't load under one; a PDF has no access to the site anyway.
 */
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const id = String(req.query.id || "");
  if (!FILE_ID.test(id)) {
    return res.status(404).json({ error: "File not found" });
  }
  if (isRateLimited(`file:${getClientIp(req)}`, 60 * 1000, 600)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  try {
    const file = await prisma.uploadedFile.findUnique({ where: { id }, include: { user: { select: PLAN_STATUS_FIELDS } } });
    if (!file || getQrPauseReason(file.user)) {
      return res.status(404).json({ error: "File not found" });
    }

    const path = storedFilePath(file.id);
    const { size } = await stat(path);
    const range = parseRange(req.headers.range, size);

    const disposition = req.query.download ? "attachment" : "inline";
    const asciiName = file.name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
    res.setHeader("Content-Type", file.mime);
    res.setHeader("Content-Disposition", `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Robots-Tag", "noindex");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("Accept-Ranges", "bytes");
    // Short, so a file stops being available soon after its owner's plan ends
    res.setHeader("Cache-Control", "public, max-age=3600");
    if (file.kind === "pdf") res.removeHeader("Content-Security-Policy");
    else res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");

    if (range === null) {
      res.setHeader("Content-Range", `bytes */${size}`);
      return res.status(416).end();
    }
    const { start, end } = range || { start: 0, end: size - 1 };
    if (range) res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
    res.setHeader("Content-Length", end - start + 1);
    res.status(range ? 206 : 200);

    if (req.method === "HEAD") return res.end();
    await new Promise((resolve) => {
      const stream = createReadStream(path, { start, end });
      stream.on("error", (error) => {
        console.error("File read failed:", error);
        res.destroy();
        resolve();
      });
      res.on("close", () => {
        stream.destroy();
        resolve();
      });
      stream.pipe(res);
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error(`Stored file ${id} is missing from the disk`);
      return res.status(404).json({ error: "File not found" });
    }
    console.error("File request failed:", error);
    if (!res.headersSent) res.status(500).json({ error: "Something went wrong" });
  }
}
