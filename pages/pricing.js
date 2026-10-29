import Link from "next/link";
import { useRouter } from "next/router";
import { QRCodeSVG } from "qrcode.react";
import { FaCheck, FaCoins, FaFileInvoice, FaGlobe, FaLock, FaPause, FaTag, FaTimesCircle } from "react-icons/fa";
import { SITE_URL } from "@/lib/site";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SeoMeta from "@/components/layout/SeoMeta";
import PageBanner from "@/components/landing/PageBanner";
import PricingCards, { PricingFootnote, AllPlansInclude, PaymentMethods } from "@/components/landing/PricingCards";
import { container, sectionSpacing, SectionHeading, FeatureGrid, FaqList } from "@/components/landing/LandingUi";
import { formatPrice, formatMonthly, formatBilled, monthlyAmount, cheapestPlan, savingsFor } from "@/lib/billing/price";
import { BEST_VALUE_TERM, termById } from "@/lib/billing/terms";
import { TRIAL_DAYS } from "@/lib/billing/subscription";
import { organizationSchema, breadcrumbSchema, faqPageSchema, softwareApplicationSchema } from "@/lib/seo";

export async function getServerSideProps(context) {
  const { getUserFromRequest } = await import("@/lib/auth");
  const user = await getUserFromRequest(context.req);

  // Same prices as the home page: the visitor's currency for the cards, every currency for search engines
  let prices = null;
  let plans = {};
  try {
    const { getPlans, publicPlans, currencyForIp } = await import("@/lib/billing/plans");
    const { getClientIp } = await import("@/lib/clientIp");
    const all = await getPlans();
    plans = publicPlans(all);
    prices = plans[currencyForIp(all, getClientIp(context.req))] || null;
  } catch (err) {
    console.error("Pricing page prices:", err.message);
  }

  return {
    props: {
      initialUser: user ? { id: user.id, subscriptionPlan: user.subscriptionPlan } : null,
      prices,
      plans,
    },
  };
}

