import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { FaEnvelopeOpenText, FaCheck, FaRedoAlt } from "react-icons/fa";
import AuthShell, { AuthHeading, AuthAlert } from "../../components/AuthShell";
import CodeInput, { CODE_LENGTH } from "../../components/CodeInput";

// Signed-in accounts whose email isn't confirmed yet land here (after sign-up, login, or any account page)
export async function getServerSideProps({ req }) {
  const { getUserFromRequest } = await import("../../lib/auth");
  const user = await getUserFromRequest(req);
  if (!user) return { redirect: { destination: "/auth/login", permanent: false } };
  if (user.emailVerified) return { redirect: { destination: "/dashboard", permanent: false } };

  const { default: prisma } = await import("../../lib/prisma");
  const { resendWaitSeconds } = await import("../../lib/emailVerification");
  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { emailCodeSentAt: true, emailCodeExpiresAt: true } });
  const codeExpired = !row?.emailCodeExpiresAt || new Date(row.emailCodeExpiresAt) < new Date();
  return { props: { email: user.email, initialWait: resendWaitSeconds(row?.emailCodeSentAt), codeExpired } };
}

const LENGTH = CODE_LENGTH;

export default function VerifyEmail({ email, initialWait, codeExpired }) {
  const router = useRouter();
  const [digits, setDigits] = useState(Array(LENGTH).fill(""));
  const [status, setStatus] = useState("idle"); // idle | checking | done
  const [error, setError] = useState(codeExpired ? "Your last code has expired. Send a new one below." : "");
  const [shakeKey, setShakeKey] = useState(0);
  const [wait, setWait] = useState(initialWait);
  const [notice, setNotice] = useState("");
  const [resending, setResending] = useState(false);

  // Resend countdown
  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  useEffect(() => {
    document.querySelector('[aria-label="Digit 1 of 6"]')?.focus();
  }, []);

  const verify = async (code) => {
    if (status !== "idle") return;
    setStatus("checking");
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.verified) {
        setStatus("done");
        setTimeout(() => router.push("/dashboard"), 1400);
        return;
      }
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      setError(data.error || "That code didn't work. Please try again.");
      setShakeKey((n) => n + 1);
      setDigits(Array(LENGTH).fill(""));
      setStatus("idle");
      setTimeout(() => document.querySelector('[aria-label="Digit 1 of 6"]')?.focus(), 50);
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setShakeKey((n) => n + 1);
      setStatus("idle");
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.verified) return router.push("/dashboard");
        setNotice(`We've sent a new code to ${email}. The old one no longer works.`);
        setWait(data.retryAfter || 60);
        setDigits(Array(LENGTH).fill(""));
        document.querySelector('[aria-label="Digit 1 of 6"]')?.focus();
      } else {
        if (data.retryAfter) setWait(data.retryAfter);
        setError(data.error || "We couldn't send a new code. Please try again.");
        setShakeKey((n) => n + 1);
      }
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setResending(false);
    }
  };

  const startOver = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/auth/register");
  };

  return (
    <AuthShell
      panel={{
        eyebrow: "Almost there",
        title: "One quick check, then you're in",
        text: "Confirming your email means your receipts, password resets and plan emails always reach you.",
        steps: ["Create your account", "Confirm your email", "Make your first QR code"],
        activeStep: status === "done" ? 2 : 1,
      }}
    >
      <Head>
        <title>Confirm your email | QR-Genie</title>
      </Head>

      {status === "done" ? (
        <div className="py-10 text-center" role="status">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl shadow-emerald-500/30 ring-8 ring-emerald-50 motion-safe:animate-badge-pop">
            <FaCheck className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-8 text-2xl font-bold tracking-[-0.01em] text-slate-900 motion-safe:animate-fade-up">Email confirmed</h1>
          <p className="mt-2 text-slate-600 motion-safe:animate-fade-up">Taking you to your dashboard…</p>
        </div>
      ) : (
        <div className="auth-stagger space-y-6">
          <div className="relative w-fit">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
              <FaEnvelopeOpenText className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="absolute -right-1 -top-1 flex h-4 w-4" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 ring-2 ring-white" />
            </span>
          </div>

          <AuthHeading title="Check your email">
            We sent a 6-digit code to <span className="font-semibold text-slate-900 [overflow-wrap:anywhere]">{email}</span>. Enter it below to finish
            creating your account.
          </AuthHeading>

          <AuthAlert shakeKey={shakeKey}>{error}</AuthAlert>
          {notice && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 motion-safe:animate-fade-up" role="status">
              {notice}
            </p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (digits.every(Boolean)) verify(digits.join(""));
              else setError("Enter all 6 digits of the code.");
            }}
            noValidate
          >
            <div key={shakeKey} className={shakeKey ? "motion-safe:animate-shake" : ""}>
              <CodeInput digits={digits} setDigits={setDigits} disabled={status !== "idle"} invalid={!!error} onComplete={verify} />
            </div>
            <button
              type="submit"
              disabled={status !== "idle"}
              className="btn-shine mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-80 motion-reduce:transform-none"
            >
              {status === "checking" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                  Checking…
                </>
              ) : (
                "Confirm email"
              )}
            </button>
          </form>

          <div className="rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-600 ring-1 ring-inset ring-slate-200/70">
            <p>The code expires after 10 minutes. Can&apos;t find it? Check your spam or promotions folder.</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={resend}
                disabled={wait > 0 || resending}
                className="btn-shine btn-shine-soft inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-200 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-slate-500 disabled:ring-slate-200 disabled:hover:bg-white"
              >
                <FaRedoAlt className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} aria-hidden="true" />
                {wait > 0 ? `Send a new code in ${wait}s` : resending ? "Sending…" : "Send a new code"}
              </button>
              <button type="button" onClick={startOver} className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-indigo-700">
                Wrong email? Start again
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
