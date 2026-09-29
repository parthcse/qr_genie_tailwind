import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaEnvelope, FaReceipt, FaFileAlt, FaCheck } from "react-icons/fa";
import PublicLayout from "../components/PublicLayout";
import Turnstile from "../components/Turnstile";
import { useCurrentUser } from "../lib/useCurrentUser";
import { SUPPORT_EMAIL, CONTACT_TOPICS } from "../lib/site";

const MAX_MESSAGE = 5000;
// Cloudflare Turnstile; the check is skipped when no site key is configured
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const inputClass = (invalid) =>
  `block w-full rounded-xl border bg-white px-4 py-3 text-base text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:outline-none focus:ring-4 sm:text-sm ${
    invalid
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100"
  }`;

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

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors((errs) => ({ ...errs, [field]: undefined }));
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

  return (
    <PublicLayout session={session} centered={false}>
      <Head>
        <title>Contact us | QR-Genie</title>
        <meta name="description" content="Questions about QR-Genie, billing or your account? Send us a message and we'll reply by email." />
      </Head>

      <div className="mx-auto grid w-full max-w-site gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-16 lg:px-8 lg:py-6">
        {/* How to reach us */}
        <section aria-labelledby="contact-heading" className="lg:pt-4">
          <h1 id="contact-heading" className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Contact us
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-gray-600">
            Questions about your QR codes, billing or your account? Send us a message and we&apos;ll reply by email.
          </p>

          <dl className="mt-10 space-y-7">
            <div className="flex gap-4">
              <dt className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                <FaEnvelope className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Email</span>
              </dt>
              <dd>
                <p className="text-sm font-semibold text-gray-900">Email us directly</p>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-0.5 inline-block text-sm font-medium !text-indigo-600 hover:!text-indigo-700">
                  {SUPPORT_EMAIL}
                </a>
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                <FaReceipt className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Billing</span>
              </dt>
              <dd>
                <p className="text-sm font-semibold text-gray-900">Billing, cancellations and refunds</p>
                <p className="mt-0.5 max-w-sm text-sm leading-relaxed text-gray-600">
                  Write from the email you signed up with, and include the payment ID if you have one.
                </p>
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                <FaFileAlt className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Policies</span>
              </dt>
              <dd>
                <p className="text-sm font-semibold text-gray-900">Our policies</p>
                <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <Link href="/refund-policy" className="font-medium !text-indigo-600 hover:!text-indigo-700">Refund policy</Link>
                  <Link href="/terms" className="font-medium !text-indigo-600 hover:!text-indigo-700">Terms of service</Link>
                  <Link href="/privacy" className="font-medium !text-indigo-600 hover:!text-indigo-700">Privacy policy</Link>
                </p>
              </dd>
            </div>
          </dl>
        </section>

        {/* Form */}
        <section aria-label="Contact form" className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-xl shadow-indigo-900/5 sm:p-10">
          {sentTo ? (
            <div className="py-10 text-center" role="status">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
                <FaCheck className="h-5 w-5" />
              </div>
              <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">Message sent</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
                Thanks{sentTo.name ? `, ${sentTo.name}` : ""}. We&apos;ll reply to <span className="font-medium text-gray-900">{sentTo.email}</span>.
              </p>
              <button
                type="button"
                onClick={() => setSentTo(null)}
                className="mt-8 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2 className="text-lg font-semibold text-gray-900">Send us a message</h2>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-gray-700">Your name</label>
                  <input
                    id="contact-name"
                    type="text"
                    autoComplete="name"
                    maxLength={100}
                    value={form.name}
                    onChange={update("name")}
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
                    className={inputClass(fieldErrors.name)}
                  />
                  <FieldError id="contact-name-error" message={fieldErrors.name} />
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    autoComplete="email"
                    maxLength={200}
                    value={form.email}
                    onChange={update("email")}
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
                    className={inputClass(fieldErrors.email)}
                  />
                  <FieldError id="contact-email-error" message={fieldErrors.email} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="contact-topic" className="mb-1.5 block text-sm font-medium text-gray-700">What&apos;s it about?</label>
                  <select id="contact-topic" value={form.topic} onChange={update("topic")} className={inputClass(false)}>
                    {CONTACT_TOPICS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <div className="mb-1.5 flex items-baseline justify-between gap-4">
                    <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700">Message</label>
                    <span className="text-xs tabular-nums text-gray-400" aria-hidden="true">
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
                className="mt-7 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sending ? "Sending…" : "Send message"}
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