// The banner picture: one still price tag carrying a QR code and the 12-month price in the visitor's currency
function PriceVisual({ prices }) {
  const plan = prices?.[BEST_VALUE_TERM] || null;
  const saving = plan ? savingsFor(plan, prices) : null;
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="absolute h-72 w-72 rounded-full bg-indigo-300/25 blur-3xl" />
      <div className="relative drop-shadow-[0_24px_36px_rgba(49,46,129,0.2)]">
        {/* Tag: a pointed left end with an eyelet, rounded on the right */}
        <div className="relative flex items-center gap-6 rounded-r-[28px] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 py-8 pl-16 pr-9 text-white [clip-path:polygon(12%_0,100%_0,100%_100%,12%_100%,0_50%)]">
          <span className="absolute left-[7%] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-indigo-50 ring-4 ring-white/25" />
          <div className="flex-none rounded-2xl bg-white p-2.5 shadow-lg shadow-indigo-950/20">
            <QRCodeSVG value={`${SITE_URL}/pricing`} size={84} level="M" fgColor="#1e1b4b" bgColor="#ffffff" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-100">{termById(BEST_VALUE_TERM).name}</p>
            <p className="mt-1.5 flex items-baseline gap-1 whitespace-nowrap">
              <span className="font-sans text-4xl font-bold tracking-[-0.03em] tabular-nums">
                {plan ? formatPrice(monthlyAmount(plan), plan.currency) : "—"}
              </span>
              <span className="text-sm text-indigo-100">/month</span>
            </p>
            <p className="mt-1 whitespace-nowrap text-xs text-indigo-100">{plan ? `Billed ${formatPrice(plan.amount, plan.currency)} every year` : " "}</p>
            <p className="mt-3.5 inline-block whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
              Best value{saving ? ` · Save ${saving.percent}%` : ""}
            </p>
          </div>
        </div>
        {/* The string, threaded through the eyelet */}
        <svg viewBox="0 0 96 96" className="absolute bottom-1/2 left-[-50px] h-24 w-24 text-indigo-300" fill="none" aria-hidden="true">
          <path d="M4 6c26 4 50 26 80 88" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

// The comparison table's columns: the free trial, then the paid plans from shortest to longest
const COMPARE_TERMS = ["3m", "6m", "12m"];

// Groups of rows for the comparison: [feature, Free trial, 3 months, 6 months, 12 months].
// true shows a tick, false a dash; every paid plan has the same features, only the price and length differ.
function comparisonGroups(prices) {
  const plans = COMPARE_TERMS.map((id) => prices?.[id] || null);
  const each = (fn) => plans.map((plan) => (plan ? fn(plan) : "—"));
  const all = (value) => [value, value, value];
  return [
    {
      title: "Price and billing",
      rows: [
        ["Price per month", "Free", ...each((plan) => formatPrice(monthlyAmount(plan), plan.currency))],
        ["You pay", "Nothing", ...each((plan) => formatBilled(plan))],
        ["Saving compared with 3 months", false, ...each((plan) => (savingsFor(plan, prices) ? `${savingsFor(plan, prices).percent}%` : false))],
        ["Length", `${TRIAL_DAYS} days`, "3 months", "6 months", "12 months"],
        ["Renews automatically", false, ...all(true)],
        ["Card needed", "No", ...all("At checkout")],
        ["GST invoice by email", false, ...all(true)],
        ["Cancel anytime", "Nothing to cancel", ...all(true)],
      ],
    },
    {
      title: "QR codes",
      rows: [
        ["Dynamic QR codes", "Up to 2", ...all("Unlimited")],
        ["Scans", "Unlimited", ...all("Unlimited")],
        ["Website, Wi-Fi, WhatsApp and Instagram codes", true, ...all(true)],
        ["Change links after printing", true, ...all(true)],
        ["Pause and resume, with your own message", true, ...all(true)],
        ["Password protection", true, ...all(true)],
      ],
    },
    {
      title: "Design and downloads",
      rows: [
        ["Colours, gradients and corner styles", true, ...all(true)],
        ["Your logo and a frame with your text", true, ...all(true)],
        ["PNG, SVG, JPEG and PDF downloads", true, ...all(true)],
      ],
    },
    {
      title: "Analytics",
      rows: [
        ["Scans by day, hour, country, city, device and browser", true, ...all(true)],
        ["CSV export", true, ...all(true)],
      ],
    },
    {
      title: "Organise and support",
      rows: [
        ["Folders", true, ...all(true)],
        ["Bulk move, pause and delete", true, ...all(true)],
        ["Email support", true, ...all(true)],
      ],
    },
  ];
}

function CompareValue({ value, strong }) {
  if (value === true) {
    return (
      <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <FaCheck className="h-2.5 w-2.5" aria-hidden="true" />
        <span className="sr-only">Included</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="text-slate-300">
        <span aria-hidden="true">—</span>
        <span className="sr-only">Not included</span>
      </span>
    );
  }
  return <span className={strong ? "font-semibold text-slate-900" : "text-slate-700"}>{value}</span>;
}

// Where each column's button goes: sign up when signed out, checkout for that plan when signed in
function compareLink(currentUser, termId) {
  if (!currentUser) return { href: "/auth/register", text: "Start free trial" };
  if (currentUser.subscriptionPlan === "BASIC") return { href: "/dashboard/billing", text: "Manage plan" };
  return termId ? { href: `/dashboard/billing?plan=${termId}`, text: "Subscribe" } : null;
}

/** Every plan side by side: price, billing and features, with the best value column highlighted */
function PlanComparison({ prices, currentUser }) {
  const columns = [
    { id: "trial", name: "Free trial", price: "Free", per: `for ${TRIAL_DAYS} days`, link: compareLink(currentUser, null) },
    ...COMPARE_TERMS.map((id) => {
      const plan = prices?.[id] || null;
      return {
        id,
        name: termById(id).name,
        price: plan ? formatPrice(monthlyAmount(plan), plan.currency) : "—",
        per: "/month",
        featured: id === BEST_VALUE_TERM,
        link: compareLink(currentUser, id),
      };
    }),
  ];
  // Solid colours: the feature column stays put while the plans scroll under it on phones
  const stickyLabel = "sticky left-0 z-10 bg-white";
  const rowHover = (featured) => (featured ? "bg-[#f5f7ff] group-hover:bg-indigo-50" : "group-hover:bg-[#f8f9ff]");

  return (
    <div className="mx-auto mt-12 max-w-6xl sm:mt-14">
      <p className="mb-3 text-center text-xs text-slate-500 md:hidden">Swipe sideways to see every plan</p>
      {/* relative: the screen-reader labels in the cells are positioned inside this scroll box, not the page */}
      <div className="relative overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
          <caption className="sr-only">The free trial and the 3, 6 and 12-month plans compared</caption>
          <thead>
            <tr>
              <th scope="col" className={`${stickyLabel} w-[30%] border-b border-slate-200 px-4 py-6 align-bottom sm:px-6`}>
                <span className="font-display text-base font-semibold text-slate-900">Compare plans</span>
              </th>
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={`border-b border-slate-200 px-3 py-6 text-center align-bottom ${col.featured ? "bg-[#f5f7ff]" : ""}`}
                >
                  {col.featured && (
                    <span className="mb-2 inline-block rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      Best value
                    </span>
                  )}
                  <span className={`block font-display text-xs font-bold uppercase tracking-[0.12em] ${col.featured ? "text-indigo-700" : "text-slate-500"}`}>
                    {col.name}
                  </span>
                  <span className="mt-2 block">
                    <span className="font-sans text-2xl font-bold tracking-[-0.02em] text-slate-900 tabular-nums">{col.price}</span>
                    <span className="ml-1 text-xs font-normal text-slate-500">{col.per}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          {comparisonGroups(prices).map((group) => (
            <tbody key={group.title}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={columns.length + 1}
                  className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700 sm:px-6"
                >
                  <span className="sticky left-4 sm:left-6">{group.title}</span>
                </th>
              </tr>
              {group.rows.map(([feature, ...values]) => (
                <tr key={feature} className="group">
                  <th scope="row" className={`${stickyLabel} border-b border-slate-100 px-4 py-3.5 font-medium text-slate-700 transition-colors group-hover:bg-[#f8f9ff] sm:px-6`}>
                    {feature}
                  </th>
                  {values.map((value, i) => (
                    <td
                      key={columns[i].id}
                      className={`border-b border-slate-100 px-3 py-3.5 text-center transition-colors ${rowHover(columns[i].featured)}`}
                    >
                      <CompareValue value={value} strong={i > 0 && feature === "Price per month"} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
          <tfoot>
            <tr>
              <td className={`${stickyLabel} px-4 py-6 sm:px-6`} />
              {columns.map((col) => (
                <td key={col.id} className={`px-3 py-6 text-center ${col.featured ? "bg-[#f5f7ff]" : ""}`}>
                  {col.link && (
                    <Link
                      href={col.link.href}
                      className={`btn-shine inline-flex w-full max-w-[10rem] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 motion-reduce:transform-none ${
                        col.featured
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 !text-white shadow-md shadow-indigo-600/20 hover:shadow-lg focus-visible:ring-indigo-200"
                          : "btn-shine-soft bg-white !text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50 focus-visible:ring-indigo-100"
                      }`}
                    >
                      {col.link.text}
                    </Link>
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

const billingDetails = [
  {
    icon: <FaGlobe className="h-5 w-5" />,
    title: "Priced in your currency",
    description: "Visitors in India pay in rupees and everyone else in US dollars. The price you see is the price you pay.",
  },
  {
    icon: <FaCoins className="h-5 w-5" />,
    title: "Pay upfront, save more",
    description: "You pay for the months you choose in one go. The 12-month plan costs half as much per month as the 3-month plan.",
  },
  {
    icon: <FaFileInvoice className="h-5 w-5" />,
    title: "GST invoice every time",
    description: "Prices include 18% GST, and a GST invoice is emailed to you after every payment.",
  },
  {
    icon: <FaTimesCircle className="h-5 w-5" />,
    title: "Cancel anytime",
    description: "Cancel from your billing page. Your plan stays active until the end of the period you've paid for, then stops.",
  },
  {
    icon: <FaLock className="h-5 w-5" />,
    title: "Secure checkout",
    description: "Payments are processed by Razorpay. Your card details go to Razorpay, never to QR-Genie.",
  },
  {
    icon: <FaPause className="h-5 w-5" />,
    title: "Nothing is deleted",
    description: "If your plan ends, your codes are paused, not deleted, and switch back on when you subscribe again.",
  },
];

const faqs = [
  {
    question: "Is there a free trial?",
    answer: `Yes. Every new account gets ${TRIAL_DAYS} days free with up to 2 QR codes and every feature. No card is needed to start.`,
  },
  {
    question: "What's the difference between the 3, 6 and 12-month plans?",
    answer:
      "Only the length and the price. Every plan has the same features. You pay upfront for the months you choose, and the longer the plan, the lower the price per month.",
  },
  {
    question: "If I subscribe during the free trial, do I lose my free days?",
    answer: `No. You pay when you subscribe, but your paid months only start when your ${TRIAL_DAYS} free days end.`,
  },
  {
    question: "What happens when the free trial ends?",
    answer:
      "If you haven't chosen a plan, your codes are paused. Nothing is deleted, and choosing a plan switches them back on with the same links.",
  },
  {
    question: "Which currency will I pay in?",
    answer: "Visitors in India pay in Indian rupees and everyone else in US dollars. The currency is set by where you're connecting from.",
  },
  {
    question: "Do prices include GST?",
    answer: "Yes. Prices include 18% GST, and you receive a GST invoice by email after every payment.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. Cancel from the billing page in your dashboard. Your plan won't renew, and it stays active until the end of the period you've paid for.",
  },
  {
    question: "Do you offer refunds?",
    answer: `If you cancel during your ${TRIAL_DAYS} free days, before your paid months have started, we refund your payment in full automatically. Once your paid months have started, cancelling stops the next renewal and the plan runs to the end of the period you've paid for, without a refund. If you were charged by mistake, we refund that payment in full.`,
  },
  {
    question: "Can I switch to a longer or shorter plan?",
    answer:
      "Yes. Cancel your current plan on the billing page, and when it ends, choose the new one. Your QR codes and their links stay the same.",
  },
];

export default function PricingPage({ initialUser, prices = null, plans = {} }) {
  const router = useRouter();
  const isAuthenticated = !!initialUser;
  const fromPrice = formatMonthly(cheapestPlan(prices));

  // Search result text, the same for everyone: the lowest US dollar monthly price ("$19.99/month")
  const title = `Dynamic QR Code Pricing & Plans: ${TRIAL_DAYS}-Day Free Trial | QR-Genie`;
  const usdFrom = formatMonthly(cheapestPlan(plans.USD));
  const description =
    `${usdFrom ? `Plans from ${usdFrom}` : "3, 6 and 12-month plans"} with unlimited dynamic QR codes, unlimited scans ` +
    `and scan analytics. Edit links after printing. Try ${TRIAL_DAYS} days free, no card needed.`;
  const structuredData = [
    organizationSchema,
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Pricing", path: "/pricing" },
    ]),
    softwareApplicationSchema({ description, plans }),
    faqPageSchema(faqs),
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.push("/auth/logout");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SeoMeta title={title} description={description} path="/pricing" jsonLd={structuredData} />
      <SiteHeader isAuthenticated={isAuthenticated} onLogout={handleLogout} />

      <main>
        <PageBanner
          eyebrow={{ icon: FaTag, label: "Pricing" }}
          title="Dynamic QR Code"
          highlight="Pricing"
          subtitle={fromPrice ? `Free for ${TRIAL_DAYS} days, then from ${fromPrice}` : `Free for ${TRIAL_DAYS} days, then a plan that suits you`}
          summary="Three plans with every feature: unlimited dynamic QR codes, scan analytics, your own design and link editing."
          crumbs={[{ name: "Pricing", path: "/pricing" }]}
          visual={<PriceVisual prices={prices} />}
          visualClassName="hidden lg:block"
        />

        {/* Plans */}
        <section className={`bg-white ${sectionSpacing}`}>
          <div className={container}>
            <SectionHeading
              eyebrow="Plans"
              title="Plans and prices"
              description={`Try it for ${TRIAL_DAYS} days for free, no card needed. Then pick 3, 6 or 12 months: the longer the plan, the lower the monthly price.`}
            />
            <PricingCards prices={prices} currentUser={initialUser} />
            <PaymentMethods currency={prices?.[BEST_VALUE_TERM]?.currency} />
            <PricingFootnote className="mt-8" razorpay={false} />
            <AllPlansInclude />
          </div>
        </section>

        {/* Plan comparison */}
        <section id="compare" className={`scroll-mt-24 border-t border-slate-100 bg-white ${sectionSpacing}`}>
          <div className={container}>
            <SectionHeading
              eyebrow="Compare"
              title="Compare all plans"
              description="Every paid plan has the same features; only the length and the monthly price change. The free trial has every feature too, with up to 2 QR codes."
            />
            <PlanComparison prices={prices} currentUser={initialUser} />
          </div>
        </section>

        {/* Billing */}
        <section className={`relative isolate overflow-hidden bg-slate-50 ${sectionSpacing}`}>
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgb(224_231_255/0.8),transparent)]"
            aria-hidden="true"
          />
          <div className={container}>
            <SectionHeading
              eyebrow="Billing"
              title="Simple, fair billing"
              description="No setup fees and no long contracts. Here's how payments, invoices and cancelling work."
            />
            <FeatureGrid items={billingDetails} />
          </div>
        </section>

        {/* FAQ (the same questions go to search engines as FAQ structured data). Little bottom padding: the
            footer's sign-up panel brings its own space */}
        <section className="bg-white pb-4 pt-16 sm:pt-24 lg:pt-28">
          <div className={container}>
            <SectionHeading eyebrow="FAQ" title="Pricing questions" />
            <FaqList faqs={faqs} />
            <p className="mt-10 text-center text-[15px] text-slate-600">
              More about payments in our{" "}
              <Link href="/refund-policy" className="font-semibold !text-indigo-700 hover:!text-purple-700">
                refund policy
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="font-semibold !text-indigo-700 hover:!text-purple-700">
                terms of service
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <SiteFooter showCta isAuthenticated={isAuthenticated} />
    </div>
  );
}
