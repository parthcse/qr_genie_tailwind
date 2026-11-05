import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { FaArrowLeft, FaChartLine, FaExclamationTriangle, FaEye, FaEyeSlash, FaFolder, FaLock, FaPhotoVideo, FaQrcode, FaTimes, FaUser } from "react-icons/fa";
import { AuthAlert, AuthInput } from "@/components/auth/AuthShell";
import { formatFileSize } from "@/lib/qr/fileRules";
import { DELETE_ACCOUNT_WORD } from "@/lib/site";

const plural = (count, word) => `${count.toLocaleString("en-IN")} ${word}${count === 1 ? "" : "s"}`;

// What's in the account, as far as it's been counted; the wording still works if the counts couldn't be loaded
function WhatGoes({ summary }) {
  const rows = [
    {
      icon: FaQrcode,
      title: summary ? plural(summary.qrCodes, "QR code") : "All your QR codes",
      text: "Printed codes stop working straight away and can't be brought back. Static codes, such as Wi-Fi, hold their details themselves, so they keep working, but you can't manage them any more.",
    },
    { icon: FaChartLine, title: summary ? `${plural(summary.scans, "scan")} of analytics` : "All your analytics", text: "Your whole scan history." },
    ...(!summary || summary.files > 0
      ? [{ icon: FaPhotoVideo, title: summary ? `${plural(summary.files, "uploaded file")} (${formatFileSize(summary.fileBytes)})` : "Your uploaded files", text: "Photos, audio and PDFs are removed from our server." }]
      : []),
    { icon: FaFolder, title: "Your folders and designs", text: "Everything you've organised and styled." },
    { icon: FaUser, title: "Your profile and billing details", text: "Your name, email, password, address and messages to us." },
  ];
  return (
    <ul className="mt-5 space-y-3">
      {rows.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex gap-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="min-w-0 text-sm leading-relaxed text-gray-600">
            <span className="block font-semibold text-gray-900">{title}</span>
            {text}
          </span>
        </li>
      ))}
    </ul>
  );
}

// What happens to the plan, when there's one running
function PlanNotice({ plan }) {
  if (!plan || plan.state === "none") return null;
  const lines = {
    active: (
      <>
        Your <strong>{plan.planName}</strong> is cancelled straight away and you won&apos;t be charged again. The time you&apos;ve paid for, up to {plan.endsOn}, is lost and
        isn&apos;t refunded. <Link href="/dashboard/billing" className="font-semibold !text-amber-900 underline">Only want to stop paying? Cancel your subscription instead</Link>: it keeps
        working until {plan.endsOn}.
      </>
    ),
    cancelled: <>Your {plan.planName} is already cancelled. The time left, up to {plan.endsOn}, is lost and isn&apos;t refunded.</>,
    freeDays: <>Your {plan.planName} hasn&apos;t started yet, so it&apos;s cancelled and your payment is refunded in full.</>,
  };
  return <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm leading-relaxed text-amber-900">{lines[plan.state]}</p>;
}

/**
 * Deleting the account, in two steps: a warning with what will go, then typing CONFIRM with the account's password.
 * Stays open and can't be closed while the request runs; on success the browser moves to /auth/account-deleted.
 */
export default function DeleteAccountModal({ open, onClose }) {
  const [step, setStep] = useState(1);
  const [summary, setSummary] = useState(null);
  const [word, setWord] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);
  const wordInput = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setStep(1);
    setSummary(null);
    setWord("");
    setPassword("");
    setError("");
    let cancelled = false;
    fetch("/api/account/delete", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => !cancelled && setSummary(data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  useEffect(() => {
    if (step === 2) wordInput.current?.focus();
  }, [step]);

  if (!open || typeof document === "undefined") return null;

  const wordOk = word.trim().toUpperCase() === DELETE_ACCOUNT_WORD;

  const submit = async (e) => {
    e.preventDefault();
    if (!wordOk || !password || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirmation: word, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Your account couldn't be deleted. Please try again.");
      window.location.assign("/auth/account-deleted");
    } catch (err) {
      setError(err.message);
      setShake((n) => n + 1);
      setBusy(false);
    }
  };

  const blocked = summary?.canDelete === false;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm motion-safe:animate-fade-in sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className="relative my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl motion-safe:animate-modal-pop sm:p-8">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-40"
        >
          <FaTimes className="h-4 w-4" />
        </button>

        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
          <FaExclamationTriangle className="h-5 w-5" />
        </span>

        {step === 1 ? (
          <>
            <h2 id="delete-account-title" className="mt-4 pr-8 text-xl font-bold tracking-tight text-gray-900">
              Delete your account?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
              This permanently deletes your account and everything in it. <strong className="text-gray-900">It can&apos;t be undone</strong>, and we can&apos;t restore anything afterwards.
            </p>

            {blocked ? (
              <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-700">
                Admin accounts can&apos;t be deleted here. Ask another admin, or remove the admin role first.
              </p>
            ) : (
              <>
                <PlanNotice plan={summary?.plan} />
                <WhatGoes summary={summary} />
                {summary?.invoices > 0 && (
                  <p className="mt-5 rounded-xl bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600">
                    <strong className="text-slate-800">What we have to keep:</strong> tax law requires us to keep your {plural(summary.invoices, "GST invoice")}. They&apos;re no longer linked to an account, and
                    are used only for tax records.
                  </p>
                )}
              </>
            )}

            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {!blocked && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-shine btn-shine-soft inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Continue to delete
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="btn-shine inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-purple-700"
              >
                Keep my account
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2 id="delete-account-title" className="mt-4 pr-8 text-xl font-bold tracking-tight text-gray-900">
              Last step
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
              Once you confirm, your account and all its data are gone for good, straight away.
            </p>

            <div className="mt-5 space-y-4">
              <AuthAlert shakeKey={shake}>{error}</AuthAlert>
              <div>
                <label htmlFor="delete-confirm-word" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Type <strong className="font-mono font-bold tracking-wide text-red-600">{DELETE_ACCOUNT_WORD}</strong> to confirm
                </label>
                <input
                  ref={wordInput}
                  id="delete-confirm-word"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  disabled={busy}
                  placeholder={DELETE_ACCOUNT_WORD}
                  className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition placeholder:text-slate-300 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-100"
                />
              </div>
              <AuthInput
                id="delete-confirm-password"
                label="Your password"
                icon={FaLock}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                right={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:text-slate-600"
                  >
                    {showPassword ? <FaEyeSlash className="h-3.5 w-3.5" /> : <FaEye className="h-3.5 w-3.5" />}
                  </button>
                }
              />
            </div>

            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={busy}
                className="btn-shine btn-shine-soft inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-50"
              >
                <FaArrowLeft className="h-3 w-3" />
                Back
              </button>
              <button
                type="submit"
                disabled={!wordOk || !password || busy}
                className="btn-shine inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition hover:from-rose-700 hover:to-red-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {busy ? "Deleting…" : "Permanently delete my account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
