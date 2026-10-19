import { useEffect, useState } from "react";
import Link from "next/link";
import { FaArrowRight, FaCheck, FaLock } from "react-icons/fa";
import { formatPrice, formatPeriod } from "@/lib/billing/price";
import { BASIC_PLAN_FEATURES, TRIAL_PLAN_FEATURES } from "@/lib/site";

const pricingPlans = [
  {
    name: "Free Trial",
    period: "for 14 days",
    description: "Perfect for getting started",
    features: TRIAL_PLAN_FEATURES,
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Basic Package",
    description: "For individuals and small businesses",
    features: BASIC_PLAN_FEATURES,
    cta: "Subscribe Now",
    popular: true,
  },
];

/**
 * The Free Trial and Basic Package cards (home and pricing pages).
 * - basicPlan: the Razorpay price in the visitor's currency, picked on the server by location ({ amount, currency, period, interval })
 * - currentUser: { subscriptionPlan } when signed in; the buttons then lead to the dashboard or billing page
 */
export default function PricingCards({ basicPlan = null, currentUser = null }) {
  const isAuthenticated = !!currentUser;
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  // Signed-in visitors: their plan status decides the button texts
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchSubscriptionStatus = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setSubscriptionStatus(data.subscriptionStatus || { status: "NONE", daysLeft: null });
        }
      } catch (error) {
        console.error("Failed to fetch subscription status:", error);
        setSubscriptionStatus({ status: "NONE", daysLeft: null });
      }
    };
    fetchSubscriptionStatus();
  }, [isAuthenticated]);

  const displayPlans = pricingPlans.map((plan) =>
    plan.name === "Basic Package"
      ? {
          ...plan,
          price: basicPlan ? formatPrice(basicPlan.amount, basicPlan.currency) : "—",
          period: basicPlan ? formatPeriod(basicPlan.period, basicPlan.interval) : "",
        }
      : { ...plan, price: formatPrice(0, basicPlan?.currency || "USD") }
  );

  // Where each plan's button goes, depending on who is looking
  const planButton = (plan) => {
    let href = "/auth/register";
    let text = plan.cta;
    if (isAuthenticated) {
      if (plan.name === "Free Trial") {
        href = "/dashboard";
        text = subscriptionStatus?.status === "TRIAL_ACTIVE" ? "Trial Active - Go to Dashboard" : "Go to Dashboard";
      } else if (plan.name === "Basic Package") {
        href = "/dashboard/billing";
        if (subscriptionStatus?.status === "SUBSCRIPTION_ACTIVE" && currentUser?.subscriptionPlan === "BASIC") {
          text = "Manage Plan";
        } else {
          text = subscriptionStatus?.status === "TRIAL_EXPIRED" ? "Upgrade Now" : "Subscribe Now";
        }
      }
    }
    return { href, text };
  };

  return (
    <div className="mx-auto mt-14 grid max-w-4xl items-stretch gap-8 md:grid-cols-2 lg:mt-16">
      {displayPlans.map((plan) => {
        const featured = plan.popular;
        const button = planButton(plan);
        return (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-3xl p-6 sm:p-10 ${
              featured
                ? "bg-gradient-to-b from-indigo-950 via-indigo-950 to-indigo-900 text-white shadow-2xl shadow-indigo-900/25 ring-1 ring-indigo-900"
                : "bg-white shadow-sm ring-1 ring-slate-200"
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
                      Most Popular
                    </span>
                    <span
                      className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-indigo-100/80 to-transparent motion-safe:animate-sheen motion-reduce:hidden"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </>
            )}

            <div className="relative">
              <h3 className={`text-xl font-semibold ${featured ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>
              <div className="mt-5 flex flex-wrap items-baseline gap-x-2">
                <span className={`font-sans text-5xl font-bold tracking-[-0.03em] tabular-nums ${featured ? "text-white" : "text-slate-900"}`}>
                  {plan.price}
                </span>
                {plan.period && <span className={featured ? "text-indigo-200" : "text-slate-600"}>{plan.period}</span>}
              </div>
              <p className={`mt-3 ${featured ? "text-indigo-200" : "text-slate-600"}`}>{plan.description}</p>
            </div>

            <ul className={`relative mt-8 flex-1 space-y-3.5 border-t pt-8 ${featured ? "border-white/10" : "border-slate-100"}`}>
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full ${
                      featured ? "bg-white/10 text-emerald-300" : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    <FaCheck className="h-2.5 w-2.5" />
                  </span>
                  <span className={featured ? "text-indigo-50" : "text-slate-700"}>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Glowing gradient on the featured card, a confident dark button on the other (both pass AA with white text) */}
            <div className="relative mt-10">
              <Link
                href={button.href}
                className={`btn-shine group flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-[15px] font-semibold transition duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 motion-reduce:transform-none ${
                  featured
                    ? "border border-white/15 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 !text-white shadow-lg shadow-fuchsia-600/30 hover:shadow-xl hover:shadow-fuchsia-500/40 focus-visible:ring-fuchsia-300/50"
                    : "bg-slate-900 !text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/25 focus-visible:ring-slate-300"
                }`}
              >
                {button.text}
                <FaArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none" />
              </Link>
              {!isAuthenticated && (
                <p className={`mt-3 flex items-center justify-center gap-1.5 text-xs ${featured ? "text-indigo-200" : "text-slate-500"}`}>
                  {featured ? <FaLock className="h-2.5 w-2.5" /> : <FaCheck className="h-2.5 w-2.5" />}
                  {featured ? "Secure checkout with Razorpay" : "No card needed"}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
