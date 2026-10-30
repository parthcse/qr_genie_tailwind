import { useId, useState } from "react";
import { FaArrowDown, FaArrowUp, FaCamera, FaCheck, FaPlus, FaTrash } from "react-icons/fa";
import { prepareLogo, MAX_IMAGE_LABEL } from "@/lib/qr/imageUpload";
import { LANDING_THEMES, DEFAULT_LANDING_THEME } from "@/lib/qr/landingThemes";
import { SOCIAL_PLATFORMS, socialPlatform } from "@/lib/qr/socialPlatforms";
import { WEEK_DAYS } from "@/lib/qr/qrContent";
import { BrandTile } from "@/components/qr/landing/brandIcons";

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

/** "profileList": social profiles, each a platform plus a username, number or link (lib/qr/socialPlatforms.js) */
export function ProfileListField({ field, value, onChange }) {
  const rows = Array.isArray(value) && value.length > 0 ? value : [{ platform: "instagram", value: "" }];
  const max = field.max || 20;
  // Suggest a platform that isn't on the list yet for a new row
  const nextPlatform = SOCIAL_PLATFORMS.find((p) => !rows.some((row) => row.platform === p.id))?.id || "website";

  const update = (index, patch) => onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const remove = (index) => onChange(rows.length === 1 ? [{ platform: "instagram", value: "" }] : rows.filter((_, i) => i !== index));
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
        {rows.map((row, index) => {
          const platform = socialPlatform(row.platform) || SOCIAL_PLATFORMS[0];
          return (
            <li key={index} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <BrandTile platform={platform.id} className="h-6 w-6" />
                  Profile {index + 1}
                </span>
                <span className="flex items-center gap-0.5">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move profile ${index + 1} up`} className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-30">
                    <FaArrowUp className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === rows.length - 1} aria-label={`Move profile ${index + 1} down`} className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-30">
                    <FaArrowDown className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => remove(index)} aria-label={`Remove profile ${index + 1}`} className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-red-600">
                    <FaTrash className="h-3 w-3" />
                  </button>
                </span>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <select
                  value={platform.id}
                  onChange={(e) => update(index, { platform: e.target.value })}
                  aria-label={`Profile ${index + 1} platform`}
                  className={`${inputClass} bg-white`}
                >
                  {SOCIAL_PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={row.value || ""}
                  onChange={(e) => update(index, { value: e.target.value })}
                  placeholder={platform.placeholder}
                  aria-label={`Profile ${index + 1} username or link`}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className={`${inputClass} bg-white`}
                />
              </div>
            </li>
          );
        })}
      </ol>
      {rows.length < max ? (
        <button
          type="button"
          onClick={() => onChange([...rows, { platform: nextPlatform, value: "" }])}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
        >
          <FaPlus className="h-3 w-3" />
          Add profile
        </button>
      ) : (
        <p className="mt-3 text-xs text-slate-500">That's the maximum of {max} profiles.</p>
      )}
    </div>
  );
}

/** "hours": opening hours as free text for each day of the week ("9:00 – 18:00", "Closed"); empty days are left out */
export function HoursField({ field, value, onChange }) {
  const hours = value && typeof value === "object" ? value : {};
  const weekdays = WEEK_DAYS.slice(0, 5);
  const copyMonday = () => onChange({ ...hours, ...Object.fromEntries(weekdays.slice(1).map((day) => [day.id, hours.mon || ""])) });
  return (
    <fieldset>
      <legend className={labelClass}>{field.label}</legend>
      <div className="space-y-2">
        {WEEK_DAYS.map((day) => (
          <label key={day.id} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3">
            <span className="text-sm text-slate-600">{day.label}</span>
            <input
              type="text"
              value={hours[day.id] || ""}
              onChange={(e) => onChange({ ...hours, [day.id]: e.target.value })}
              maxLength={40}
              placeholder={day.id === "sun" ? "e.g. Closed" : "e.g. 9:00 – 18:00"}
              className={inputClass}
            />
          </label>
        ))}
      </div>
      {hours.mon && (
        <button type="button" onClick={copyMonday} className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700">
          Copy Monday to Tuesday–Friday
        </button>
      )}
      <p className="mt-1.5 text-xs text-slate-500">Leave a day empty to hide it.</p>
    </fieldset>
  );
}

const emptyDish = () => ({ name: "", description: "", price: "" });

/** "menuSections": the menu as sections of dishes, each with a name, a price and a short description */
export function MenuField({ field, value, onChange }) {
  const sections = Array.isArray(value) && value.length > 0 ? value : [{ title: "", items: [emptyDish()] }];
  const dishCount = sections.reduce((sum, section) => sum + (section.items?.length || 0), 0);
  const maxSections = field.maxSections || 20;
  const maxDishes = field.maxItems || 200;

  const setSection = (index, patch) => onChange(sections.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  const moveIn = (list, index, step) => {
    const next = [...list];
    const target = index + step;
    if (target < 0 || target >= next.length) return list;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  };
  const iconButton = "rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-30";

  return (
    <div>
      <span className={labelClass}>
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <div className="space-y-4">
        {sections.map((section, s) => {
          const items = section.items?.length ? section.items : [emptyDish()];
          const setItem = (i, patch) => setSection(s, { items: items.map((item, n) => (n === i ? { ...item, ...patch } : item)) });
          return (
            <div key={s} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={section.title || ""}
                  onChange={(e) => setSection(s, { title: e.target.value })}
                  maxLength={60}
                  placeholder={s === 0 ? "Section, e.g. Coffee" : "Section, e.g. Cakes"}
                  aria-label={`Section ${s + 1} name`}
                  className={`${inputClass} bg-white font-semibold`}
                />
                <span className="flex flex-none items-center gap-0.5">
                  <button type="button" onClick={() => onChange(moveIn(sections, s, -1))} disabled={s === 0} aria-label={`Move section ${s + 1} up`} className={iconButton}>
                    <FaArrowUp className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => onChange(moveIn(sections, s, 1))} disabled={s === sections.length - 1} aria-label={`Move section ${s + 1} down`} className={iconButton}>
                    <FaArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(sections.length === 1 ? [{ title: "", items: [emptyDish()] }] : sections.filter((_, i) => i !== s))}
                    aria-label={`Remove section ${s + 1}`}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-red-600"
                  >
                    <FaTrash className="h-3 w-3" />
                  </button>
                </span>
              </div>
              <ol className="mt-3 space-y-2">
                {items.map((item, i) => (
                  <li key={i} className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <div className="grid grid-cols-[minmax(0,1fr)_6.5rem_auto] items-center gap-2">
                      <input
                        type="text"
                        value={item.name || ""}
                        onChange={(e) => setItem(i, { name: e.target.value })}
                        maxLength={80}
                        placeholder="Dish, e.g. Cappuccino"
                        aria-label={`Section ${s + 1}, dish ${i + 1} name`}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        value={item.price || ""}
                        onChange={(e) => setItem(i, { price: e.target.value })}
                        maxLength={20}
                        placeholder="Price"
                        aria-label={`Section ${s + 1}, dish ${i + 1} price`}
                        className={inputClass}
                      />
                      <span className="flex items-center">
                        <button type="button" onClick={() => setSection(s, { items: moveIn(items, i, -1) })} disabled={i === 0} aria-label={`Move dish ${i + 1} up`} className={iconButton}>
                          <FaArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSection(s, { items: items.length === 1 ? [emptyDish()] : items.filter((_, n) => n !== i) })}
                          aria-label={`Remove dish ${i + 1}`}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-red-600"
                        >
                          <FaTrash className="h-3 w-3" />
                        </button>
                      </span>
                    </div>
                    <input
                      type="text"
                      value={item.description || ""}
                      onChange={(e) => setItem(i, { description: e.target.value })}
                      maxLength={200}
                      placeholder="Short description (optional)"
                      aria-label={`Section ${s + 1}, dish ${i + 1} description`}
                      className={`${inputClass} mt-2 py-2 text-xs`}
                    />
                  </li>
                ))}
              </ol>
              {dishCount < maxDishes && (
                <button
                  type="button"
                  onClick={() => setSection(s, { items: [...items, emptyDish()] })}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
                >
                  <FaPlus className="h-3 w-3" />
                  Add dish
                </button>
              )}
            </div>
          );
        })}
      </div>
      {sections.length < maxSections ? (
        <button
          type="button"
          onClick={() => onChange([...sections, { title: "", items: [emptyDish()] }])}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
        >
          <FaPlus className="h-3 w-3" />
          Add section
        </button>
      ) : (
        <p className="mt-3 text-xs text-slate-500">That's the maximum of {maxSections} sections.</p>
      )}
      <p className="mt-1.5 text-xs text-slate-500">
        {dishCount} of {maxDishes} dishes. Empty rows are left out.
      </p>
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
