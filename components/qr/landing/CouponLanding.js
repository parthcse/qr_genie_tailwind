import { useState } from "react";
import { FaCheck, FaRegCopy, FaTicket } from "react-icons/fa6";
import { landingTheme } from "@/lib/qr/landingThemes";
import { offerEnded } from "@/lib/qr/qrContent";
import LandingShell, { LandingAvatar, Part } from "./LandingShell";

// "31 December 2026"; a fixed locale and time zone so the server and the phone show the same text
const formatDay = (day) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/**
 * "Coupon" page: the business, the offer as a ticket with a code to copy, the end date (and "ended" after it), a button
 * to use the offer and the terms. content: the cleaned coupon content (lib/qr/qrContent.js).
 */
export default function CouponLanding({ content = {}, preview = false }) {
  const theme = landingTheme(content.theme);
  const [copied, setCopied] = useState(false);
  const ended = offerEnded(content.validUntil);

  const copy = async () => {
    if (preview || !content.code) return;
    try {
      await navigator.clipboard.writeText(content.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the code is on screen to copy by hand */
    }
  };

  return (
    <LandingShell themeId={content.theme} preview={preview}>
      {(content.brand || content.avatar) && (
        <Part content={content} fields={["brand", "avatar"]}>
          <div className="flex flex-col items-center text-center">
            {content.avatar && (
              <div className="scale-75">
                <LandingAvatar image={content.avatar} title={content.brand} themeId={content.theme} />
              </div>
            )}
            {content.brand && <p className="text-sm font-semibold" style={{ color: theme.muted }}>{content.brand}</p>}
          </div>
        </Part>
      )}

      <article className={`mt-5 overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl shadow-black/15 ${ended ? "opacity-80" : ""}`}>
        <div className="px-6 pb-6 pt-7 text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
            <FaTicket className="h-3 w-3" aria-hidden="true" />
            Special offer
          </p>
          <Part content={content} fields="headline">
            <h1 className="mt-4 break-words font-display text-3xl font-bold leading-tight tracking-tight">{content.headline}</h1>
          </Part>
          {content.description && (
            <Part content={content} fields="description">
              <p className="mt-2 whitespace-pre-line break-words text-[15px] leading-relaxed text-slate-600">{content.description}</p>
            </Part>
          )}
        </div>

        <div className="mx-6 border-t-2 border-dashed border-slate-200" aria-hidden="true" />

        <div className="px-6 pb-6 pt-5 text-center">
          {content.code && (
            <Part content={content} fields="code">
            <div className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-2 pl-4">
              <span className="min-w-0 flex-1 truncate text-left font-mono text-xl font-bold tracking-[0.12em]">{content.code}</span>
              <button
                type="button"
                onClick={copy}
                className="inline-flex flex-none items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {copied ? <FaCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <FaRegCopy className="h-3.5 w-3.5" aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            </Part>
          )}
          {content.validUntil && (
            <Part content={content} fields="validUntil">
              <p className={`mt-3 text-sm font-medium ${ended ? "text-rose-600" : "text-slate-500"}`}>
                {ended ? `This offer ended on ${formatDay(content.validUntil)}` : `Valid until ${formatDay(content.validUntil)}`}
              </p>
            </Part>
          )}
          {content.buttonUrl && !ended && (
            preview ? (
              <Part content={content} fields={["buttonUrl", "buttonText"]}>
                <span className="mt-5 block rounded-2xl px-5 py-3.5 text-[15px] font-semibold text-white" style={{ background: theme.background }}>
                  {content.buttonText || "Use the offer"}
                </span>
              </Part>
            ) : (
              <a
                href={content.buttonUrl}
                rel="noopener noreferrer nofollow"
                className="mt-5 block rounded-2xl px-5 py-3.5 text-[15px] font-semibold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: theme.background, color: "#ffffff" }}
              >
                {content.buttonText || "Use the offer"}
              </a>
            )
          )}
        </div>
      </article>

      {content.terms && (
        <Part content={content} fields="terms">
          <details className="mt-5 rounded-2xl px-4 py-3 text-sm" style={{ color: theme.muted, background: "rgba(255,255,255,0.12)" }}>
            <summary className="cursor-pointer font-semibold">Terms and conditions</summary>
            <p className="mt-2 whitespace-pre-line break-words leading-relaxed">{content.terms}</p>
          </details>
        </Part>
      )}
    </LandingShell>
  );
}
