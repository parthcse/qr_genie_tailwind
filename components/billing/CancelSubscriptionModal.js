import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaCalendarTimes, FaCheck, FaQrcode, FaRedo, FaTimes } from "react-icons/fa";
import { CANCEL_REASONS } from "@/lib/site";

/**
 * Confirms cancelling the Basic Package (billing page), with an optional reason, then shows the result.
 * endsOn: the last day of the paid period, as text. onCancelled(endsAt) runs after the cancellation went through.
 */
export default function CancelSubscriptionModal({ open, endsOn, onClose, onCancelled }) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const doneButton = useRef(null);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setComment("");
    setError("");
    setDone(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  useEffect(() => {
    if (done) doneButton.current?.focus();
  }, [done]);

  if (!open || typeof document === "undefined") return null;

  const cancel = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: reason || undefined, comment: comment.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We couldn't cancel your subscription. Please try again.");
      setDone(true);
      onCancelled?.(data.endsAt || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm motion-safe:animate-fade-in sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-plan-title"
        className="relative my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl motion-safe:animate-modal-pop sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-40"
        >
          <FaTimes className="h-4 w-4" />
        </button>

        {done ? (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
              <FaCheck className="h-6 w-6" />
            </span>
            <h2 id="cancel-plan-title" className="mt-5 text-xl font-bold tracking-tight text-gray-900">
              Your subscription is cancelled
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
              Your Basic Package stays active until <strong className="text-gray-900">{endsOn}</strong>, and you won&apos;t be
              charged again. We&apos;ve emailed you a confirmation.
            </p>
            <button
              ref={doneButton}
              type="button"
              onClick={onClose}
              className="btn-shine mt-7 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold !text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
              <FaCalendarTimes className="h-5 w-5" />
            </span>
            <h2 id="cancel-plan-title" className="mt-4 pr-8 text-xl font-bold tracking-tight text-gray-900">
              Cancel your subscription?
            </h2>
            <p className="mt-1.5 text-sm text-gray-600">You keep everything you&apos;ve paid for. Here&apos;s what happens:</p>

            <div className="mt-5 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Your plan stays active until</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-gray-900">{endsOn}</p>
              <ul className="mt-4 space-y-2.5 text-sm text-gray-700">
                <li className="flex gap-3">
                  <FaCheck className="mt-0.5 h-4 w-4 flex-none text-emerald-600" aria-hidden="true" />
                  You won&apos;t be charged again.
                </li>
                <li className="flex gap-3">
                  <FaQrcode className="mt-0.5 h-4 w-4 flex-none text-indigo-600" aria-hidden="true" />
                  Your QR codes keep working until then. After that date they&apos;re paused.
                </li>
                <li className="flex gap-3">
                  <FaRedo className="mt-0.5 h-3.5 w-3.5 flex-none text-indigo-600" aria-hidden="true" />
                  Nothing is deleted. Subscribe again later and the same codes work straight away.
                </li>
              </ul>
            </div>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-gray-900">
                Why are you leaving? <span className="font-normal text-gray-500">(optional)</span>
              </legend>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CANCEL_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${
                      reason === r.value
                        ? "border-indigo-300 bg-indigo-50 font-medium text-indigo-900 ring-1 ring-indigo-200"
                        : "border-gray-200 text-gray-700 hover:border-indigo-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancel-reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label htmlFor="cancel-comment" className="mt-5 block text-sm font-semibold text-gray-900">
              Anything we could do better? <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <textarea
              id="cancel-comment"
              rows={3}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Your feedback helps us improve QR-Genie."
            />

            {error && (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-100">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                autoFocus
                className="btn-shine flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold !text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                Keep my plan
              </button>
              <button
                type="button"
                onClick={cancel}
                disabled={busy}
                className="btn-shine btn-shine-soft flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold !text-red-700 transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" aria-hidden="true" />}
                {busy ? "Cancelling…" : "Cancel subscription"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
