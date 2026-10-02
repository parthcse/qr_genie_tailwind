import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardLayout";
import { AuthInput, AuthSelect, AuthAlert, AuthSuccess, PasswordStrength, FieldTick } from "../../components/AuthShell";
import CodeInput, { emptyCode } from "../../components/CodeInput";
import {
  FaUser,
  FaEnvelope,
  FaEnvelopeOpenText,
  FaPhone,
  FaGlobe,
  FaEye,
  FaEyeSlash,
  FaBuilding,
  FaLock,
  FaMapMarkerAlt,
  FaCity,
  FaMap,
  FaHashtag,
  FaFlag,
  FaFileInvoice,
  FaIdCard,
  FaKey,
  FaLanguage,
  FaRedoAlt,
  FaShieldAlt,
} from "react-icons/fa";

// Server-side authentication check
export async function getServerSideProps(context) {
  const { getUserFromRequest, accountRedirect } = await import('../../lib/auth');
  const user = await getUserFromRequest(context.req);
  // Signed out -> login; email not confirmed yet -> verification page
  const redirect = accountRedirect(user);
  if (redirect) return redirect;
  return {
    props: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || null,
      },
    },
  };
}

const LANGUAGES = ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Chinese", "Japanese", "Korean", "Arabic"];

// Open blocks divided by a rule on phones (the dashboard card already frames them), cards from sm up
function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="border-t border-slate-100 pt-8 first:border-t-0 first:pt-0 motion-safe:animate-fade-up sm:rounded-2xl sm:border sm:border-slate-200/80 sm:bg-white sm:p-7 sm:shadow-sm sm:first:border-t sm:first:pt-7">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{description}</p>}
        </div>
      </div>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function SaveButton({ busy, children }) {
  return (
    <div className="flex pt-2 sm:justify-end">
      <button
        type="submit"
        disabled={busy}
        className="btn-shine flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-80 motion-reduce:transform-none sm:w-auto"
      >
        {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
        {busy ? "Saving…" : children}
      </button>
    </div>
  );
}

const EyeButton = ({ visible, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={visible ? "Hide password" : "Show password"}
    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
  >
    {visible ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
  </button>
);

/**
 * Pending email change: the code went to the new address; the sign-in email stays the same until it's entered.
 * onDone(newEmail) after a successful change, onCancel() after cancelling.
 */
function EmailChangePanel({ pending, currentEmail, onDone, onCancel }) {
  const [digits, setDigits] = useState(emptyCode());
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [wait, setWait] = useState(pending.resendIn || 0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const fail = (message) => {
    setError(message);
    setShakeKey((n) => n + 1);
  };

  const confirm = async (code) => {
    if (checking) return;
    setChecking(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/account/email-change", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.changed) return onDone(data.email);
      fail(data.error || "That code didn't work. Please try again.");
      setDigits(emptyCode());
      if (data.reason === "taken" || data.reason === "none") onCancel(data.error);
    } catch {
      fail("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setChecking(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/account/email-change", { method: "PUT" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNotice(`We've sent a new code to ${pending.pendingEmail}. The old one no longer works.`);
        setWait(data.resendIn || 60);
        setDigits(emptyCode());
      } else {
        if (data.retryAfter) setWait(data.retryAfter);
        fail(data.error || "We couldn't send a new code. Please try again.");
      }
    } catch {
      fail("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setResending(false);
    }
  };

  const cancel = async () => {
    await fetch("/api/account/email-change", { method: "DELETE" }).catch(() => {});
    onCancel();
  };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 p-5 motion-safe:animate-fade-up sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
          <FaEnvelopeOpenText className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">Confirm your new email</p>
          <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
            We sent a 6-digit code to <span className="font-semibold text-slate-900 [overflow-wrap:anywhere]">{pending.pendingEmail}</span>. Until you enter it, you
            keep signing in with <span className="font-medium text-slate-800 [overflow-wrap:anywhere]">{currentEmail}</span>.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <AuthAlert shakeKey={shakeKey}>{error}</AuthAlert>
        <AuthSuccess>{notice}</AuthSuccess>
        <div key={shakeKey} className={`max-w-md ${shakeKey ? "motion-safe:animate-shake" : ""}`}>
          <CodeInput digits={digits} setDigits={setDigits} disabled={checking} invalid={!!error} onComplete={confirm} size="sm" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => (digits.every(Boolean) ? confirm(digits.join("")) : fail("Enter all 6 digits of the code."))}
            disabled={checking}
            className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-wait disabled:opacity-80"
          >
            {checking && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
            {checking ? "Checking…" : "Confirm new email"}
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={wait > 0 || resending}
            className="btn-shine btn-shine-soft inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-200 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-slate-500 disabled:ring-slate-200 disabled:hover:bg-white"
          >
            <FaRedoAlt className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} aria-hidden="true" />
            {wait > 0 ? `Send a new code in ${wait}s` : resending ? "Sending…" : "Send a new code"}
          </button>
          <button type="button" onClick={cancel} className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-red-600">
            Cancel the change
          </button>
        </div>
        <p className="text-xs text-slate-500">The code expires after 10 minutes. Can&apos;t find it? Check the spam folder of the new address.</p>
      </div>
    </div>
  );
}

export default function AccountPage({ user: initialUser }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(router.query.tab === "billing" ? "billing" : "general");
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    if (router.query.tab === "billing") setActiveTab("billing");
  }, [router.query.tab]);

  // Personal information
  const [personalInfo, setPersonalInfo] = useState({
    firstName: (initialUser?.name || "").split(" ")[0] || "",
    lastName: (initialUser?.name || "").split(" ").slice(1).join(" ") || "",
    email: initialUser?.email || "",
    telephone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [emailChangePassword, setEmailChangePassword] = useState("");
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [personal, setPersonal] = useState({ busy: false, error: "", field: "", success: "", shake: 0 });
  const [pendingEmail, setPendingEmail] = useState(null); // { pendingEmail, resendIn }

  // Password
  const [passwordInfo, setPasswordInfo] = useState({ currentPassword: "", password: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [pw, setPw] = useState({ busy: false, error: "", field: "", success: "", shake: 0 });

  // Language
  const [language, setLanguage] = useState("English");
  const [lang, setLang] = useState({ busy: false, error: "", success: "", shake: 0 });

  // Billing details
  const [billingInfo, setBillingInfo] = useState({
    billingName: "",
    billingCompany: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingZipCode: "",
    billingCountry: "",
    taxId: "",
  });
  const [billing, setBilling] = useState({ busy: false, error: "", success: "", shake: 0 });

  // Load saved details and any email change waiting for its code
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const { user: u } = await res.json();
          if (u) {
            setUser(u);
            const nameParts = (u.name || "").split(" ");
            setPersonalInfo({
              firstName: nameParts[0] || "",
              lastName: nameParts.slice(1).join(" ") || "",
              email: u.email || "",
              telephone: u.telephone || "",
              company: u.company || "",
              address: u.address || "",
              city: u.city || "",
              state: u.state || "",
              zipCode: u.zipCode || "",
              country: u.country || "",
            });
            setLanguage(u.language || "English");
            setBillingInfo({
              billingName: u.billingName || "",
              billingCompany: u.billingCompany || "",
              billingAddress: u.billingAddress || "",
              billingCity: u.billingCity || "",
              billingState: u.billingState || "",
              billingZipCode: u.billingZipCode || "",
              billingCountry: u.billingCountry || "",
              taxId: u.taxId || "",
            });
          }
        }
        const change = await fetch("/api/account/email-change", { credentials: "include" });
        if (change.ok) {
          const data = await change.json();
          if (data.pendingEmail) setPendingEmail(data);
        }
      } catch (err) {
        console.error("Failed to load account details:", err);
      }
    })();
  }, []);

  const emailChanged = !!user?.email && personalInfo.email.trim().toLowerCase() !== user.email.toLowerCase();

  const onPersonal = (e) => {
    const { name, value } = e.target;
    setPersonalInfo((p) => ({ ...p, [name]: value }));
    setPersonal((s) => ({ ...s, error: "", field: "", success: "" }));
  };

  const savePersonal = async (e) => {
    e.preventDefault();
    if (emailChanged && !emailChangePassword) {
      setPersonal((s) => ({ ...s, error: "", field: "currentPassword", fieldMessage: "Enter your current password.", success: "" }));
      document.getElementById("emailChangePassword")?.focus();
      return;
    }
    setPersonal((s) => ({ ...s, busy: true, error: "", field: "", success: "" }));
    try {
      const res = await fetch("/api/account/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...personalInfo, language, currentPassword: emailChanged ? emailChangePassword : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const fieldError = data.field === "email" || data.field === "currentPassword";
        setPersonal((s) => ({ ...s, busy: false, error: fieldError ? "" : data.error || "We couldn't save your details.", field: data.field || "", fieldMessage: data.error, shake: s.shake + 1 }));
        if (data.field) document.getElementById(data.field === "currentPassword" ? "emailChangePassword" : data.field)?.focus();
        return;
      }
      if (data.user) setUser((u) => ({ ...u, ...data.user }));
      setEmailChangePassword("");
      if (data.emailChange) {
        // Not switched yet: the field goes back to the current address and the code panel opens
        setPendingEmail(data.emailChange);
        setPersonalInfo((p) => ({ ...p, email: data.user?.email || user.email }));
        setPersonal((s) => ({ ...s, busy: false, success: "Details saved. Enter the code we sent to your new email address to finish changing it." }));
      } else {
        setPersonal((s) => ({ ...s, busy: false, success: "Your details are saved." }));
      }
    } catch {
      setPersonal((s) => ({ ...s, busy: false, error: "We couldn't reach the server. Please try again.", shake: s.shake + 1 }));
    }
  };

  const onPassword = (e) => {
    const { name, value } = e.target;
    setPasswordInfo((p) => ({ ...p, [name]: value }));
    setPw((s) => ({ ...s, error: "", field: "", success: "" }));
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const field = !passwordInfo.currentPassword
      ? ["currentPassword", "Enter your current password."]
      : passwordInfo.password.length < 8
        ? ["password", "Use at least 8 characters."]
        : passwordInfo.password !== passwordInfo.confirmPassword
          ? ["confirmPassword", "The new passwords don't match."]
          : null;
    if (field) {
      setPw((s) => ({ ...s, field: field[0], fieldMessage: field[1], error: "", success: "" }));
      document.getElementById(field[0])?.focus();
      return;
    }
    setPw((s) => ({ ...s, busy: true, error: "", field: "", success: "" }));
    try {
      const res = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(passwordInfo),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPw((s) => ({ ...s, busy: false, error: data.error || "We couldn't update your password.", shake: s.shake + 1 }));
        return;
      }
      setPasswordInfo({ currentPassword: "", password: "", confirmPassword: "" });
      setPw((s) => ({ ...s, busy: false, success: "Password updated. You've been signed out on your other devices." }));
    } catch {
      setPw((s) => ({ ...s, busy: false, error: "We couldn't reach the server. Please try again.", shake: s.shake + 1 }));
    }
  };

  const saveLanguage = async (e) => {
    e.preventDefault();
    setLang((s) => ({ ...s, busy: true, error: "", success: "" }));
    try {
      const res = await fetch("/api/account/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ language }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLang((s) => ({ ...s, busy: false, error: data.error || "We couldn't save your language.", shake: s.shake + 1 }));
        return;
      }
      setLang((s) => ({ ...s, busy: false, success: "Language saved." }));
    } catch {
      setLang((s) => ({ ...s, busy: false, error: "We couldn't reach the server. Please try again.", shake: s.shake + 1 }));
    }
  };

  const onBilling = (e) => {
    const { name, value } = e.target;
    setBillingInfo((b) => ({ ...b, [name]: value }));
    setBilling((s) => ({ ...s, error: "", success: "" }));
  };

  const saveBilling = async (e) => {
    e.preventDefault();
    setBilling((s) => ({ ...s, busy: true, error: "", success: "" }));
    try {
      const res = await fetch("/api/account/billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(billingInfo),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBilling((s) => ({ ...s, busy: false, error: data.error || "We couldn't save your billing details.", shake: s.shake + 1 }));
        return;
      }
      if (data.user) setUser((u) => ({ ...u, ...data.user }));
      setBilling((s) => ({ ...s, busy: false, success: "Billing details saved." }));
    } catch {
      setBilling((s) => ({ ...s, busy: false, error: "We couldn't reach the server. Please try again.", shake: s.shake + 1 }));
    }
  };

  const personalField = (name) => (personal.field === name ? personal.fieldMessage || "Please check this field." : "");
  const pwField = (name) => (pw.field === name ? pw.fieldMessage : "");

  return (
    <DashboardLayout title="My Account" description="Manage your personal details, password and billing information.">
      {/* Tabs: full-width segmented control on phones */}
      <div role="tablist" aria-label="Account sections" className="mb-8 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 sm:mb-6 sm:w-fit sm:self-start">
        {[
          { id: "general", label: "General information" },
          { id: "billing", label: "Billing information" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              activeTab === tab.id ? "bg-white font-semibold text-indigo-700 shadow-sm" : "font-medium text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <div className="space-y-8 sm:space-y-6">
          <Section icon={FaIdCard} title="Personal information" description="Your name, contact details and the email you sign in with.">
            <AuthAlert shakeKey={personal.shake}>{personal.error}</AuthAlert>
            <AuthSuccess>{personal.success}</AuthSuccess>

            {pendingEmail && (
              <EmailChangePanel
                key={pendingEmail.pendingEmail}
                pending={pendingEmail}
                currentEmail={user?.email}
                onDone={(newEmail) => {
                  setUser((u) => ({ ...u, email: newEmail }));
                  setPersonalInfo((p) => ({ ...p, email: newEmail }));
                  setPendingEmail(null);
                  setPersonal((s) => ({ ...s, error: "", success: `Done. You now sign in with ${newEmail}. We've let your old address know.` }));
                }}
                onCancel={(message) => {
                  setPendingEmail(null);
                  setPersonal((s) => ({ ...s, success: message ? "" : "Email change cancelled. Your sign-in email hasn't changed.", error: message || "" }));
                }}
              />
            )}

            <form onSubmit={savePersonal} noValidate className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <AuthInput id="firstName" name="firstName" label="First name" icon={FaUser} autoComplete="given-name" maxLength={60} value={personalInfo.firstName} onChange={onPersonal} />
                <AuthInput id="lastName" name="lastName" label="Last name" icon={FaUser} autoComplete="family-name" maxLength={60} value={personalInfo.lastName} onChange={onPersonal} />
                <AuthInput
                  id="email"
                  name="email"
                  type="email"
                  label="Email"
                  icon={FaEnvelope}
                  autoComplete="email"
                  value={personalInfo.email}
                  onChange={onPersonal}
                  error={personalField("email")}
                  hint={emailChanged ? "We'll send a code to the new address to confirm it." : "The address you sign in with."}
                />
                <AuthInput id="telephone" name="telephone" type="tel" label="Phone" icon={FaPhone} autoComplete="tel" placeholder="+91 98765 43210" value={personalInfo.telephone} onChange={onPersonal} />
                <div className="md:col-span-2">
                  <AuthInput id="company" name="company" label="Company" icon={FaBuilding} autoComplete="organization" value={personalInfo.company} onChange={onPersonal} />
                </div>
                <div className="md:col-span-2">
                  <AuthInput id="address" name="address" label="Address" icon={FaMapMarkerAlt} autoComplete="street-address" placeholder="Street and number" value={personalInfo.address} onChange={onPersonal} />
                </div>
                <AuthInput id="city" name="city" label="City" icon={FaCity} autoComplete="address-level2" value={personalInfo.city} onChange={onPersonal} />
                <AuthInput id="state" name="state" label="State / province" icon={FaMap} autoComplete="address-level1" value={personalInfo.state} onChange={onPersonal} />
                <AuthInput id="zipCode" name="zipCode" label="ZIP / postal code" icon={FaHashtag} autoComplete="postal-code" value={personalInfo.zipCode} onChange={onPersonal} />
                <AuthInput id="country" name="country" label="Country" icon={FaFlag} autoComplete="country-name" value={personalInfo.country} onChange={onPersonal} />
              </div>

              {/* Changing the sign-in email needs the current password */}
              {emailChanged && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 motion-safe:animate-fade-up sm:p-5">
                  <div className="flex items-start gap-3">
                    <FaShieldAlt className="mt-0.5 h-4 w-4 flex-none text-amber-600" aria-hidden="true" />
                    <p className="text-sm text-amber-900">
                      You&apos;re changing the email you sign in with. Enter your current password; then we&apos;ll email a code to the new address.
                    </p>
                  </div>
                  <div className="mt-4 md:max-w-sm">
                    <AuthInput
                      id="emailChangePassword"
                      name="emailChangePassword"
                      type={showEmailPassword ? "text" : "password"}
                      label="Current password"
                      icon={FaLock}
                      autoComplete="current-password"
                      value={emailChangePassword}
                      onChange={(e) => {
                        setEmailChangePassword(e.target.value);
                        setPersonal((s) => ({ ...s, field: "", error: "" }));
                      }}
                      error={personalField("currentPassword")}
                      right={<EyeButton visible={showEmailPassword} onClick={() => setShowEmailPassword((v) => !v)} />}
                    />
                  </div>
                </div>
              )}

              <SaveButton busy={personal.busy}>{emailChanged ? "Save and send code" : "Save changes"}</SaveButton>
            </form>
          </Section>

          <Section icon={FaKey} title="Change password" description="Use at least 8 characters. Changing it signs you out on your other devices.">
            <AuthAlert shakeKey={pw.shake}>{pw.error}</AuthAlert>
            <AuthSuccess>{pw.success}</AuthSuccess>
            <form onSubmit={savePassword} noValidate className="space-y-5">
              <div className="md:max-w-[calc(50%-0.625rem)]">
                <AuthInput
                  id="currentPassword"
                  name="currentPassword"
                  type={show.current ? "text" : "password"}
                  label="Current password"
                  icon={FaLock}
                  autoComplete="current-password"
                  value={passwordInfo.currentPassword}
                  onChange={onPassword}
                  error={pwField("currentPassword")}
                  right={<EyeButton visible={show.current} onClick={() => setShow((v) => ({ ...v, current: !v.current }))} />}
                />
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <AuthInput
                    id="password"
                    name="password"
                    type={show.next ? "text" : "password"}
                    label="New password"
                    icon={FaLock}
                    autoComplete="new-password"
                    maxLength={128}
                    value={passwordInfo.password}
                    onChange={onPassword}
                    error={pwField("password")}
                    right={<EyeButton visible={show.next} onClick={() => setShow((v) => ({ ...v, next: !v.next }))} />}
                  />
                  <PasswordStrength password={passwordInfo.password} />
                </div>
                <AuthInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type={show.confirm ? "text" : "password"}
                  label="Confirm new password"
                  icon={FaLock}
                  autoComplete="new-password"
                  maxLength={128}
                  value={passwordInfo.confirmPassword}
                  onChange={onPassword}
                  error={pwField("confirmPassword")}
                  right={
                    <span className="flex items-center gap-1">
                      <FieldTick show={!!passwordInfo.confirmPassword && passwordInfo.confirmPassword === passwordInfo.password} />
                      <EyeButton visible={show.confirm} onClick={() => setShow((v) => ({ ...v, confirm: !v.confirm }))} />
                    </span>
                  }
                />
              </div>
              <SaveButton busy={pw.busy}>Update password</SaveButton>
            </form>
          </Section>

          <Section icon={FaLanguage} title="Language" description="The language for your account.">
            <AuthAlert shakeKey={lang.shake}>{lang.error}</AuthAlert>
            <AuthSuccess>{lang.success}</AuthSuccess>
            <form onSubmit={saveLanguage} className="space-y-5">
              <div className="md:max-w-sm">
                <AuthSelect
                  id="language"
                  label="Display language"
                  icon={FaGlobe}
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    setLang((s) => ({ ...s, success: "", error: "" }));
                  }}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </AuthSelect>
              </div>
              <SaveButton busy={lang.busy}>Save language</SaveButton>
            </form>
          </Section>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="space-y-8 sm:space-y-6">
          <Section icon={FaFileInvoice} title="Billing information" description="The name and address you'd like us to use for billing.">
            <AuthAlert shakeKey={billing.shake}>{billing.error}</AuthAlert>
            <AuthSuccess>{billing.success}</AuthSuccess>
            <form onSubmit={saveBilling} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <AuthInput id="billingName" name="billingName" label="Billing name" icon={FaUser} autoComplete="name" value={billingInfo.billingName} onChange={onBilling} />
                <AuthInput id="billingCompany" name="billingCompany" label="Billing company" icon={FaBuilding} autoComplete="organization" value={billingInfo.billingCompany} onChange={onBilling} />
                <div className="md:col-span-2">
                  <AuthInput id="billingAddress" name="billingAddress" label="Billing address" icon={FaMapMarkerAlt} autoComplete="street-address" placeholder="Street and number" value={billingInfo.billingAddress} onChange={onBilling} />
                </div>
                <AuthInput id="billingCity" name="billingCity" label="City" icon={FaCity} autoComplete="address-level2" value={billingInfo.billingCity} onChange={onBilling} />
                <AuthInput id="billingState" name="billingState" label="State / province" icon={FaMap} autoComplete="address-level1" value={billingInfo.billingState} onChange={onBilling} />
                <AuthInput id="billingZipCode" name="billingZipCode" label="ZIP / postal code" icon={FaHashtag} autoComplete="postal-code" value={billingInfo.billingZipCode} onChange={onBilling} />
                <AuthInput id="billingCountry" name="billingCountry" label="Country" icon={FaFlag} autoComplete="country-name" value={billingInfo.billingCountry} onChange={onBilling} />
                <div className="md:col-span-2">
                  <AuthInput id="taxId" name="taxId" label="Tax ID / VAT number" icon={FaFileInvoice} placeholder="Optional, e.g. GSTIN" value={billingInfo.taxId} onChange={onBilling} />
                </div>
              </div>
              <SaveButton busy={billing.busy}>Save billing details</SaveButton>
            </form>
          </Section>
        </div>
      )}
    </DashboardLayout>
  );
}
