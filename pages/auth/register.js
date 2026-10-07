import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheck, FaArrowRight, FaExclamationCircle } from "react-icons/fa";
import AuthShell, { AuthHeading, AuthInput, AuthAlert, AuthSubmit, AuthSwitch, PasswordStrength, FieldTick, passwordChecksPassed } from "@/components/auth/AuthShell";
import Turnstile from "@/components/auth/Turnstile";

// Cloudflare Turnstile bot check; skipped when no site key is configured
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const password = form.password.trim();
  const passed = passwordChecksPassed(password);
  return {
    name: form.name.trim().length < 2 ? "Enter your name (at least 2 characters)." : "",
    email: !form.email.trim() ? "Enter your email address." : !EMAIL_RE.test(form.email.trim()) ? "Enter a valid email address." : "",
    password: !password
      ? "Choose a password."
      : password.length < 8
        ? "Use at least 8 characters."
        : passed < 3
          ? "Mix letters, numbers and symbols (at least 3 of the 4 below)."
          : "",
    confirmPassword: !form.confirmPassword ? "Type your password again." : form.confirmPassword !== form.password ? "The passwords don't match." : "",
    terms: form.terms ? "" : "Please accept the Terms of Service and Privacy Policy to continue.",
  };
}

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", terms: false });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [termsShake, setTermsShake] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);

  // The shake re-creates the checkbox (new key), so focus it once it's back when it's the field to fix next
  const focusTerms = useRef(false);
  useEffect(() => {
    if (termsShake && focusTerms.current) {
      focusTerms.current = false;
      document.getElementById("terms")?.focus();
    }
  }, [termsShake]);

  const errors = validate(form);
  const show = (field) => serverErrors[field] || (touched[field] || submitted ? errors[field] : "");

  const update = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (serverErrors[field]) setServerErrors((s) => ({ ...s, [field]: "" }));
    if (error) setError("");
  };
  const blur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const password = form.password.trim();
  const matches = form.confirmPassword && form.confirmPassword === form.password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const firstInvalid = ["name", "email", "password", "confirmPassword", "terms"].find((f) => errors[f]);
    if (firstInvalid) {
      // The terms box always shakes when unticked; the cursor goes to the first field to fix
      if (errors.terms) {
        focusTerms.current = firstInvalid === "terms";
        setTermsShake((n) => n + 1);
      }
      if (firstInvalid !== "terms") document.getElementById(firstInvalid)?.focus();
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Please complete the security check above the Create account button.");
      setShakeKey((n) => n + 1);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password.trim(),
          acceptTerms: form.terms === true,
          website: honeypot,
          turnstileToken,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.error || "We couldn't create your account. Please try again.";
        if (/already exists/i.test(message)) {
          setServerErrors({ email: "An account with this email already exists." });
          document.getElementById("email")?.focus();
        } else if (data.field === "terms") {
          setServerErrors({ terms: message });
          focusTerms.current = true;
          setTermsShake((n) => n + 1);
        } else {
          setError(message);
          setShakeKey((n) => n + 1);
        }
        if (TURNSTILE_SITE_KEY) setTurnstileReset((n) => n + 1);
        setSubmitting(false);
        return;
      }
      // Next: the 6-digit code we just emailed
      router.push("/auth/verify-email");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setShakeKey((n) => n + 1);
      if (TURNSTILE_SITE_KEY) setTurnstileReset((n) => n + 1);
      setSubmitting(false);
    }
  };

  const eyeButton = (visible, toggle) => (
    <button
      type="button"
      onClick={toggle}
      aria-label={visible ? "Hide password" : "Show password"}
      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
    >
      {visible ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
    </button>
  );
  const termsError = show("terms");

  return (
    <AuthShell
      panel={{
        eyebrow: "Free for 14 days",
        title: "Make QR codes you can change any time",
        text: "No card needed. Three quick steps and your first code is ready.",
        steps: ["Create your account", "Confirm your email", "Make your first QR code"],
        activeStep: 0,
      }}
    >
      <Head>
        <title>Create your account | QR-Genie</title>
      </Head>
      <form onSubmit={handleSubmit} noValidate className="auth-stagger space-y-5">
        <AuthHeading title="Create your account">Start your free 14-day trial. No card needed.</AuthHeading>

        <AuthAlert shakeKey={shakeKey}>{error}</AuthAlert>

        <AuthInput
          id="name"
          name="name"
          type="text"
          label="Full name"
          required
          icon={FaUser}
          autoComplete="name"
          maxLength={100}
          placeholder="Your full name"
          value={form.name}
          onChange={update("name")}
          onBlur={blur("name")}
          error={show("name")}
        />

        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Email address"
          required
          icon={FaEnvelope}
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={update("email")}
          onBlur={blur("email")}
          error={show("email")}
          hint="We'll send a 6-digit code to confirm it."
        />

        <div>
          <AuthInput
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            required
            icon={FaLock}
            autoComplete="new-password"
            maxLength={128}
            value={form.password}
            onChange={update("password")}
            onBlur={blur("password")}
            error={show("password")}
            right={eyeButton(showPassword, () => setShowPassword((v) => !v))}
          />
          <PasswordStrength password={password} />
        </div>

        <AuthInput
          id="confirmPassword"
          name="confirmPassword"
          type={showConfirm ? "text" : "password"}
          label="Confirm password"
          required
          icon={FaLock}
          autoComplete="new-password"
          maxLength={128}
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          onBlur={blur("confirmPassword")}
          error={show("confirmPassword")}
          right={
            <span className="flex items-center gap-1">
              <FieldTick show={!!matches} />
              {eyeButton(showConfirm, () => setShowConfirm((v) => !v))}
            </span>
          }
        />

        {/* Terms: required; shakes and explains itself if skipped */}
        <div key={termsShake} className={termsShake ? "motion-safe:animate-shake" : ""}>
          <label
            htmlFor="terms"
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors duration-200 ${
              termsError ? "border-red-300 bg-red-50/60" : form.terms ? "border-indigo-200 bg-indigo-50/50" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="relative mt-0.5 flex h-5 w-5 flex-none">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={form.terms}
                onChange={update("terms")}
                onBlur={blur("terms")}
                aria-invalid={!!termsError}
                aria-describedby={termsError ? "terms-error" : undefined}
                className="peer absolute inset-0 h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 bg-white transition checked:border-indigo-600 checked:bg-indigo-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
              />
              <FaCheck className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 scale-0 text-white transition-transform duration-200 peer-checked:scale-100" aria-hidden="true" />
            </span>
            <span className="text-sm leading-relaxed text-slate-700">
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="font-medium !text-indigo-600 underline decoration-indigo-200 underline-offset-2 hover:!text-indigo-700">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="font-medium !text-indigo-600 underline decoration-indigo-200 underline-offset-2 hover:!text-indigo-700">
                Privacy Policy
              </Link>
              <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>
            </span>
          </label>
          {termsError && (
            <p id="terms-error" className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600 motion-safe:animate-fade-up">
              <FaExclamationCircle className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
              {termsError}
            </p>
          )}
        </div>

        {/* Hidden from people; bots that fill it in are refused */}
        <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="register-website">Website</label>
          <input id="register-website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        {TURNSTILE_SITE_KEY && <Turnstile siteKey={TURNSTILE_SITE_KEY} action="register" onToken={setTurnstileToken} resetKey={turnstileReset} />}

        <AuthSubmit busy={submitting} busyLabel="Creating your account…" icon={FaArrowRight}>
          Create account
        </AuthSubmit>

        <AuthSwitch text="Already have an account?" href="/auth/login" linkText="Log in" />
      </form>
    </AuthShell>
  );
}
