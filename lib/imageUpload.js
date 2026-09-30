// Uploaded images (QR logos) are saved inside the QR code's record in the database, so they're kept small.
export const MAX_IMAGE_BYTES = 150 * 1024;
export const MAX_IMAGE_LABEL = "150 KB";
// A data URL is base64, about a third bigger than the file, plus a short "data:image/...;base64," prefix
export const MAX_IMAGE_DATA_URL_LENGTH = Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 64;

const MAX_INPUT_BYTES = 10 * 1024 * 1024; // refuse huge files before trying to shrink them
const MAX_SIDE = 600; // px; plenty for a logo in the middle of a QR code, even on a poster

const dataUrlBytes = (dataUrl) => Math.ceil(((dataUrl.length - dataUrl.indexOf(",") - 1) * 3) / 4);

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Turns an uploaded image into a data URL of at most 150 KB, shrinking it in the browser when needed.
 * Resolves { dataUrl, resized } or { error } (a message for the user).
 */
export async function prepareLogo(file) {
  if (!file || !file.type?.startsWith("image/")) {
    return { error: "Please choose an image file (PNG, JPG, WebP or SVG)." };
  }
  if (file.size > MAX_INPUT_BYTES) {
    return { error: "That image is too large. Please choose one under 10 MB." };
  }

  let original;
  try {
    original = await readAsDataUrl(file);
  } catch {
    return { error: "Couldn't read that image. Please try another file." };
  }

  // SVGs can't be shrunk the same way; they're usually tiny anyway
  if (file.type === "image/svg+xml") {
    return file.size <= MAX_IMAGE_BYTES ? { dataUrl: original, resized: false } : { error: `SVG logos must be ${MAX_IMAGE_LABEL} or smaller.` };
  }

  let img;
  try {
    img = await loadImage(original);
  } catch {
    return { error: "Couldn't read that image. Please try another file." };
  }

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  if (scale === 1 && file.size <= MAX_IMAGE_BYTES && /^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
    return { dataUrl: original, resized: false };
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

  // PNG first (sharpest, keeps transparency), then WebP at falling quality (also keeps transparency)
  for (const [type, quality] of [["image/png"], ["image/webp", 0.92], ["image/webp", 0.8], ["image/webp", 0.65]]) {
    const out = canvas.toDataURL(type, quality);
    if (out.startsWith(`data:${type}`) && dataUrlBytes(out) <= MAX_IMAGE_BYTES) {
      return { dataUrl: out, resized: true };
    }
  }
  return { error: `We couldn't make this image small enough. Please use a simpler logo under ${MAX_IMAGE_LABEL}.` };
}
