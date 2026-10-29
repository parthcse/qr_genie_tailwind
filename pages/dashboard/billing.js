import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PaymentResultModal from "@/components/billing/PaymentResultModal";
import CancelSubscriptionModal from "@/components/billing/CancelSubscriptionModal";
import PricingCards, { PaymentMethods } from "@/components/landing/PricingCards";
import { FaCheck } from "react-icons/fa";
import { FaqList } from "@/components/landing/LandingUi";
import { formatPrice, formatBilled, formatMonthly } from "@/lib/billing/price";
import { termById, planNameFor } from "@/lib/billing/terms";
import { TRIAL_DAYS } from "@/lib/billing/subscription";
import { PAID_PLAN_FEATURES } from "@/lib/site";

// Server-side authentication check
export async function getServerSideProps(context) {
  const { getUserFromRequest, accountRedirect } = await import('@/lib/auth');
  const user = await getUserFromRequest(context.req);
  // Signed out -> login; email not confirmed yet -> verification page
  const redirect = accountRedirect(user);
  if (redirect) return redirect;
  return {
    props: {},
  };
}

const linkClass = "font-medium !text-indigo-600 hover:!text-indigo-700";

// Billing questions shown at the bottom of the page
const faqItems = [
  {
    question: "How does billing work?",
    answer: "Choose 3, 6 or 12 months. You pay for those months upfront, and the plan renews automatically for the same length until you cancel. Every plan has the same features; the longer the plan, the lower the monthly price. Your next renewal date is always shown on this page.",
  },
  {
    question: "If I subscribe during my free trial, do I lose my free days?",
    answer: `No. You pay when you subscribe, but your paid months only start when your ${TRIAL_DAYS} free days end. Cancel before then and we refund you in full.`,
  },
  {
    question: "Which payment methods can I use?",
    answer: "Payments are processed securely by Razorpay. In India you pay in rupees with a Visa, Mastercard or RuPay card, UPI AutoPay or net banking; the options at checkout depend on your plan and bank. Outside India you pay in US dollars with a Visa or Mastercard card that allows international payments; if it's declined, check that setting with your bank.",
  },
  {
    question: "How do I cancel?",
    answer: (
      <>
        Choose <strong className="font-semibold text-gray-900">Cancel subscription</strong> on your plan card at the top of
        this page. Your plan won&apos;t renew, and you keep it until the end of the period you&apos;ve paid for. If you&apos;d
        rather we do it, <Link href="/contact?topic=cancel" className={linkClass}>contact us</Link>.
      </>
    ),
  },
  {
    question: "What happens to my QR codes if my plan ends?",
    answer: "They're paused: anyone who scans them sees a short notice instead of your link. Subscribe again and they work straight away with the same links, so nothing needs reprinting. If a renewal payment is late, your codes keep working for 3 more days while it goes through.",
  },
  {
    question: "Can I get a refund?",
    answer: (
      <>
        If you cancel during your free days, before your paid months start, we refund you in full automatically. After that,
        cancelling stops the next renewal and your plan runs to the end of the period you&apos;ve paid for, without a refund.
        Charged by mistake? <Link href="/contact?topic=refund" className={linkClass}>Contact us</Link> and we&apos;ll refund it
        in full. The <Link href="/refund-policy" className={linkClass}>refund policy</Link> has the details.
      </>
    ),
  },
];

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// QR-code texture for the membership pass: three finder patterns plus a scatter of modules
const QR_SIZE = 25;
const inFinder = (x, y) => (x < 8 && y < 8) || (x > QR_SIZE - 9 && y < 8) || (x < 8 && y > QR_SIZE - 9);
const QR_MODULES = [];
for (let y = 0; y < QR_SIZE; y++) {
  for (let x = 0; x < QR_SIZE; x++) {
    if (!inFinder(x, y) && (x * 7 + y * 13 + x * y) % 5 < 2) QR_MODULES.push([x, y]);
  }
}
const QR_FINDERS = [[0, 0], [QR_SIZE - 7, 0], [0, QR_SIZE - 7]];

