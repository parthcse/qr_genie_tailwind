import { useId, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight, FaCloudUploadAlt, FaFilePdf, FaMusic, FaPlus, FaTimes } from "react-icons/fa";
import { FILE_KINDS, MAX_GALLERY_BYTES, MAX_GALLERY_IMAGES, MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, fileUrl, formatFileSize } from "@/lib/qr/fileRules";
import { fileProblem, shrinkPhoto, uploadFile } from "@/lib/qr/uploadFile";

/**
 * Form fields that upload to the server (lib/qr/uploadFile.js), used by DynamicForm: "upload" (one MP3 or PDF) and
 * "gallery" (the photos of an Images page). The value is what's saved in the content: { id, name, size }.
 */

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
const KIND_ICONS = { audio: FaMusic, pdf: FaFilePdf };

function ProgressBar({ percent, label }) {
  return (
    <div role="status">
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-600">
        <span className="min-w-0 truncate">{label}</span>
        <span className="flex-none tabular-nums">{percent}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-[width] duration-200" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

// The dashed box you click or drop files on
function DropZone({ inputId, accept, multiple = false, onFiles, title, hint }) {
  const [over, setOver] = useState(false);
  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles([...e.dataTransfer.files]);
      }}
      className={`group flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition focus-within:ring-2 focus-within:ring-indigo-500/30 ${
        over ? "border-indigo-400 bg-indigo-50" : "border-slate-300 bg-slate-50/60 hover:border-indigo-300 hover:bg-indigo-50/40"
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200 transition group-hover:-translate-y-0.5 motion-reduce:transform-none">
        <FaCloudUploadAlt className="h-5 w-5" />
      </span>
      <span className="mt-2.5 text-sm font-semibold text-slate-800">{title}</span>
      <span className="mt-0.5 text-xs text-slate-500">{hint}</span>
      <input
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          const files = [...e.target.files];
          e.target.value = ""; // the same file can be picked again after an error
          onFiles(files);
        }}
      />
    </label>
  );
}

/** One uploaded MP3 or PDF. field.kind: "audio" or "pdf". */
export function UploadField({ field, value, onChange }) {
  const inputId = useId();
  const [percent, setPercent] = useState(null);
  const [error, setError] = useState("");
  const kind = FILE_KINDS[field.kind];
  const Icon = KIND_ICONS[field.kind] || FaCloudUploadAlt;

  const start = async ([file]) => {
    if (!file) return;
    const problem = fileProblem(file, field.kind);
    setError(problem || "");
    if (problem) return;
    setPercent(0);
    const result = await uploadFile(file, { kind: field.kind, name: file.name, onProgress: setPercent });
    setPercent(null);
    if (result.error) setError(result.error);
    else onChange(result.file);
  };

  return (
    <div>
      <span className={labelClass}>
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {percent !== null ? (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
          <ProgressBar percent={percent} label="Uploading…" />
        </div>
      ) : value ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-slate-900">{value.name}</span>
            <span className="block text-xs text-slate-500">{formatFileSize(value.size)}</span>
          </span>
          <label
            htmlFor={inputId}
            className="btn-shine btn-shine-soft flex-none cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 focus-within:ring-2 focus-within:ring-indigo-500/30"
          >
            Replace
            <input
              id={inputId}
              type="file"
              accept={kind.accept}
              className="sr-only"
              onChange={(e) => {
                const files = [...e.target.files];
                e.target.value = "";
                start(files);
              }}
            />
          </label>
          <button type="button" onClick={() => onChange(null)} className="flex-none rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:text-red-600">
            Remove
          </button>
        </div>
      ) : (
        <DropZone inputId={inputId} accept={kind.accept} onFiles={start} title={`Upload your ${kind.label}`} hint={`Click or drop a file here. Up to ${MAX_UPLOAD_LABEL}.`} />
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The photos of an Images page, in the order they're shown: add several at once, reorder, remove. Up to 8, 5 MB between
 * them, measured after each photo has been made smaller.
 */
export function GalleryField({ field, value, onChange }) {
  const inputId = useId();
  const [busy, setBusy] = useState(null); // { done, total, percent }
  const [errors, setErrors] = useState([]);
  const images = Array.isArray(value) ? value : [];
  // Uploads finish one after another; each adds to the latest list, not the one from when they started
  const latest = useRef(images);
  latest.current = images;
  const max = field.max || MAX_GALLERY_IMAGES;
  const usedBytes = images.reduce((sum, image) => sum + (image.size || 0), 0);

  const add = async (files) => {
    const problems = [];
    const room = max - latest.current.length;
    if (files.length > room) problems.push(`A gallery can have up to ${max} photos, so ${files.length - Math.max(room, 0)} of these ${files.length === 1 ? "wasn't" : "weren't"} added.`);
    const chosen = files.slice(0, Math.max(room, 0)).filter((file) => {
      const problem = fileProblem(file, "image");
      if (problem) problems.push(problem);
      return !problem;
    });
    setErrors(problems);

    for (let i = 0; i < chosen.length; i += 1) {
      setBusy({ done: i, total: chosen.length, percent: 0 });
      const photo = await shrinkPhoto(chosen[i]);
      if (photo.size > MAX_UPLOAD_BYTES) {
        // The browser couldn't read it, so it couldn't be made smaller
        setErrors((list) => [...list, `"${chosen[i].name}" couldn't be made small enough. Please choose another photo.`]);
        continue;
      }
      const used = latest.current.reduce((sum, image) => sum + image.size, 0);
      if (used + photo.size > MAX_GALLERY_BYTES) {
        setErrors((list) => [...list, `"${chosen[i].name}" doesn't fit: your photos can add up to ${MAX_UPLOAD_LABEL} and ${formatFileSize(used)} is used. Remove a photo or choose a smaller one.`]);
        continue;
      }
      const result = await uploadFile(photo, {
        kind: "image",
        name: chosen[i].name,
        onProgress: (percent) => setBusy({ done: i, total: chosen.length, percent }),
      });
      if (result.error) {
        setErrors((list) => [...list, `${chosen[i].name}: ${result.error}`]);
      } else {
        latest.current = [...latest.current, result.file];
        onChange(latest.current);
      }
    }
    setBusy(null);
  };

  const move = (index, step) => {
    const next = [...images];
    const target = index + step;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">
          {field.label}
          {field.required && <span className="ml-1 text-red-500">*</span>}
        </span>
        <span className="text-xs tabular-nums text-slate-500">
          {images.length} of {max} photos · {formatFileSize(usedBytes)} of {MAX_UPLOAD_LABEL}
        </span>
      </div>

      {images.length === 0 && !busy ? (
        <DropZone inputId={inputId} accept={FILE_KINDS.image.accept} multiple onFiles={add} title="Add your photos" hint={`${FILE_KINDS.image.label}. Up to ${max} photos, ${MAX_UPLOAD_LABEL} in total. Click or drop them here.`} />
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element -- the customer's own uploaded file */}
              <img src={fileUrl(image.id)} alt={image.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, i) => i !== index))}
                aria-label={`Remove ${image.name}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-600"
              >
                <FaTimes className="h-2.5 w-2.5" />
              </button>
              <span className="absolute inset-x-1 bottom-1 flex justify-between">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${image.name} earlier`} className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-indigo-600 disabled:opacity-0">
                  <FaArrowLeft className="h-2.5 w-2.5" />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === images.length - 1} aria-label={`Move ${image.name} later`} className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-indigo-600 disabled:opacity-0">
                  <FaArrowRight className="h-2.5 w-2.5" />
                </button>
              </span>
            </li>
          ))}
          {!busy && images.length < max && (
            <li>
              <label
                htmlFor={inputId}
                className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700 focus-within:ring-2 focus-within:ring-indigo-500/30"
              >
                <FaPlus className="h-3.5 w-3.5" />
                Add
                <input
                  id={inputId}
                  type="file"
                  accept={FILE_KINDS.image.accept}
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    const files = [...e.target.files];
                    e.target.value = "";
                    add(files);
                  }}
                />
              </label>
            </li>
          )}
        </ul>
      )}

      {busy && (
        <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
          <ProgressBar percent={busy.percent} label={busy.total > 1 ? `Uploading photo ${busy.done + 1} of ${busy.total}…` : "Uploading your photo…"} />
        </div>
      )}
      {errors.map((message) => (
        <p key={message} className="mt-1.5 text-xs text-red-600" role="alert">
          {message}
        </p>
      ))}
    </div>
  );
}
