import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { FaCheck, FaHome, FaPaperPlane } from "react-icons/fa";
import PublicLayout from "@/components/layout/PublicLayout";
import SeoMeta from "@/components/layout/SeoMeta";
import { CONTACT_SENT_KEY, SUPPORT_EMAIL } from "@/lib/site";

// sessionStorage never changes while this page is open, so there's nothing to subscribe to
const noUpdates = () => () => {};
const readSent = () => {
  try {
    return sessionStorage.getItem(CONTACT_SENT_KEY);
  } catch {
    return null;
  }
};

/**
 * Where the contact form sends people once their message is saved (pages/contact.js). It isn't indexed, isn't in the sitemap
 * and nothing links to it, so a Tag Manager conversion can count visits to it. The sender's name and email come from
 * sessionStorage (never the address bar); opened directly, the page just says thanks. useSyncExternalStore reads it during the
 * first render after a page change, so the name doesn't pop in, and after a reload it fills in without a hydration error.
 */
export default function ContactThankYouPage() {
  const raw = useSyncExternalStore(noUpdates, readSent, () => null);
  const sent = useMemo(() => {
    try {
      const value = JSON.parse(raw || "null");
      return value?.email ? value : null;
    } catch {
      return null;
    }
  }, [raw]);
  const firstName = sent?.name?.trim().split(/\s+/)[0] || "";

  return (
    <PublicLayout>
      <SeoMeta title="Thanks for your message | QR-Genie" description="Your message has reached the QR-Genie team." path="/contact/thank-you" noindex />

      <div className="mx-auto w-full max-w-lg px-4 sm:px-0">
        <div className="rounded-2xl border border-indigo-100 bg-white/90 px-6 py-10 text-center shadow-xl sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-8 ring-emerald-50 motion-safe:animate-badge-pop">
            <FaCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-7 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{firstName ? `Thanks, ${firstName}` : "Thanks for your message"}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
            Your message has reached the QR-Genie team. We&apos;ll reply to{" "}
            {sent ? <span className="break-all font-medium text-gray-900">{sent.email}</span> : "the email address you gave us"}.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Something to add? Email us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="whitespace-nowrap font-medium !text-indigo-600 hover:!text-indigo-700">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="btn-shine flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold !text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-purple-700"
            >
              <FaHome className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>
            <Link
              href="/contact"
              className="btn-shine btn-shine-soft flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold !text-gray-700 transition hover:bg-gray-50"
            >
              <FaPaperPlane className="h-3.5 w-3.5" aria-hidden="true" />
              Send another message
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
