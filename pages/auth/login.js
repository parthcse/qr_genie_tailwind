import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight } from "react-icons/fa";
import AuthShell, { AuthHeading, AuthInput, AuthAlert, AuthSubmit, AuthSwitch } from "../../components/AuthShell";
import Turnstile from "../../components/Turnstile";

// Cloudflare Turnstile bot check; skipped when no site key is configured
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const router = useRouter();
  const emailRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const errors = {
    email: !email.trim() ? "Enter your email address." : !EMAIL_RE.test(email.trim()) ? "Enter a valid email address." : "",
    password: !password ? "Enter your password." : "",
  };
  const show = (field) => (touched[field] ? errors[field] : "");

  const fail = (message) => {
    setError(message);
    setShakeKey((n) => n + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (errors.email || errors.password) {
      document.getElementById(errors.email ? "email" : "password")?.focus();
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      fail("Please complete the security check above the Sign in button.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: email.trim(), password: password.trim(), turnstileToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        fail(res.status === 401 ? "That email and password don't match. Please try again." : data.error || "We couldn't sign you in. Please try again.");
        if (TURNSTILE_SITE_KEY) setTurnstileReset((n) => n + 1);
        setSubmitting(false);
        return;
      }
      // Accounts that haven't confirmed their email finish that first
      router.push(data.emailVerified === false ? "/auth/verify-email" : "/dashboard");
    } catch {
      fail("We couldn't reach the server. Check your connection and try again.");
      if (TURNSTILE_SITE_KEY) setTurnstileReset((n) => n + 1);
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      panel={{
        eyebrow: "Welcome back",
        title: "Your QR codes, always up to date",
        text: "Change where your codes point, see who scans them, and keep every campaign on track.",
        points: ["Edit links after printing", "See scans by day, place and device", "Password-protect private pages"],
      }}
    >
      <Head>
        <title>Log in | QR-Genie</title>
      </Head>
      <form onSubmit={handleSubmit} noValidate className="auth-stagger space-y-6">
        <AuthHeading title="Welcome back">Log in to manage your QR codes.</AuthHeading>

        <AuthAlert shakeKey={shakeKey}>{error}</AuthAlert>

        <AuthInput
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          label="Email address"
          icon={FaEnvelope}
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={show("email")}
        />

        <AuthInput
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          label="Password"
          icon={FaLock}
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError("");
          }}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          error={show("password")}
          labelAction={
            <Link href="/auth/forgot-password" className="text-sm font-medium !text-indigo-600 hover:!text-indigo-700">
              Forgot password?
            </Link>
          }
          right={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
            </button>
          }
        />

        {TURNSTILE_SITE_KEY && <Turnstile siteKey={TURNSTILE_SITE_KEY} action="login" onToken={setTurnstileToken} resetKey={turnstileReset} />}

        <AuthSubmit busy={submitting} busyLabel="Signing in…" icon={FaArrowRight}>
          Sign in
        </AuthSubmit>

        <AuthSwitch text="New to QR-Genie?" href="/auth/register" linkText="Create an account" />
      </form>
    </AuthShell>
  );
}