function QrMotif({ className }) {
  return (
    <svg viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`} className={className} aria-hidden="true" fill="currentColor">
      {QR_FINDERS.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x + 0.5} y={y + 0.5} width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x={x + 2} y={y + 2} width="3" height="3" />
        </g>
      ))}
      {QR_MODULES.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + 0.08} y={y + 0.08} width="0.84" height="0.84" />
      ))}
    </svg>
  );
}

function MembershipPass({ planName, priceText, startsOn, renewsOn, cancelled, onCancel }) {
  return (
    <section
      aria-label="Your subscription"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 p-6 text-white shadow-xl shadow-indigo-900/20 sm:p-8"
    >
      <QrMotif className="pointer-events-none absolute -right-8 -top-8 h-60 w-60 text-white/[0.13] [mask-image:linear-gradient(to_bottom_left,black_30%,transparent_80%)] sm:h-72 sm:w-72" />
      <div className="relative">
        {cancelled ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-medium text-amber-200 ring-1 ring-inset ring-amber-300/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            Cancelled
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Active
          </span>
        )}
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{planName}</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-indigo-200">
          {cancelled
            ? "Your plan is cancelled and won't renew. Everything keeps working until the end date; after that your QR codes are paused."
            : startsOn
            ? `Your free days carry on until ${startsOn}, then your paid months begin. Cancel before then for a full refund.`
            : "Create as many QR codes as you need. Your printed codes keep working while your plan is active."}
        </p>
        <dl className="mt-8 grid grid-cols-1 gap-5 border-t border-white/10 pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-indigo-300">{cancelled ? "Ends on" : "Renews on"}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{renewsOn || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-indigo-300">Price</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{priceText || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-indigo-300">{startsOn ? "Paid months start" : "QR codes"}</dt>
            <dd className="mt-1 text-lg font-semibold">{startsOn || "Unlimited"}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm text-indigo-200">
          <p>
            {cancelled && renewsOn ? `Changed your mind? You can choose a new plan from ${renewsOn}. ` : ""}
            Billing question?{" "}
            <Link href="/contact?topic=billing" className="font-semibold !text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
              Contact us
            </Link>
          </p>
          {!cancelled && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md text-sm font-medium text-indigo-200 underline decoration-indigo-300/40 underline-offset-4 transition hover:text-white hover:decoration-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Cancel subscription
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function TrialProgress({ daysLeft, endsOn }) {
  // Accounts from before the trial was shortened keep their longer trial
  const total = Math.max(TRIAL_DAYS, daysLeft);
  const pct = Math.max(4, Math.min(100, (daysLeft / total) * 100));
  return (
    <section aria-label="Your free trial" className="rounded-2xl border border-indigo-100 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900">Free trial</h2>
        <p className="text-sm tabular-nums text-gray-600">
          {daysLeft} {daysLeft === 1 ? "day" : "days"} left{endsOn ? `, until ${endsOn}` : ""}
        </p>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-indigo-100"
        role="progressbar"
        aria-label="Trial days left"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={daysLeft}
      >
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-sm text-gray-600">
        Choose a plan whenever you&apos;re ready: your paid months start when your free days end, so you don&apos;t lose any.
      </p>
    </section>
  );
}

function PlanEndedNotice({ status }) {
  const title =
    status === "TRIAL_EXPIRED"
      ? "Your free trial has ended"
      : status === "SUBSCRIPTION_EXPIRED"
      ? "Your subscription has ended"
      : "You don't have an active plan";
  return (
    <section aria-label="Plan status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-amber-900">{title}</h2>
      <p className="mt-1 text-sm text-amber-800">Your QR codes are paused. Choose a plan below to switch them back on.</p>
    </section>
  );
}

export default function BillingPage() {
  const router = useRouter();
  const [buyingTerm, setBuyingTerm] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [account, setAccount] = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  // Razorpay shows its own failure screen with a retry; we only report the failure once the user closes checkout
  const lastPaymentFailure = useRef(null);
  const autoCheckoutDone = useRef(false);
  const closePaymentResult = useCallback(() => setPaymentResult(null), []);

  const loadAccount = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSubscriptionStatus(data.subscriptionStatus || { status: "NONE", daysLeft: null });
        setAccount(data.user || null);
      } else {
        setSubscriptionStatus({ status: "NONE", daysLeft: null });
      }
    } catch (e) {
      setSubscriptionStatus({ status: "NONE", daysLeft: null });
    }
  }, []);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  // Plan prices straight from the Razorpay plans, in the currency set by location (rupees in India, dollars elsewhere)
  const [plans, setPlans] = useState(null);
  const [current, setCurrent] = useState(null);
  const [currency, setCurrency] = useState(null);

  const loadPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/plans", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setPlans(data.plans || {});
      setCurrent(data.current || null);
      setCurrency(data.currency || null);
    } catch (e) {
      console.error("Failed to load prices:", e);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  function loadRazorpayScript() {
    if (typeof window !== "undefined" && window.Razorpay) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Razorpay Checkout"));
      document.body.appendChild(s);
    });
  }

  const handleBuyNow = async (term) => {
    if (!termById(term)) return;
    setBuyingTerm(term);
    setPaymentResult(null);
    lastPaymentFailure.current = null;
    try {
      const createRes = await fetch("/api/checkout/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currency, term }),
      });
      const checkout = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        // 409: the price shown is for another location (e.g. a VPN was switched on); show the right one
        if (createRes.status === 409) loadPlans();
        setPaymentResult({
          type: "error",
          title: "Couldn't start checkout",
          message: checkout.error || "Please try again in a moment.",
        });
        setBuyingTerm(null);
        return;
      }

      await loadRazorpayScript();

      const options = {
        key: checkout.keyId,
        subscription_id: checkout.subscriptionId,
        name: checkout.name || "QR Genie",
        description: checkout.description || termById(term).planName,
        prefill: checkout.prefill || {},
        handler: async function (response) {
          lastPaymentFailure.current = null;
          try {
            const verifyRes = await fetch("/api/checkout/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok) {
              setPaymentResult({
                type: "error",
                title: "We couldn't confirm your payment",
                message: verifyData.error || "Payment verification failed.",
                note: "If you were charged, your plan will switch on automatically within a few minutes. If it doesn't, contact support with the payment ID below.",
                paymentId: response.razorpay_payment_id,
              });
              return;
            }

            await Promise.all([loadAccount(), loadPlans()]);
            const meRes = await fetch("/api/auth/me", { credentials: "include" });
            const endsAt = meRes.ok ? (await meRes.json()).user?.subscriptionEndsAt || null : null;
            setPaymentResult({
              type: "success",
              term,
              paymentId: response.razorpay_payment_id,
              startsAt: verifyData.startsAt || null,
              endsAt,
              reactivatedCount: verifyData.reactivatedCount || 0,
            });
          } finally {
            setBuyingTerm(null);
          }
        },
        modal: {
          ondismiss: function () {
            setBuyingTerm(null);
            const failure = lastPaymentFailure.current;
            if (failure) {
              lastPaymentFailure.current = null;
              setPaymentResult({
                type: "error",
                title: "Payment didn't go through",
                message: failure.description || "Your payment could not be completed.",
                note: "If any amount was deducted, it will be refunded to you automatically.",
                paymentId: failure.metadata?.payment_id,
                term,
              });
            }
          },
        },
        theme: { color: "#6366f1" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        lastPaymentFailure.current = resp.error || {};
      });
      rzp.open();
    } catch (e) {
      console.error(e);
      setPaymentResult({
        type: "error",
        title: "Couldn't start checkout",
        message: e?.message || "Please try again in a moment.",
        term,
      });
      setBuyingTerm(null);
    }
  };

  const status = subscriptionStatus?.status;
  const statusLoaded = subscriptionStatus !== null;
  const isSubscribed = status === "SUBSCRIPTION_ACTIVE";
  const isTrial = status === "TRIAL_ACTIVE";
  const daysLeft = subscriptionStatus?.daysLeft ?? 0;
  const cancelled = !!account?.subscriptionCancelledAt;
  const renewsOn = formatDate(account?.subscriptionEndsAt);
  // Bought during the free days: the paid months start later (and cancelling before then is refunded in full)
  const startsAt = isSubscribed && account?.subscriptionStartedAt && new Date(account.subscriptionStartedAt) > new Date() ? account.subscriptionStartedAt : null;

  // Prices: the currency for this location, or for subscribers the one they pay in
  const shownCurrency = (isSubscribed && current?.currency) || currency;
  const prices = plans && shownCurrency ? plans[shownCurrency] || null : null;
  const currentPlan = isSubscribed && current ? plans?.[current.currency]?.[current.term] || null : null;
  const planName = planNameFor(account?.subscriptionMonths || currentPlan?.months);
  const priceText = currentPlan ? formatBilled(currentPlan) : null;

  // "Subscribe" on the pricing page sends people here with ?plan=12m: open that checkout once everything has loaded
  useEffect(() => {
    const term = typeof router.query.plan === "string" ? router.query.plan : null;
    if (!term || autoCheckoutDone.current || !statusLoaded || !prices || !termById(term)) return;
    autoCheckoutDone.current = true;
    router.replace("/dashboard/billing", undefined, { shallow: true });
    if (!isSubscribed && prices[term]) handleBuyNow(term);
    // handleBuyNow is recreated each render; running once per visit is what matters here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.plan, statusLoaded, prices, isSubscribed]);

  const paidTerm = paymentResult?.term ? termById(paymentResult.term) : null;
  const paidPlan = paymentResult?.term && prices ? prices[paymentResult.term] : null;

  return (
    <DashboardLayout title="" description="">
      <div className="mx-auto w-full max-w-5xl space-y-12 px-1 py-2 sm:px-4 sm:py-4">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Billing</h1>
          <p className="mt-1 text-sm text-gray-600">
            {isSubscribed ? "Your plan, renewal date and billing details." : "Choose a plan to keep your QR codes working."}
          </p>
        </header>

        {/* Plan status */}
        {!statusLoaded && <div className="h-40 animate-pulse rounded-3xl bg-indigo-50" />}
        {isSubscribed && (
          <MembershipPass
            planName={planName}
            priceText={priceText}
            startsOn={formatDate(startsAt)}
            renewsOn={renewsOn}
            cancelled={cancelled}
            onCancel={() => setShowCancel(true)}
          />
        )}
        {isTrial && <TrialProgress daysLeft={daysLeft} endsOn={formatDate(account?.trialEndsAt)} />}
        {statusLoaded && !isSubscribed && !isTrial && <PlanEndedNotice status={status} />}

        {/* Plans */}
        <section aria-labelledby="plans-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="plans-heading" className="text-lg font-semibold text-gray-900">Plans</h2>
            <p className="text-sm text-gray-500">Every plan has every feature. Prices include 18% GST.</p>
          </div>
          <PricingCards
            prices={prices}
            currentUser={account}
            onSelect={handleBuyNow}
            busyTerm={buyingTerm}
            currentTerm={isSubscribed ? current?.term : null}
            disabled={!statusLoaded || isSubscribed}
          />
          {!isSubscribed && <PaymentMethods currency={shownCurrency || undefined} className="mt-10" />}
          <div className="mx-auto mt-8 max-w-3xl text-center text-sm text-gray-500">
            {isSubscribed ? (
              <p>
                {cancelled
                  ? `You can choose a new plan from ${renewsOn || "the end of your current plan"}.`
                  : "To switch to a longer or shorter plan, cancel this one and choose the new plan when it ends."}
              </p>
            ) : (
              <p>
                You pay upfront for the months you choose; the plan renews for the same length until you cancel. By subscribing
                you agree to our{" "}
                <Link href="/terms" className="font-medium !text-gray-600 underline decoration-gray-300 underline-offset-2 hover:!text-indigo-700">terms</Link>
                {" "}and{" "}
                <Link href="/refund-policy" className="font-medium !text-gray-600 underline decoration-gray-300 underline-offset-2 hover:!text-indigo-700">refund policy</Link>.
              </p>
            )}
          </div>
          <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
            {PAID_PLAN_FEATURES.map((feature) => (
              <li key={feature} className="inline-flex items-center gap-2">
                <FaCheck className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
        </section>

        {/* Billing details */}
        <section aria-labelledby="billing-details-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="billing-details-heading" className="text-lg font-semibold text-gray-900">Billing details</h2>
            <Link
              href="/dashboard/account?tab=billing"
              className="text-sm font-medium !text-indigo-600 hover:!text-indigo-700"
            >
              {account && (account.billingName || account.billingCompany || account.billingAddress || account.taxId) ? "Edit details" : "Add billing details"}
            </Link>
          </div>
          <BillingDetails account={account} />
        </section>

        {/* FAQ: the same accordion as the public pages */}
        <section aria-labelledby="faq-heading" className="pb-4">
          <h2 id="faq-heading" className="text-lg font-semibold text-gray-900">Questions about billing</h2>
          <FaqList faqs={faqItems} className="mt-5" />
        </section>
      </div>

      <CancelSubscriptionModal
        open={showCancel}
        endsOn={renewsOn || "the end of your paid period"}
        refund={
          startsAt
            ? { amount: currentPlan ? formatPrice(currentPlan.amount, currentPlan.currency) : null, freeDaysEndOn: formatDate(startsAt) }
            : null
        }
        onClose={() => setShowCancel(false)}
        onCancelled={() => {
          loadAccount();
          loadPlans();
        }}
      />
      <PaymentResultModal
        result={paymentResult}
        planName={paidTerm?.planName || planName}
        priceLabel={paidPlan ? `${formatBilled(paidPlan)} (${formatMonthly(paidPlan)})` : priceText}
        onClose={closePaymentResult}
        onRetry={() => paymentResult?.term && handleBuyNow(paymentResult.term)}
      />
    </DashboardLayout>
  );
}

function BillingDetails({ account }) {
  const addressLines = account
    ? [
        account.billingAddress,
        [account.billingCity, account.billingState, account.billingZipCode].filter(Boolean).join(", "),
        account.billingCountry,
      ].filter(Boolean)
    : [];
  const hasBillingInfo = account && (account.billingName || account.billingCompany || addressLines.length > 0 || account.taxId);

  return (
    <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7">
      {hasBillingInfo ? (
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          {account.billingName && (
            <div>
              <dt className="text-sm text-gray-500">Name</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{account.billingName}</dd>
            </div>
          )}
          {account.billingCompany && (
            <div>
              <dt className="text-sm text-gray-500">Company</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{account.billingCompany}</dd>
            </div>
          )}
          {addressLines.length > 0 && (
            <div>
              <dt className="text-sm text-gray-500">Address</dt>
              <dd className="mt-1 text-sm font-medium leading-relaxed text-gray-900">
                {addressLines.map((line) => (
                  <span key={line} className="block">{line}</span>
                ))}
              </dd>
            </div>
          )}
          {account.taxId && (
            <div>
              <dt className="text-sm text-gray-500">Tax ID</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{account.taxId}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="text-sm text-gray-500">No billing details saved yet.</p>
      )}
    </div>
  );
}
