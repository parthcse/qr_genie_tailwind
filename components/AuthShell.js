import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { FaQrcode, FaCheck, FaExclamationCircle, FaChevronDown } from "react-icons/fa";
import PublicLayout from "./PublicLayout";

const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://qr-genie.co").replace(/\/$/, "");

/**
 * Two-column card for login, register and email verification: a brand panel (large screens) and the form.
 * panel: { eyebrow, title, text, points?: string[], steps?: string[], activeStep?: number }
 */
export default function AuthShell({ panel, children }) {
  return (
    <PublicLayout>
      <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="grid overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-indigo-900/10 ring-1 ring-indigo-100 motion-safe:animate-auth-in lg:grid-cols-[1fr_1.1fr]">
          <BrandPanel {...panel} />
          <div className="px-5 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">{children}</div>
        </div>
      </div>
    </PublicLayout>
  );
}

function BrandPanel({ eyebrow, title, text, points = [], steps = [], activeStep = 0 }) {
  return (
    <aside className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-10 text-white lg:flex lg:flex-col" aria-hidden="true">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.07)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_30%,transparent_100%)]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-400/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-indigo-400/40 blur-3xl" />

      <div className="relative flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
          <FaQrcode className="h-5 w-5" />
        </span>
        <span className="font-display text-lg font-bold tracking-tight">QR-Genie</span>
      </div>

      {/* Floating product preview, centred in the space between the logo and the text */}
      <div className="relative flex flex-1 items-center justify-center py-10">
      <div className="relative w-56">
        <div className="rounded-2xl bg-white p-4 text-slate-900 shadow-2xl shadow-indigo-950/30 motion-safe:animate-float">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700">Your code</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
            </span>
          </div>
          <div className="mt-3 flex justify-center rounded-xl bg-slate-50 p-2.5">
            <QRCodeSVG value={SITE_URL} size={120} level="M" fgColor="#1e1b4b" bgColor="#ffffff" />
          </div>
        </div>
        <div className="absolute -right-8 -top-11 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-slate-900 shadow-xl shadow-indigo-950/25 motion-safe:animate-float motion-safe:[animation-delay:-2s]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <FaCheck className="h-2.5 w-2.5" />
          </span>
          <span className="text-[11px] font-semibold">Link updated</span>
        </div>
        <div className="absolute -left-10 bottom-4 w-28 rounded-xl bg-white px-3 py-2 shadow-xl shadow-indigo-950/25 motion-safe:animate-float motion-safe:[animation-delay:-4s]">
          <span className="block text-[10px] font-medium text-slate-500">Scans today</span>
          <span className="mt-1.5 flex h-6 items-end gap-0.5">
            {[40, 65, 50, 80, 60, 100].map((h, i) => (
              <span key={i} className="flex-1 rounded-sm bg-gradient-to-t from-indigo-500 to-purple-400" style={{ height: `${h}%` }} />
            ))}
          </span>
        </div>
      </div>
      </div>

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">{eyebrow}</p>
        <h2 className="mt-3 text-2xl font-bold leading-snug tracking-[-0.01em]">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/90">{text}</p>
        {points.length > 0 && (
          <ul className="mt-6 space-y-3 text-sm">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/20">
                  <FaCheck className="h-2.5 w-2.5" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        )}
        {steps.length > 0 && (
          <ol className="mt-6 space-y-3 text-sm">
            {steps.map((s, i) => (
              <li key={s} className={`flex items-center gap-3 ${i > activeStep ? "text-white/90" : ""}`}>
                <span
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${
                    i < activeStep ? "bg-emerald-400 text-emerald-950" : i === activeStep ? "bg-white text-indigo-700" : "bg-white/15 ring-1 ring-white/30"
                  }`}
                >
                  {i < activeStep ? <FaCheck className="h-2.5 w-2.5" /> : i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}

/** Page heading inside the form column */
export function AuthHeading({ title, children }) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-[-0.02em] text-slate-900 sm:text-[2rem]">{title}</h1>
      {children && <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{children}</p>}
    </div>
  );
}

/**
 * Labelled input with an icon on the left and an optional element on the right (show-password button, tick).
 * The icon and border turn indigo while the field has focus.
 */
export function AuthInput({ id, label, icon: Icon, error, right, required, hint, labelAction, ...props }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
        </label>
        {labelAction}
      </div>
      <div className="group relative">
        {Icon && (
          <Icon
            className={`pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transition-colors duration-200 ${
              error ? "text-red-400" : "text-slate-400 group-focus-within:text-indigo-600"
            }`}
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`block w-full rounded-xl border bg-white py-3 text-base text-slate-900 shadow-sm transition duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-4 sm:text-sm ${
            Icon ? "pl-10" : "pl-4"
          } ${right ? "pr-11" : "pr-4"} ${
            error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
          }`}
          {...props}
        />
        {right && <div className="absolute inset-y-0 right-0 flex items-center pr-3">{right}</div>}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600 motion-safe:animate-fade-up">
          <FaExclamationCircle className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Dropdown styled like AuthInput */
export function AuthSelect({ id, label, icon: Icon, children, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="group relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition-colors duration-200 group-focus-within:text-indigo-600" aria-hidden="true" />
        )}
        <select
          id={id}
          className={`block w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pr-10 text-base text-slate-900 shadow-sm transition duration-200 hover:border-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 sm:text-sm ${Icon ? "pl-10" : "pl-4"}`}
          {...props}
        >
          {children}
        </select>
        <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      </div>
    </div>
  );
}

// Password strength: four checks; sign-up needs 8+ characters and 3 of the 4
export const PASSWORD_CHECKS = [
  { id: "length", label: "8+ characters", test: (p) => p.length >= 8 },
  { id: "letter", label: "A letter", test: (p) => /[a-zA-Z]/.test(p) },
  { id: "number", label: "A number", test: (p) => /\d/.test(p) },
  { id: "symbol", label: "A symbol", test: (p) => /[^a-zA-Z0-9\s]/.test(p) },
];
const STRENGTH = [
  { label: "Too weak", bar: "bg-red-500", text: "text-red-600" },
  { label: "Too weak", bar: "bg-red-500", text: "text-red-600" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-700" },
  { label: "Good", bar: "bg-emerald-500", text: "text-emerald-700" },
  { label: "Strong", bar: "bg-emerald-600", text: "text-emerald-700" },
];
export const passwordChecksPassed = (password) => PASSWORD_CHECKS.filter((c) => c.test(password)).length;

/** Four bars that fill in, a label and the four checks; slides open once something is typed */
export function PasswordStrength({ password }) {
  const passed = passwordChecksPassed(password);
  // Under 8 characters always reads "Too weak", whatever else it contains
  const strength = !password ? 0 : password.length < 8 ? Math.min(passed, 1) : passed;
  return (
    <div className={`grid transition-all duration-300 ${password ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`} aria-live="polite">
      <div className="overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="grid flex-1 grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <span className={`block h-full rounded-full transition-all duration-500 ease-out ${STRENGTH[strength].bar}`} style={{ width: i <= strength ? "100%" : "0%" }} />
              </span>
            ))}
          </div>
          <span className={`w-16 text-right text-xs font-semibold ${STRENGTH[strength].text}`}>{STRENGTH[strength].label}</span>
        </div>
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {PASSWORD_CHECKS.map((c) => {
            const ok = c.test(password);
            return (
              <li
                key={c.id}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-300 ${
                  ok ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" : "bg-slate-100 text-slate-600"
                }`}
              >
                <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors ${ok ? "bg-emerald-500 text-white" : "bg-slate-300"}`}>
                  {ok && <FaCheck className="h-2 w-2" />}
                </span>
                {c.label}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Green "it worked" notice, same shape as AuthAlert */
export function AuthSuccess({ children }) {
  if (!children) return null;
  return (
    <div role="status" className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 motion-safe:animate-fade-up">
      <FaCheck className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

/** Small round tick shown inside a field when it's right (e.g. passwords match) */
export function FieldTick({ show }) {
  return (
    <span
      className={`flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white transition duration-300 ${show ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
      aria-hidden="true"
    >
      <FaCheck className="h-2.5 w-2.5" />
    </span>
  );
}

/** Red notice above the form; `shakeKey` changes make it shake again */
export function AuthAlert({ children, shakeKey }) {
  if (!children) return null;
  return (
    <div
      key={shakeKey}
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 motion-safe:animate-shake"
    >
      <FaExclamationCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

/** Full-width gradient submit button with a spinner while busy */
export function AuthSubmit({ busy, busyLabel, children, icon: Icon }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="btn-shine group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-500/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-80 motion-reduce:transform-none"
    >
      {busy ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
          {busyLabel}
        </>
      ) : (
        <>
          {children}
          {Icon && <Icon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />}
        </>
      )}
    </button>
  );
}

/** "New here? Create an account" style line under the form */
export function AuthSwitch({ text, href, linkText }) {
  return (
    <p className="text-center text-sm text-slate-600">
      {text}{" "}
      <Link href={href} className="font-semibold !text-indigo-600 hover:!text-indigo-700">
        {linkText}
      </Link>
    </p>
  );
}
