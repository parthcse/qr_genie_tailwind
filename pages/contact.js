import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FaEnvelope,
  FaReceipt,
  FaFileAlt,
  FaCheck,
  FaCopy,
  FaPaperPlane,
  FaUser,
  FaQuestionCircle,
  FaCreditCard,
  FaTimesCircle,
  FaUndo,
  FaTools,
  FaUserShield,
  FaInfoCircle,
} from "react-icons/fa";
import PublicLayout from "@/components/layout/PublicLayout";
import Turnstile from "@/components/auth/Turnstile";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { SUPPORT_EMAIL, CONTACT_TOPICS } from "@/lib/site";

const MAX_MESSAGE = 5000;
// Cloudflare Turnstile; the check is skipped when no site key is configured
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const TOPIC_ICONS = {
  general: FaQuestionCircle,
  billing: FaCreditCard,
  cancel: FaTimesCircle,
  refund: FaUndo,
  technical: FaTools,
  privacy: FaUserShield,
};

// Shown under the topics that need something specific from the sender
const PAYMENT_TIP = "Write from the email you signed up with, and include the payment ID if you have one.";
const TOPIC_TIPS = {
  billing: PAYMENT_TIP,
  cancel: "You can cancel yourself any time: Billing, then Cancel subscription on your plan card. If you can't sign in, write from the email you signed up with.",
  refund: PAYMENT_TIP,
  technical: "Tell us which QR code it is (its name or short link) and what happened.",
};

const inputClass = (invalid) =>
  `block w-full rounded-xl border bg-white px-4 py-3 text-base text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:outline-none focus:ring-4 sm:text-sm ${
    invalid
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-gray-300 hover:border-gray-400 focus:border-indigo-500 focus:ring-indigo-100"
  }`;

// Icon chip used on the info cards; fills with the brand gradient when its card is hovered
const iconChip =
  "flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 ring-1 ring-inset ring-indigo-100 transition-colors duration-300 group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white group-hover:ring-transparent";
const infoCard =
  "group rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-200/80 transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:ring-indigo-200 motion-reduce:transform-none";

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-red-600">
      {message}
    </p>
  );
}

