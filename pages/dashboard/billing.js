import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PaymentResultModal from "@/components/billing/PaymentResultModal";
import CancelSubscriptionModal from "@/components/billing/CancelSubscriptionModal";
import { FaCheck, FaPlus } from "react-icons/fa";
import { formatPrice, formatPeriod, formatPlanPrice } from "@/lib/billing/price";
import { TRIAL_PLAN_FEATURES, BASIC_PLAN_FEATURES } from "@/lib/site";

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

const TRIAL_DAYS = 14;

// Pricing plans data - Free Trial and Basic Package. The Basic price comes from Razorpay (/api/billing/plans).
const pricingPlans = [
  {
    id: "TRIAL",
    name: "Free Trial",
    description: "Try every feature before you pay.",
    period: "for 14 days",
    features: TRIAL_PLAN_FEATURES,
  },
  {
    id: "BASIC",
    name: "Basic Package",
    description: "Unlimited QR codes for your business.",
    features: BASIC_PLAN_FEATURES,
  },
];

// FAQ data; priceText is the Basic price in the currency being shown, e.g. "₹399 per month"
const buildFaqItems = (priceText) => [
  {
    id: 1,
    question: "How does billing work?",
    answer: `${priceText ? `The Basic Package costs ${priceText}. ` : ""}You pay when you subscribe, and the same amount is charged automatically on that date each month. Your next renewal date is always shown on this page.`,
  },
  {
    id: 2,
    question: "Which payment methods can I use?",
    answer: "Payments are processed securely by Razorpay. In India you pay in rupees and can use the Indian cards and other methods Razorpay offers at checkout. Outside India you pay in US dollars with a card that allows international payments; if it's declined, check that setting with your bank.",
  },
  {
    id: 3,
    question: "How do I cancel?",
    answer: (
      <>
        Choose <strong className="font-semibold text-gray-900">Cancel subscription</strong> on your plan card at the top of
        this page. You keep the Basic Package until the end of the month you&apos;ve already paid for, and you won&apos;t be
        charged again. If you&apos;d rather we do it,{" "}
        <Link href="/contact?topic=cancel" className="font-medium !text-indigo-600 hover:!text-indigo-700">contact us</Link>.
      </>
    ),
  },
  {
    id: 4,
    question: "What happens to my QR codes if my plan ends?",
    answer: "They're paused: anyone who scans them sees a short notice instead of your link. Subscribe again and they work straight away with the same links, so nothing needs reprinting. If a renewal payment is late, your codes keep working for 3 more days while it goes through.",
  },
  {
    id: 5,
    question: "Can I get a refund?",
    answer: (
      <>
        Yes. If you cancel partway through a month,{" "}
        <Link href="/contact?topic=refund" className="font-medium !text-indigo-600 hover:!text-indigo-700">contact us</Link> and
        we&apos;ll refund the days you haven&apos;t used. The{" "}
        <Link href="/refund-policy" className="font-medium !text-indigo-600 hover:!text-indigo-700">refund policy</Link> has
        the details.
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

function MembershipPass({ planName, priceText, renewsOn, cancelled, onCancel }) {
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
            <dt className="text-xs text-indigo-300">QR codes</dt>
            <dd className="mt-1 text-lg font-semibold">Unlimited</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm text-indigo-200">
          <p>
            {cancelled && renewsOn ? `Changed your mind? You can subscribe again from ${renewsOn}. ` : ""}
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

function TrialProgress({ daysLeft }) {
  const pct = Math.max(4, Math.min(100, (daysLeft / TRIAL_DAYS) * 100));
  return (
    <section aria-label="Your free trial" className="rounded-2xl border border-indigo-100 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900">Free trial</h2>
        <p className="text-sm tabular-nums text-gray-600">
          {daysLeft} of {TRIAL_DAYS} days left
        </p>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-indigo-100"
        role="progressbar"
        aria-label="Trial days left"
        aria-valuemin={0}
        aria-valuemax={TRIAL_DAYS}
        aria-valuenow={daysLeft}
      >
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-sm text-gray-600">Subscribe before your trial ends to keep your QR codes working.</p>
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
      <p className="mt-1 text-sm text-amber-800">Your QR codes are paused. Subscribe to Basic to switch them back on.</p>
    </section>
  );
}

function FeatureList({ features, tone }) {
  return (
    <ul className="space-y-3">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
          <span
            className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full ${
              tone === "brand" ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-500"
            }`}
          >
            <FaCheck className="h-2.5 w-2.5" />
          </span>
          {feature}
        </li>
      ))}
    </ul>
  );
}

function PlanPrice({ amount, period }) {
  return (
    <p className="mt-6 flex min-h-[3rem] items-baseline gap-2">
      {amount ? (
        <>
          <span className="text-5xl font-bold tracking-tight text-gray-900 tabular-nums">{amount}</span>
          <span className="text-sm text-gray-500">{period}</span>
        </>
      ) : (
        <span className="h-12 w-28 animate-pulse rounded-lg bg-gray-100" aria-hidden="true" />
      )}
    </p>
  );
}

export default function BillingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [buyingPlan, setBuyingPlan] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState(null);
  // When the subscription was cancelled (it then runs to subscriptionEndsAt and won't renew)
  const [cancelledAt, setCancelledAt] = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  // Razorpay shows its own failure screen with a retry; we only report the failure once the user closes checkout
  const lastPaymentFailure = useRef(null);
  const closePaymentResult = useCallback(() => setPaymentResult(null), []);
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

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setSubscriptionStatus(data.subscriptionStatus || { status: "NONE", daysLeft: null });
          if (data.user) {
            setSubscriptionEndsAt(data.user.subscriptionEndsAt || null);
            setCancelledAt(data.user.subscriptionCancelledAt || null);
            setBillingInfo({
              billingName: data.user.billingName || "",
              billingCompany: data.user.billingCompany || "",
              billingAddress: data.user.billingAddress || "",
              billingCity: data.user.billingCity || "",
              billingState: data.user.billingState || "",
              billingZipCode: data.user.billingZipCode || "",
              billingCountry: data.user.billingCountry || "",
              taxId: data.user.taxId || "",
            });
          }
        } else {
          setSubscriptionStatus({ status: "NONE", daysLeft: null });
        }
      } catch (e) {
        setSubscriptionStatus({ status: "NONE", daysLeft: null });
      }
    };
    fetchMe();
  }, []);

  // Basic Package price straight from the Razorpay plans, in the currency set by location (rupees in India, dollars elsewhere)
  const [plans, setPlans] = useState(null);
  const [currentCurrency, setCurrentCurrency] = useState(null);
  const [currency, setCurrency] = useState(null);

  const loadPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/plans", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setPlans(data.plans || {});
      setCurrentCurrency(data.currentCurrency || null);
      setCurrency(data.currency || null);
    } catch (e) {
      console.error("Failed to load prices:", e);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

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

  const handleBuyNow = async (plan) => {
    if (plan !== "BASIC") return;
    setBuyingPlan(plan);
    setPaymentResult(null);
    lastPaymentFailure.current = null;
    try {
      const createRes = await fetch("/api/checkout/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currency }),
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
        setBuyingPlan(null);
        return;
      }

      await loadRazorpayScript();

      const options = {
        key: checkout.keyId,
        subscription_id: checkout.subscriptionId,
        name: checkout.name || "QR Genie",
        description: checkout.description || "Basic Package",
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

            let endsAt = null;
            const meRes = await fetch("/api/auth/me", { credentials: "include" });
            if (meRes.ok) {
              const meData = await meRes.json();
              setSubscriptionStatus(meData.subscriptionStatus || { status: "NONE", daysLeft: null });
              endsAt = meData.user?.subscriptionEndsAt || null;
              setSubscriptionEndsAt(endsAt);
            }
            setCurrentCurrency(currency);
            setPaymentResult({
              type: "success",
              paymentId: response.razorpay_payment_id,
              endsAt,
              reactivatedCount: verifyData.reactivatedCount || 0,
            });
          } finally {
            setBuyingPlan(null);
          }
        },
        modal: {
          ondismiss: function () {
            setBuyingPlan(null);
            const failure = lastPaymentFailure.current;
            if (failure) {
              lastPaymentFailure.current = null;
              setPaymentResult({
                type: "error",
                title: "Payment didn't go through",
                message: failure.description || "Your payment could not be completed.",
                note: "If any amount was deducted, it will be refunded to you automatically.",
                paymentId: failure.metadata?.payment_id,
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
      });
      setBuyingPlan(null);
    }
  };

  const [trialPlan, basicPlan] = pricingPlans;
  const status = subscriptionStatus?.status;
  const statusLoaded = subscriptionStatus !== null;
  const isSubscribed = status === "SUBSCRIPTION_ACTIVE";
  const isTrial = status === "TRIAL_ACTIVE";
  const daysLeft = subscriptionStatus?.daysLeft ?? 0;
  const renewsOn = formatDate(subscriptionEndsAt);

  // Prices: the currency for this location, or for subscribers the one they pay in
  const shownCurrency = (isSubscribed && currentCurrency) || currency;
  const shownPlan = plans && shownCurrency ? plans[shownCurrency] : null;
  const shownPriceText = formatPlanPrice(shownPlan);
  const basicAmount = shownPlan ? formatPrice(shownPlan.amount, shownPlan.currency) : plans ? "—" : null;
  const basicPeriod = shownPlan ? formatPeriod(shownPlan.period, shownPlan.interval) : "";
  const trialAmount = plans ? formatPrice(0, shownCurrency || "USD") : null;
  const faqItems = buildFaqItems(shownPriceText);

  const addressLines = [
    billingInfo.billingAddress,
    [billingInfo.billingCity, billingInfo.billingState, billingInfo.billingZipCode].filter(Boolean).join(", "),
    billingInfo.billingCountry,
  ].filter(Boolean);
  const hasBillingInfo = billingInfo.billingName || billingInfo.billingCompany || addressLines.length > 0 || billingInfo.taxId;

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
            planName={basicPlan.name}
            priceText={shownPriceText}
            renewsOn={renewsOn}
            cancelled={!!cancelledAt}
            onCancel={() => setShowCancel(true)}
          />
        )}
        {isTrial && <TrialProgress daysLeft={daysLeft} />}
        {statusLoaded && !isSubscribed && !isTrial && <PlanEndedNotice status={status} />}

        {/* Plans */}
        <section aria-labelledby="plans-heading">
          <h2 id="plans-heading" className="text-lg font-semibold text-gray-900">Plans</h2>
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white/70 p-6 sm:p-7">
              <h3 className="text-base font-semibold text-gray-900">{trialPlan.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{trialPlan.description}</p>
              <PlanPrice amount={trialAmount} period={trialPlan.period} />
              <div className="mt-6 rounded-xl bg-gray-50 px-4 py-3 text-center text-sm font-medium text-gray-600">
                {!statusLoaded
                  ? " "
                  : isTrial
                  ? "Your current plan"
                  : isSubscribed
                  ? "You've upgraded to Basic"
                  : "Trial ended"}
              </div>
              <div className="mt-6 border-t border-gray-100 pt-6">
                <FeatureList features={trialPlan.features} tone="muted" />
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 p-[1.5px] shadow-lg shadow-indigo-500/10">
              <div className="flex h-full flex-col rounded-[14.5px] bg-white p-6 sm:p-7">
                <h3 className="text-base font-semibold text-gray-900">{basicPlan.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{basicPlan.description}</p>
                <PlanPrice amount={basicAmount} period={basicPeriod} />
                {isSubscribed ? (
                  <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <FaCheck className="h-3 w-3" />
                    {renewsOn ? `Active, renews on ${renewsOn}` : "Active"}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleBuyNow("BASIC")}
                    disabled={!statusLoaded || !shownPlan || buyingPlan !== null}
                    className="btn-shine mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {buyingPlan === "BASIC" ? "Opening checkout…" : "Subscribe to Basic"}
                  </button>
                )}
                {!isSubscribed && (
                  <p className="mt-3 text-center text-xs leading-relaxed text-gray-500">
                    By subscribing you agree to our{" "}
                    <Link href="/terms" className="font-medium !text-gray-600 underline decoration-gray-300 underline-offset-2 hover:!text-indigo-700">terms</Link>
                    {" "}and{" "}
                    <Link href="/refund-policy" className="font-medium !text-gray-600 underline decoration-gray-300 underline-offset-2 hover:!text-indigo-700">refund policy</Link>.
                  </p>
                )}
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <FeatureList features={basicPlan.features} tone="brand" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Billing details */}
        <section aria-labelledby="billing-details-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="billing-details-heading" className="text-lg font-semibold text-gray-900">Billing details</h2>
            <Link
              href="/dashboard/account?tab=billing"
              className="text-sm font-medium !text-indigo-600 hover:!text-indigo-700"
            >
              {hasBillingInfo ? "Edit details" : "Add billing details"}
            </Link>
          </div>
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7">
            {hasBillingInfo ? (
              <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                {billingInfo.billingName && (
                  <div>
                    <dt className="text-sm text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{billingInfo.billingName}</dd>
                  </div>
                )}
                {billingInfo.billingCompany && (
                  <div>
                    <dt className="text-sm text-gray-500">Company</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{billingInfo.billingCompany}</dd>
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
                {billingInfo.taxId && (
                  <div>
                    <dt className="text-sm text-gray-500">Tax ID</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{billingInfo.taxId}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-gray-500">No billing details saved yet.</p>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="pb-4">
          <h2 id="faq-heading" className="text-lg font-semibold text-gray-900">Questions about billing</h2>
          <div className="mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
            {faqItems.map((item) => {
              const open = openFaq === item.id;
              return (
                <div key={item.id} className={`transition-colors ${open ? "bg-indigo-50/40" : ""} first:rounded-t-2xl last:rounded-b-2xl`}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => toggleFaq(item.id)}
                      aria-expanded={open}
                      aria-controls={`faq-answer-${item.id}`}
                      className="group flex w-full items-center justify-between gap-6 px-5 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400 sm:px-7 sm:py-6"
                    >
                      <span className={`text-base font-medium ${open ? "text-indigo-800" : "text-gray-900 group-hover:text-indigo-700"}`}>
                        {item.question}
                      </span>
                      <span
                        className={`flex h-8 w-8 flex-none items-center justify-center rounded-full border transition duration-300 motion-reduce:transition-none ${
                          open
                            ? "rotate-45 border-indigo-200 bg-white text-indigo-600"
                            : "border-gray-200 text-gray-400 group-hover:border-indigo-200 group-hover:text-indigo-600"
                        }`}
                      >
                        <FaPlus className="h-3 w-3" />
                      </span>
                    </button>
                  </h3>
                  <div
                    id={`faq-answer-${item.id}`}
                    aria-hidden={!open}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-[95%] px-5 pb-6 text-sm leading-relaxed text-gray-600 sm:px-7">{item.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <CancelSubscriptionModal
        open={showCancel}
        endsOn={renewsOn || "the end of your paid period"}
        onClose={() => setShowCancel(false)}
        onCancelled={() => setCancelledAt(new Date().toISOString())}
      />
      <PaymentResultModal
        result={paymentResult}
        planName={basicPlan.name}
        priceLabel={shownPriceText}
        onClose={closePaymentResult}
        onRetry={() => handleBuyNow("BASIC")}
      />
    </DashboardLayout>
  );
}
