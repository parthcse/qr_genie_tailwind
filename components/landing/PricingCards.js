import Link from "next/link";
import {
  FaArrowRight,
  FaCalendarCheck,
  FaChartLine,
  FaCheck,
  FaDownload,
  FaEnvelope,
  FaFileInvoice,
  FaFolderOpen,
  FaInfinity,
  FaLock,
  FaPalette,
  FaPause,
  FaQrcode,
  FaShapes,
  FaUniversity,
} from "react-icons/fa";
import { SiVisa } from "react-icons/si";
import { formatPrice, monthlyAmount, savingsFor } from "@/lib/billing/price";
import { PLAN_TERMS, BEST_VALUE_TERM } from "@/lib/billing/terms";
import { TRIAL_DAYS } from "@/lib/billing/subscription";
import { releasedTypeNames } from "@/lib/qr/qrTypes";

// Desktop shows 3 | 12 | 6 months with the best value in the middle; phones list the best value first
const ORDER = { "12m": "md:order-2", "6m": "md:order-3", "3m": "md:order-1" };
const PHONE_ORDER = ["12m", "6m", "3m"];

/**
 * The paid plans as cards: 3, 6 and 12 months, the price per month, what's billed and how often, and the saving.
 * The 12-month plan is the featured "Best value" card.
 * - prices: the visitor's plans by term ({ "3m", "6m", "12m" }: { currency, amount, months, term }), or null while loading
 * - currentUser: signed-in visitor ({ subscriptionPlan }), or null; decides where the buttons go on public pages
 * - onSelect(term): billing page; the buttons then start checkout instead of linking. busyTerm: the one opening checkout.
 * - currentTerm: the plan the customer is on, when subscribed; its button says so
 */
