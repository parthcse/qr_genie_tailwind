import { useId, useState } from "react";
import { FaArrowDown, FaArrowUp, FaCamera, FaCheck, FaPlus, FaTrash } from "react-icons/fa";
import { prepareLogo, MAX_IMAGE_LABEL } from "@/lib/qr/imageUpload";
import { LANDING_THEMES, DEFAULT_LANDING_THEME } from "@/lib/qr/landingThemes";

/**
 * Form fields for the hosted page types (list of links, ...), used by DynamicForm:
 * "image" (a photo or logo, shrunk in the browser to 150 KB and kept as a data URL), "linkList" (title + web address
 * rows) and "theme" (the page's colour theme from lib/qr/landingThemes.js).
 */

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

export function ImageField({ field, value, onChange }) {
  const inputId = useId();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // the same file can be picked again after an error
    if (!file) return;
    setBusy(true);
    setError("");
    const result = await prepareLogo(file);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onChange(result.dataUrl);
  };

  return (
    <div>
      <span className={labelClass}>{field.label}</span>
      <div className="flex items-center gap-4">
        <span className={`flex h-16 w-16 flex-none items-center justify-center overflow-hidden bg-slate-100 text-slate-400 ring-1 ring-slate-200 ${field.round === false ? "rounded-xl" : "rounded-full"}`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- local data URL preview
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <FaCamera className="h-5 w-5" />
          )}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={inputId}
            className="btn-shine btn-shine-soft inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 focus-within:ring-2 focus-within:ring-indigo-500/30"
          >
            {busy ? "Preparing…" : value ? "Change" : "Upload"}
            <input id={inputId} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={pick} className="sr-only" />
          </label>
          {value && (
            <button type="button" onClick={() => onChange(null)} className="rounded-lg px-2 py-2 text-sm font-medium text-slate-500 transition hover:text-red-600">
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-xs text-slate-500">{field.help || `PNG, JPG or WebP. Big photos are made smaller (${MAX_IMAGE_LABEL} at most).`}</p>
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function LinkListField({ field, value, onChange }) {
  const rows = Array.isArray(value) && value.length > 0 ? value : [{ title: "", url: "" }];
  const max = field.max || 20;

  const update = (index, key, text) => onChange(rows.map((row, i) => (i === index ? { ...row, [key]: text } : row)));
  const remove = (index) => onChange(rows.length === 1 ? [{ title: "", url: "" }] : rows.filter((_, i) => i !== index));
  const move = (index, step) => {
    const next = [...rows];
    const target = index + step;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div>
      <span className={labelClass}>
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <ol className="space-y-3">
        {rows.map((row, index) => (
          <li key={index} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Link {index + 1}</span>
              <span className="flex items-center gap-0.5">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move link ${index + 1} up`} className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-30">
                  <FaArrowUp className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === rows.length - 1} aria-label={`Move link ${index + 1} down`} className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-30">
                  <FaArrowDown className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => remove(index)} aria-label={`Remove link ${index + 1}`} className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-red-600">
                  <FaTrash className="h-3 w-3" />
                </button>
              </span>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input
                type="text"
                value={row.title || ""}
                onChange={(e) => update(index, "title", e.target.value)}
                maxLength={60}
                placeholder="Button text, e.g. Book a table"
                aria-label={`Link ${index + 1} title`}
                className={`${inputClass} bg-white`}
              />
              <input
                type="url"
                inputMode="url"
                value={row.url || ""}
                onChange={(e) => update(index, "url", e.target.value)}
                placeholder="https://"
                aria-label={`Link ${index + 1} web address`}
                className={`${inputClass} bg-white`}
              />
            </div>
          </li>
        ))}
      </ol>
      {rows.length < max ? (
        <button
          type="button"
          onClick={() => onChange([...rows, { title: "", url: "" }])}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
        >
          <FaPlus className="h-3 w-3" />
          Add link
        </button>
      ) : (
        <p className="mt-3 text-xs text-slate-500">That's the maximum of {max} links.</p>
      )}
    </div>
  );
}

export function ThemeField({ field, value, onChange }) {
  const selected = value || DEFAULT_LANDING_THEME;
  return (
    <fieldset>
      <legend className={labelClass}>{field.label}</legend>
      <div className="grid grid-cols-4 gap-2">
        {LANDING_THEMES.map((theme) => {
          const checked = selected === theme.id;
          return (
            <label
              key={theme.id}
              className={`group relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-2 transition focus-within:ring-2 focus-within:ring-indigo-500/40 ${
                checked ? "border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-400" : "border-slate-200 hover:border-indigo-200"
              }`}
            >
              <input type="radio" name={field.id} value={theme.id} checked={checked} onChange={() => onChange(theme.id)} className="sr-only" />
              <span className="relative h-9 w-full rounded-lg ring-1 ring-inset ring-black/5" style={{ background: theme.background }}>
                {checked && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-indigo-600 shadow">
                      <FaCheck className="h-2.5 w-2.5" />
                    </span>
                  </span>
                )}
              </span>
              <span className="text-xs font-medium text-slate-600">{theme.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
