import { useEffect, useRef } from "react";
import Link from "next/link";
import { FaTimes, FaBolt, FaRedo } from "react-icons/fa";

// Fixed layout so confetti looks the same on every open: position, delay, colour, shape
const CONFETTI_COLORS = ["#fbbf24", "#34d399", "#f472b6", "#60a5fa", "#ffffff", "#c084fc"];
const CONFETTI = Array.from({ length: 24 }, (_, i) => ({
  left: (i * 37 + 7) % 100,
  delay: ((i * 7) % 12) / 10,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  wide: i % 3 === 0,
}));

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function SummaryRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900 text-right break-all">{children}</dd>
    </div>
  );
}

/**
 * Result popup for Razorpay checkout.
 * result: null (hidden)
 *   | { type: "success", paymentId?, endsAt?, reactivatedCount? }
 *   | { type: "error", title, message?, note?, paymentId? }
 */
export default function PaymentResultModal({ result, planName, priceLabel, onClose, onRetry }) {
  const primaryRef = useRef(null);

  useEffect(() => {
    if (!result) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    primaryRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [result, onClose]);

  if (!result) return null;

  const success = result.type === "success";
  const renewsOn = success ? formatDate(result.endsAt) : null;
  const reactivated = success ? result.reactivatedCount || 0 : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm motion-safe:animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-result-title"
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl motion-safe:animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header band */}
        <div
          className={`relative h-32 overflow-hidden ${
            success
              ? "bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-500"
              : "bg-gradient-to-br from-rose-500 via-rose-500 to-orange-400"
          }`}
        >
          <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          {success &&
            CONFETTI.map((piece, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="absolute top-0 hidden rounded-sm motion-safe:block motion-safe:animate-confetti-fall"
                style={{
                  left: `${piece.left}%`,
                  width: piece.wide ? 10 : 6,
                  height: piece.wide ? 6 : 10,
                  backgroundColor: piece.color,
                  animationDelay: `${piece.delay}s`,
                }}
              />
            ))}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-full p-2 text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        {/* Status badge overlapping the header */}
        <div className="relative -mt-11 flex justify-center">
          <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-white shadow-xl ring-8 ring-white/60">
            <svg viewBox="0 0 52 52" className="h-14 w-14 motion-safe:animate-badge-pop" aria-hidden="true">
              <circle cx="26" cy="26" r="25" fill={success ? "#10b981" : "#f43f5e"} />
              {success ? (
                <path
                  d="M15 27l7 7 15-15"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="34"
                  className="motion-safe:animate-draw-check"
                />
              ) : (
                <path d="M18 18l16 16M34 18L18 34" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
              )}
            </svg>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 text-center sm:px-8 sm:pb-8">
          {success ? (
            <>
              <h2 id="payment-result-title" className="text-2xl font-bold text-gray-900">
                You&apos;re all set!
              </h2>
              <p className="mt-1.5 text-sm text-gray-600">
                Welcome to{" "}
                <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {planName}
                </span>
                . Thanks for subscribing.
              </p>

              {reactivated > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <FaBolt className="h-3 w-3" />
                  {reactivated} paused QR {reactivated === 1 ? "code is" : "codes are"} live again
                </div>
              )}

              <dl className="mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-gray-50/70 text-left text-sm">
                <SummaryRow label="Plan">{planName}</SummaryRow>
                <SummaryRow label="Price">{priceLabel}</SummaryRow>
                {renewsOn && <SummaryRow label="Renews on">{renewsOn}</SummaryRow>}
                {result.paymentId && (
                  <SummaryRow label="Payment ID">
                    <span className="font-mono text-xs">{result.paymentId}</span>
                  </SummaryRow>
                )}
              </dl>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
                <Link
                  href="/dashboard/create-qr"
                  ref={primaryRef}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold !text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
                >
                  Create a QR code
                </Link>
                <Link
                  href="/dashboard"
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold !text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-200"
                >
                  Go to dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 id="payment-result-title" className="text-2xl font-bold text-gray-900">
                {result.title}
              </h2>
              {result.message && <p className="mt-2 text-sm text-gray-600">{result.message}</p>}

              {(result.note || result.paymentId) && (
                <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-left text-xs text-amber-800">
                  {result.note && <p>{result.note}</p>}
                  {result.paymentId && (
                    <p className={result.note ? "mt-2" : ""}>
                      Payment ID: <span className="font-mono">{result.paymentId}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
                {onRetry && (
                  <button
                    type="button"
                    ref={primaryRef}
                    onClick={onRetry}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
                  >
                    <FaRedo className="h-3.5 w-3.5" />
                    Try again
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold !text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-200"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