export default function PricingCards({ prices = null, currentUser = null, onSelect = null, busyTerm = null, currentTerm = null, disabled = false }) {
  const signedIn = !!currentUser;

  return (
    <div className="mx-auto mt-14 grid max-w-5xl items-stretch gap-6 md:grid-cols-3 lg:mt-16 lg:gap-7">
      {PHONE_ORDER.map((id) => {
        const term = PLAN_TERMS.find((t) => t.id === id);
        const plan = prices?.[id] || null;
        const featured = id === BEST_VALUE_TERM;
        const saving = plan ? savingsFor(plan, prices) : null;
        const current = currentTerm === id;

        const buttonClass = `btn-shine group flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold transition duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 motion-reduce:transform-none ${
          featured
            ? "border border-white/15 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 !text-white shadow-lg shadow-fuchsia-600/30 hover:shadow-xl hover:shadow-fuchsia-500/40 focus-visible:ring-fuchsia-300/50"
            : "btn-shine-soft bg-white !text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50 hover:ring-indigo-300 focus-visible:ring-indigo-200"
        }`;
        const arrow = <FaArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none" />;

        let button;
        if (onSelect) {
          button = current ? (
            <span className={`${buttonClass} pointer-events-none`}>Your current plan</span>
          ) : (
            <button type="button" onClick={() => onSelect(id)} disabled={disabled || !plan || busyTerm !== null} className={buttonClass}>
              {busyTerm === id ? "Opening checkout…" : "Subscribe"}
              {busyTerm !== id && arrow}
            </button>
          );
        } else {
          const subscribed = currentUser?.subscriptionPlan === "BASIC";
          const href = !signedIn ? "/auth/register" : `/dashboard/billing?plan=${id}`;
          const text = !signedIn ? "Start free trial" : subscribed ? "Manage plan" : "Subscribe";
          button = (
            <Link href={subscribed ? "/dashboard/billing" : href} className={buttonClass}>
              {text}
              {arrow}
            </Link>
          );
        }

        return (
          <div
            key={id}
            className={`relative flex flex-col rounded-3xl p-7 transition duration-300 sm:p-8 ${ORDER[id]} ${
              featured
                ? "bg-gradient-to-b from-indigo-950 via-indigo-950 to-indigo-900 text-white shadow-2xl shadow-indigo-900/25 ring-1 ring-indigo-900 md:-my-3 md:py-10"
                : "bg-white shadow-sm ring-1 ring-slate-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-900/5 hover:ring-indigo-200 motion-reduce:transform-none"
            }`}
          >
            {featured && (
              <>
                <div
                  className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_85%_0%,rgb(167_139_250/0.28),transparent_55%)]"
                  aria-hidden="true"
                />
                {/* White badge: gradient lettering that slowly drifts, and a soft sheen now and then */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="relative block overflow-hidden whitespace-nowrap rounded-full bg-white px-4 py-1.5 shadow-lg shadow-indigo-950/25 ring-1 ring-indigo-100">
                    <span className="bg-[linear-gradient(90deg,#4f46e5,#7c3aed,#c026d3,#7c3aed,#4f46e5)] bg-[length:200%_100%] bg-clip-text text-sm font-semibold text-transparent motion-safe:animate-gradient-pan">
                      Best value{saving ? ` · Save ${saving.percent}%` : ""}
                    </span>
                    <span
                      className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-indigo-100/80 to-transparent motion-safe:animate-sheen motion-reduce:hidden"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </>
            )}

            <div className="relative flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`rounded-lg px-2.5 py-1 font-display text-xs font-bold uppercase tracking-[0.12em] ${
                    featured ? "bg-white/10 text-indigo-100" : "bg-indigo-50 text-indigo-700"
                  }`}
                >
                  {term.name}
                </h3>
                {saving && !featured && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                    Save {saving.percent}%
                  </span>
                )}
              </div>

              <p className="mt-6 flex min-h-[3.25rem] flex-wrap items-baseline gap-x-1.5">
                {plan ? (
                  <>
                    <span className={`font-sans text-5xl font-bold tracking-[-0.03em] tabular-nums ${featured ? "text-white" : "text-slate-900"}`}>
                      {formatPrice(monthlyAmount(plan), plan.currency)}
                    </span>
                    <span className={featured ? "text-indigo-200" : "text-slate-500"}>/month</span>
                  </>
                ) : (
                  <span className={`h-12 w-32 animate-pulse rounded-lg ${featured ? "bg-white/10" : "bg-slate-100"}`} aria-hidden="true" />
                )}
              </p>
              <p className={`mt-2 text-sm ${featured ? "text-indigo-200" : "text-slate-600"}`}>
                {plan ? `Billed ${formatPrice(plan.amount, plan.currency)} ${term.every}` : " "}
              </p>
              {featured && saving && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-indigo-50 ring-1 ring-inset ring-white/10">
                  <FaCheck className="h-3 w-3 text-emerald-300" />
                  {saving.perYear} off per year
                </p>
              )}
            </div>

            <div className="relative mt-8">
              {button}
              {!signedIn && !onSelect && (
                <p className={`mt-3 text-center text-xs ${featured ? "text-indigo-200" : "text-slate-500"}`}>
                  {TRIAL_DAYS} days free, no card needed
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** One line under the cards: GST, upfront billing and renewal (plus Razorpay, unless PaymentMethods already says so) */
export function PricingFootnote({ className = "mt-10", razorpay = true }) {
  return (
    <p className={`mx-auto max-w-2xl text-center text-sm leading-relaxed text-slate-500 ${className}`}>
      Prices include 18% GST. You pay upfront for the months you choose, and the plan renews for the same length until you
      cancel.{razorpay ? " Payments are processed securely by Razorpay." : ""}
    </p>
  );
}

// The orange and green arrow of the RuPay and UPI marks
function IndiaPayArrow() {
  return (
    <svg viewBox="0 0 11 12" className="h-3 w-auto" aria-hidden="true">
      <path d="M0 0l5 6-5 6z" fill="#F7941D" />
      <path d="M5 0l5 6-5 6z" fill="#0F9D58" />
    </svg>
  );
}

// Logos of the ways to pay a subscription with Razorpay. India: cards, UPI AutoPay and net banking (e-mandate);
// elsewhere: international Visa and Mastercard. Amex, wallets, Google Pay and Apple Pay can't pay renewals.
const PAYMENT_LOGOS = {
  visa: { label: "Visa", logo: <SiVisa className="h-8 w-11 text-[#1A1F71]" aria-hidden="true" /> },
  mastercard: {
    label: "Mastercard",
    logo: (
      <svg viewBox="0 0 29 18" className="h-6 w-auto" aria-hidden="true">
        <circle cx="10" cy="9" r="7" fill="#EB001B" />
        <circle cx="19" cy="9" r="7" fill="#F79E1B" />
        <path d="M14.5 3.64A7 7 0 0 1 14.5 14.36A7 7 0 0 1 14.5 3.64Z" fill="#FF5F00" />
      </svg>
    ),
  },
  rupay: {
    label: "RuPay",
    logo: (
      <span className="flex items-center gap-0.5" aria-hidden="true">
        <span className="font-sans text-[15px] font-extrabold italic tracking-tight text-[#1B3281]">RuPay</span>
        <IndiaPayArrow />
      </span>
    ),
  },
  upi: {
    label: "UPI AutoPay",
    logo: (
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="font-sans text-[15px] font-extrabold italic tracking-tight text-slate-600">UPI</span>
        <IndiaPayArrow />
      </span>
    ),
  },
  netbanking: {
    label: "Net banking",
    logo: (
      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700" aria-hidden="true">
        <FaUniversity className="h-3.5 w-3.5 text-indigo-600" />
        Net banking
      </span>
    ),
  },
};
const PAYMENT_METHODS = { INR: ["visa", "mastercard", "rupay", "upi", "netbanking"], USD: ["visa", "mastercard"] };

/** "Payment methods": logos of the ways to pay in the visitor's currency (INR when not known yet), plus a short note */
export function PaymentMethods({ currency = "INR", className = "mt-12" }) {
  const methods = PAYMENT_METHODS[currency] || PAYMENT_METHODS.INR;
  return (
    <div className={`mx-auto max-w-3xl text-center ${className}`}>
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Payment methods</h3>
      <ul className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
        {methods.map((id) => (
          <li
            key={id}
            title={PAYMENT_LOGOS[id].label}
            className="flex h-11 min-w-[4.5rem] items-center justify-center rounded-xl bg-white px-3.5 shadow-sm ring-1 ring-slate-200"
          >
            {PAYMENT_LOGOS[id].logo}
            <span className="sr-only">{PAYMENT_LOGOS[id].label}</span>
          </li>
        ))}
      </ul>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500">
        <FaLock className="mr-1.5 inline h-3 w-3 -translate-y-px text-slate-400" aria-hidden="true" />
        {currency === "USD"
          ? "Pay in US dollars with a Visa or Mastercard card that allows international payments. Checkout is secured by Razorpay."
          : "Pay with a card, UPI AutoPay or net banking. Checkout is secured by Razorpay, and the options you see depend on your plan and bank."}
      </p>
    </div>
  );
}

// Everything a paid plan includes, for the "All plans include" grid
const PLAN_INCLUDES = [
  { icon: FaQrcode, title: "Unlimited dynamic QR codes", text: "Create as many codes as you need and change where they point any time." },
  { icon: FaInfinity, title: "Unlimited scans", text: "Every code can be scanned as often as people like." },
  { icon: FaShapes, title: "All QR code types", text: `${releasedTypeNames()[0].toUpperCase()}${releasedTypeNames().slice(1)} codes.` },
  { icon: FaChartLine, title: "Complete scan analytics", text: "Scans by day, hour, country, city, device and browser, with CSV export." },
  { icon: FaPalette, title: "Your own design", text: "Colours, gradients, corner styles, a frame with your text and your logo." },
  { icon: FaDownload, title: "Print-ready downloads", text: "PNG, SVG, JPEG and PDF, or print straight from your browser." },
  { icon: FaLock, title: "Password protection", text: "Ask for a password before a website code opens." },
  { icon: FaPause, title: "Pause and resume", text: "Switch codes off and on, with your own message while paused." },
  { icon: FaFolderOpen, title: "Folders and bulk actions", text: "Sort codes into folders and move, pause or delete several at once." },
  { icon: FaFileInvoice, title: "GST invoice every time", text: "A tax invoice is emailed to you after every payment." },
  { icon: FaEnvelope, title: "Email support", text: "Write to us any time and we'll reply by email." },
  { icon: FaCalendarCheck, title: "Cancel whenever you want", text: "Cancel from your billing page; your plan runs to the end of the period you've paid for." },
];

/** "All plans include": what every paid plan comes with, as a grid of small cards */
export function AllPlansInclude() {
  return (
    <div className="mx-auto mt-20 max-w-6xl">
      <h3 className="text-center text-2xl font-bold tracking-[-0.015em] text-slate-900 sm:text-3xl">All plans include</h3>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLAN_INCLUDES.map(({ icon: Icon, title, text }) => (
          <li
            key={title}
            className="group flex cursor-pointer gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-900/5 hover:ring-indigo-200 motion-reduce:transform-none"
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 ring-1 ring-inset ring-indigo-100 transition-colors duration-300 group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white group-hover:ring-transparent">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[15px] font-semibold text-slate-900">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