export default function ContactPage() {
  const router = useRouter();
  const session = useCurrentUser();
  const [form, setForm] = useState({ name: "", email: "", topic: CONTACT_TOPICS[0].value, message: "", website: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(null);

  // Pre-fill from the signed-in account and from ?topic= (e.g. links from billing)
  useEffect(() => {
    if (session.user) {
      setForm((f) => ({
        ...f,
        name: f.name || session.user.name || "",
        email: f.email || session.user.email || "",
      }));
    }
  }, [session.user]);

  useEffect(() => {
    if (!router.isReady) return;
    const topic = router.query.topic;
    if (typeof topic === "string" && CONTACT_TOPICS.some((t) => t.value === topic)) {
      setForm((f) => ({ ...f, topic }));
    }
  }, [router.isReady, router.query.topic]);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the address is still shown and clickable
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Please complete the security check above the Send button.");
      return;
    }
    setSending(true);
    setError("");
    setFieldErrors({});
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFieldErrors(data.fields || {});
        setError(data.error || `We couldn't send your message. Please email us at ${SUPPORT_EMAIL}.`);
        return;
      }
      setSentTo({ name: form.name.trim(), email: form.email.trim() });
      setForm((f) => ({ ...f, message: "" }));
    } catch {
      setError(`We couldn't send your message. Please email us at ${SUPPORT_EMAIL}.`);
    } finally {
      setSending(false);
      // Each Turnstile token works once, so get a fresh one for the next attempt
      if (TURNSTILE_SITE_KEY) setTurnstileReset((n) => n + 1);
    }
  };

  const tip = TOPIC_TIPS[form.topic];

  return (
    <PublicLayout session={session} centered={false}>
      <Head>
        <title>Contact us | QR-Genie</title>
        <meta name="description" content="Questions about QR-Genie, billing or your account? Send us a message and we'll reply by email." />
      </Head>

      <div className="mx-auto grid w-full max-w-site grid-cols-[minmax(0,1fr)] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16 lg:px-8 lg:py-6">
        {/* How to reach us */}
        <section aria-labelledby="contact-heading" className="lg:pt-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-100">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" aria-hidden="true" />
            Contact
          </span>
          <h1 id="contact-heading" className="mt-5 text-4xl font-bold tracking-[-0.02em] text-gray-900 sm:text-5xl">
            Contact us
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-gray-600 sm:text-lg">
            Questions about your QR codes, billing or your account? Send us a message and we&apos;ll reply by email.
          </p>

          <ul className="mt-9 space-y-4">
            <li className={infoCard}>
              <div className="flex items-start gap-4">
                <span className={iconChip}>
                  <FaEnvelope className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">Email us directly</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="break-all text-sm font-medium !text-indigo-600 hover:!text-indigo-700">
                      {SUPPORT_EMAIL}
                    </a>
                    <button
                      type="button"
                      onClick={copyEmail}
                      className="btn-shine btn-shine-soft inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                      {copied ? <FaCheck className="h-3 w-3" aria-hidden="true" /> : <FaCopy className="h-3 w-3" aria-hidden="true" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <span className="sr-only" aria-live="polite">{copied ? "Email address copied" : ""}</span>
                  </div>
                </div>
              </div>
            </li>
            <li className={infoCard}>
              <div className="flex items-start gap-4">
                <span className={iconChip}>
                  <FaReceipt className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Billing, cancellations and refunds</p>
                  <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-600">{PAYMENT_TIP}</p>
                </div>
              </div>
            </li>
            <li className={infoCard}>
              <div className="flex items-start gap-4">
                <span className={iconChip}>
                  <FaFileAlt className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Our policies</p>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <Link href="/refund-policy" className="font-medium !text-indigo-600 hover:!text-indigo-700">Refund policy</Link>
                    <Link href="/terms" className="font-medium !text-indigo-600 hover:!text-indigo-700">Terms of service</Link>
                    <Link href="/privacy" className="font-medium !text-indigo-600 hover:!text-indigo-700">Privacy policy</Link>
                  </p>
                </div>
              </div>
            </li>
          </ul>
        </section>

        {/* Form */}
        <section aria-label="Contact form" className="relative rounded-3xl bg-white px-4 py-6 shadow-xl shadow-indigo-900/[0.06] ring-1 ring-indigo-100 sm:p-10">
          <div className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent" aria-hidden="true" />

          {sentTo ? (
            <div className="py-8 text-center sm:py-12" role="status">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-8 ring-emerald-50 motion-safe:animate-badge-pop">
                <FaCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="mt-7 text-2xl font-bold tracking-tight text-gray-900">Message sent</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
                Thanks{sentTo.name ? `, ${sentTo.name}` : ""}. We&apos;ll reply to <span className="font-medium text-gray-900">{sentTo.email}</span>.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSentTo(null)}
                  className="btn-shine btn-shine-soft rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Send another message
                </button>
                <Link
                  href="/"
                  className="btn-shine rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold !text-white shadow-md shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-purple-700"
                >
                  Back to home
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Send us a message</h2>
                  <p className="mt-1 text-sm text-gray-600">We&apos;ll reply by email.</p>
                </div>
                <span
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                  aria-hidden="true"
                >
                  <FaPaperPlane className="h-4 w-4" />
                </span>
              </div>

              {error && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}

              <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-gray-700">Your name</label>
                  <div className="relative">
                    <FaUser className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                    <input
                      id="contact-name"
                      type="text"
                      autoComplete="name"
                      maxLength={100}
                      value={form.name}
                      onChange={update("name")}
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
                      className={`${inputClass(fieldErrors.name)} pl-10`}
                    />
                  </div>
                  <FieldError id="contact-name-error" message={fieldErrors.name} />
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                  <div className="relative">
                    <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                    <input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      maxLength={200}
                      value={form.email}
                      onChange={update("email")}
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
                      className={`${inputClass(fieldErrors.email)} pl-10`}
                    />
                  </div>
                  <FieldError id="contact-email-error" message={fieldErrors.email} />
                </div>

                {/* Topic as tappable cards (radio buttons underneath) */}
                <fieldset className="sm:col-span-2">
                  <legend className="mb-2 block text-sm font-medium text-gray-700">What&apos;s it about?</legend>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {CONTACT_TOPICS.map((t) => {
                      const Icon = TOPIC_ICONS[t.value] || FaQuestionCircle;
                      const selected = form.topic === t.value;
                      return (
                        <label
                          key={t.value}
                          className={`group flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition duration-200 focus-within:ring-4 focus-within:ring-indigo-100 ${
                            selected
                              ? "border-indigo-500 bg-indigo-50/70 font-semibold text-indigo-800 shadow-sm"
                              : "border-gray-200 bg-white font-medium text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/30"
                          }`}
                        >
                          <input type="radio" name="topic" value={t.value} checked={selected} onChange={update("topic")} className="sr-only" />
                          <span
                            className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg transition-colors ${
                              selected ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white" : "bg-gray-100 text-gray-500 group-hover:text-indigo-600"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          <span className="leading-tight">{t.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {tip && (
                    <p className="mt-3 flex items-start gap-2 rounded-xl bg-indigo-50/70 px-3.5 py-2.5 text-sm text-indigo-900 ring-1 ring-inset ring-indigo-100">
                      <FaInfoCircle className="mt-0.5 h-3.5 w-3.5 flex-none text-indigo-500" aria-hidden="true" />
                      {tip}
                    </p>
                  )}
                </fieldset>

                <div className="sm:col-span-2">
                  <div className="mb-1.5 flex items-baseline justify-between gap-4">
                    <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700">Message</label>
                    <span className="text-xs tabular-nums text-gray-500" aria-hidden="true">
                      {form.message.length} / {MAX_MESSAGE}
                    </span>
                  </div>
                  <textarea
                    id="contact-message"
                    rows={6}
                    maxLength={MAX_MESSAGE}
                    value={form.message}
                    onChange={update("message")}
                    aria-invalid={!!fieldErrors.message}
                    aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
                    className={`${inputClass(fieldErrors.message)} resize-y`}
                  />
                  <FieldError id="contact-message-error" message={fieldErrors.message} />
                </div>
                {/* Hidden from people; bots that fill it in are ignored */}
                <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
                  <label htmlFor="contact-website">Website</label>
                  <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={update("website")} />
                </div>
              </div>

              {TURNSTILE_SITE_KEY && (
                <div className="mt-6">
                  <Turnstile siteKey={TURNSTILE_SITE_KEY} action="contact" onToken={setTurnstileToken} resetKey={turnstileReset} />
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="btn-shine group mt-7 flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-500/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send message
                    <FaPaperPlane
                      className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-1 motion-reduce:transform-none"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>
              <p className="mt-4 text-center text-xs text-gray-500">
                We only use your details to reply. See our{" "}
                <Link href="/privacy" className="font-medium !text-gray-600 underline decoration-gray-300 underline-offset-2 hover:!text-indigo-700">
                  privacy policy
                </Link>
                .
              </p>
            </form>
          )}
        </section>
      </div>
    </PublicLayout>
  );
}
