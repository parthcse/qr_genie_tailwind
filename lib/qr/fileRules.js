// What can be uploaded for hosted pages (Images, MP3, PDF). Plain data, shared by the browser and the server; the
// server-side storage is lib/qr/fileStore.js.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "5 MB";
// An Images page: up to 8 photos, 5 MB between them
export const MAX_GALLERY_IMAGES = 8;
export const MAX_GALLERY_BYTES = 5 * 1024 * 1024;
// A photo is made smaller in the browser before uploading, so it can start out larger than what's stored. This only
// stops files so big that a phone's browser would struggle to open them.
export const MAX_PHOTO_PICK_BYTES = 50 * 1024 * 1024;
export const MAX_PHOTO_PICK_LABEL = "50 MB";
// Room per account for all its files together, so one account can't fill the disk. Enforced in pages/api/files and
// shown on the pricing page.
export const MAX_TRIAL_STORAGE_BYTES = 50 * 1024 * 1024;
export const MAX_PAID_STORAGE_BYTES = 500 * 1024 * 1024;

// SVG isn't accepted: it can carry scripts
export const FILE_KINDS = {
  image: { accept: "image/jpeg,image/png,image/webp", label: "JPG, PNG or WebP", noun: "an image" },
  audio: { accept: "audio/mpeg,.mp3", label: "MP3", noun: "an MP3 file" },
  pdf: { accept: "application/pdf,.pdf", label: "PDF", noun: "a PDF" },
};

/** A stored file's id: 24 random characters (nanoid) */
export const FILE_ID = /^[A-Za-z0-9_-]{24}$/;

export const fileUrl = (id) => `/api/files/${id}`;
export const fileDownloadUrl = (id) => `/api/files/${id}?download=1`;

/** "2.4 MB", "640 KB" */
export function formatFileSize(bytes) {
  const size = Number(bytes) || 0;
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

/** A file name for display and as a default title, without folders, control characters or the extension's dot trouble */
export function cleanFileName(value, max = 120) {
  const base = String(value || "").split(/[\\/]/).pop();
  return base.replace(/[\u0000-\u001f\u007f"]/g, "").trim().slice(-max) || "file";
}

/** "Spring menu.pdf" as a title: "Spring menu" */
export const titleFromFileName = (name) => cleanFileName(name).replace(/\.[a-z0-9]{1,5}$/i, "").replace(/[_-]+/g, " ").trim();
