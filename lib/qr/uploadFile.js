// Browser side of uploading a file for a hosted page (POST /api/files). The server checks everything again.
import { FILE_KINDS, MAX_GALLERY_BYTES, MAX_GALLERY_IMAGES, MAX_PHOTO_PICK_BYTES, MAX_PHOTO_PICK_LABEL, MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "./fileRules";

// Each photo is made to fit its share of the gallery's space, so any 8 photos fit together
const PHOTO_TARGET_BYTES = Math.floor(MAX_GALLERY_BYTES / MAX_GALLERY_IMAGES);
// Tried in turn until the photo is small enough. Nearly all stop at the first, which is sharp on any phone.
const PHOTO_STEPS = [
  { side: 1600, quality: 0.82 },
  { side: 1600, quality: 0.7 },
  { side: 1280, quality: 0.7 },
  { side: 1024, quality: 0.65 },
  { side: 800, quality: 0.6 },
];

/** A message when this file can't be uploaded as this kind; null when it's fine */
export function fileProblem(file, kind) {
  const accepted = FILE_KINDS[kind].accept.split(",");
  const typeOk = accepted.includes(file.type) || accepted.some((item) => item.startsWith(".") && file.name.toLowerCase().endsWith(item));
  if (!typeOk) return `"${file.name}" isn't ${FILE_KINDS[kind].noun}. Please use ${FILE_KINDS[kind].label}.`;
  if (kind === "image") {
    // Made smaller before it's uploaded (shrinkPhoto), so it can start out larger than the server's limit
    if (file.size > MAX_PHOTO_PICK_BYTES) return `"${file.name}" is too large. Photos can be up to ${MAX_PHOTO_PICK_LABEL}.`;
  } else if (file.size > MAX_UPLOAD_BYTES) {
    return `"${file.name}" is too large. Files can be up to ${MAX_UPLOAD_LABEL}.`;
  }
  if (file.size === 0) return `"${file.name}" is empty.`;
  return null;
}

const canvasToBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

async function encodePhoto(bitmap, { side, quality }) {
  const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const webp = await canvasToBlob(canvas, "image/webp", quality); // keeps a PNG's see-through parts
  if (webp?.type === "image/webp") return webp;
  // Safari can't write WebP and hands back a large PNG instead. JPEG can't be see-through, so those parts turn white.
  context.globalCompositeOperation = "destination-over";
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvasToBlob(canvas, "image/jpeg", quality);
}

/**
 * Makes a photo smaller before it's uploaded, so any 8 fit in a gallery and they load quickly: at most 1600 px on its
 * longest side and its share of the gallery's space, which also drops camera details such as GPS position. A photo
 * already within both stays as it is. If the browser can't read it, the original comes back and the caller decides.
 */
export async function shrinkPhoto(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    if (Math.max(bitmap.width, bitmap.height) <= PHOTO_STEPS[0].side && file.size <= PHOTO_TARGET_BYTES) return file;
    let smallest = file;
    for (const step of PHOTO_STEPS) {
      const blob = await encodePhoto(bitmap, step);
      if (blob && blob.size < smallest.size) smallest = blob;
      if (smallest.size <= PHOTO_TARGET_BYTES) break;
    }
    return smallest;
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}

/**
 * Uploads a file. onProgress gets 0 to 100. Resolves { file: { id, name, size } } or { error } (a message for the
 * person). The body is the raw file, not a form: proxy.js refuses form uploads.
 */
export function uploadFile(file, { kind, name, onProgress }) {
  return new Promise((resolve) => {
    const failed = "The upload didn't finish. Please check your connection and try again.";
    const request = new XMLHttpRequest();
    request.open("POST", `/api/files?kind=${encodeURIComponent(kind)}&name=${encodeURIComponent(name)}`);
    request.setRequestHeader("Content-Type", "application/octet-stream");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      let data = {};
      try {
        data = JSON.parse(request.responseText);
      } catch {
        // an error page from a proxy, not our API
      }
      if (request.status === 201 && data.file) return resolve({ file: data.file });
      if (request.status === 413) return resolve({ error: data.error || `The file must be ${MAX_UPLOAD_LABEL} or smaller.` });
      resolve({ error: data.error || failed });
    };
    request.onerror = () => resolve({ error: failed });
    request.send(file);
  });
}
