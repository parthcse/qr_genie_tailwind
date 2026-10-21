import Link from "next/link";
import { useRouter } from "next/router";
import { FaCheck, FaFileInvoice, FaGlobe, FaLock, FaPause, FaTag, FaTimesCircle, FaUndo } from "react-icons/fa";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SeoMeta from "@/components/layout/SeoMeta";
import PageBanner from "@/components/landing/PageBanner";
import PricingCards from "@/components/landing/PricingCards";
import { container, sectionSpacing, SectionHeading, FeatureGrid, FaqList } from "@/components/landing/LandingUi";
import { formatPlanPriceShort } from "@/lib/billing/price";
import { organizationSchema, breadcrumbSchema, faqPageSchema, softwareApplicationSchema, pricesForSearch } from "@/lib/seo";

export async function getServerSideProps(context) {
  const { getUserFromRequest } = await import("@/lib/auth");
  const user = await getUserFromRequest(context.req);

  // Same prices as the home page: the visitor's currency for the cards, every currency for search engines
  let basicPlan = null;
  let plans = {};
  try {
    const { getBasicPlans, publicPlans, currencyForIp } = await import("@/lib/billing/plans");
    const { getClientIp } = await import("@/lib/clientIp");
    const all = await getBasicPlans();
    plans = publicPlans(all);
    basicPlan = plans[currencyForIp(all, getClientIp(context.req))] || null;
  } catch (err) {
    console.error("Pricing page prices:", err.message);
  }

  return {
    props: {
      initialUser: user ? { id: user.id, subscriptionPlan: user.subscriptionPlan } : null,
      basicPlan,
      plans,
    },
  };
}

// The banner picture: a Basic Package card with the visitor's price, a free trial badge and the GST invoice note
function PriceVisual({ planPrice }) {
  const [amount, unit] = planPrice ? planPrice.split("/") : ["", ""];
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="absolute h-64 w-64 rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="relative w-64 -rotate-2 rounded-3xl bg-white p-6 shadow-2xl shadow-indigo-900/15 ring-1 ring-slate-900/5 transition-transform duration-500 hover:rotate-0 motion-reduce:transition-none">
        <span className="font-display text-sm font-semibold text-slate-900">Basic Package</span>
        <p className="mt-4 flex items-baseline gap-1">
          <span className="font-sans text-4xl font-bold tracking-[-0.03em] text-slate-900">{amount || "Monthly"}</span>
          {unit && <span className="text-sm text-slate-500">/{unit}</span>}
        </p>
        <ul className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-[13px] text-slate-600">
          {["Unlimited QR codes", "Scan analytics", "Cancel anytime"].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <FaCheck className="h-2 w-2" />
              </span>
              {item}
            </li>
          ))}
        </ul>
        <span className="mt-5 block rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-center text-xs font-semibold text-white shadow-md shadow-indigo-600/25">
          Subscribe
        </span>
      </div>
      <div className="absolute right-0 top-14 flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-xl shadow-indigo-900/10 ring-1 ring-slate-900/5 motion-safe:animate-float">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <FaCheck className="h-3 w-3" />
        </span>
        <span className="whitespace-nowrap">
          <span className="block text-sm font-semibold text-slate-900">14 days free</span>
          <span className="block text-xs text-slate-500">No card needed</span>
        </span>
      </div>
      <div className="absolute bottom-4 left-0 flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-xl shadow-indigo-900/10 ring-1 ring-slate-900/5 motion-safe:animate-float motion-safe:[animation-delay:-3s]">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <FaFileInvoice className="h-3 w-3" />
        </span>
        <span className="whitespace-nowrap">
          <span className="block text-sm font-semibold text-slate-900">GST invoice</span>
          <span className="block text-xs text-slate-500">Emailed after payment</span>
        </span>
      </div>
    </div>
  );
}

// Rows of the plan comparison: [feature, Free Trial, Basic Package]; true shows a tick
function comparisonRows(planPrice) {
  return [
    ["Price", "Free", planPrice || "Monthly"],
    ["How long", "14 days", "Month to month"],
    ["QR codes", "Up to 2", "Unlimited"],
    ["Scans", "Unlimited", "Unlimited"],
    ["Website, Wi-Fi, WhatsApp and Instagram codes", true, true],
    ["Change links after printing", true, true],
    ["Scan analytics and CSV export", true, true],
    ["Colours, logo and frames", true, true],
    ["Password protection", true, true],
    ["PNG, SVG, JPEG and PDF downloads", true, true],
    ["Folders and bulk actions", true, true],
    ["Email support", true, true],
  ];
}

const billingDetails = [
  {
    icon: <FaGlobe className="h-5 w-5" />,
    title: "Priced in your currency",
    description: "Visitors in India pay in rupees and everyone else in US dollars. The price you see is the price you pay.",
  },
  {
    icon: <FaFileInvoice className="h-5 w-5" />,
    title: "GST invoice every time",
    description: "Prices include 18% GST, and a GST invoice is emailed to you after every payment.",
  },
  {
    icon: <FaTimesCircle className="h-5 w-5" />,
    title: "Cancel anytime",
    description: "Cancel from your billing page. Your plan stays active until the end of the period you've paid for.",
  },
  {
    icon: <FaLock className="h-5 w-5" />,
    title: "Secure checkout",
    description: "Payments are processed by Razorpay. Your card details go to Razorpay, never to QR-Genie.",
  },
  {
    icon: <FaUndo className="h-5 w-5" />,
    title: "Fair refunds",
    description: "Cancel partway through a month and we refund the days you haven't used when you ask.",
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
    answer: "Yes. Every new account gets 14 days free with up to 2 QR codes and every feature. No card is needed to start.",
  },
  {
    question: "What happens when the free trial ends?",
    answer:
      "Your codes are paused until you subscribe to the Basic plan. Nothing is deleted, and subscribing switches them back on with the same links.",
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
      "Yes. Cancel from the billing page in your dashboard. You won't be charged again, and your plan stays active until the end of the period you've paid for.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Yes. If you cancel partway through a month, we refund the days you haven't used when you ask. If you were charged by mistake, we refund the extra payment in full. The refund policy has the details.",
  },
  {
    question: "Is there a limit on scans or QR codes?",
    answer: "The Basic plan has no limit on QR codes or scans. The free trial includes up to 2 codes.",
  },
];

export default function PricingPage({ initialUser, basicPlan = null, plans = {} }) {
  const router = useRouter();
  const isAuthenticated = !!initialUser;
  const planPrice = formatPlanPriceShort(basicPlan);

  const searchPrices = pricesForSearch(plans);
  const description =
    "Try QR-Genie free for 14 days, no card needed." +
    (searchPrices
      ? ` Then ${searchPrices} for unlimited dynamic QR codes, scan analytics and link editing.`
      : " Then one monthly plan with unlimited dynamic QR codes, scan analytics and link editing.");
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
      <SeoMeta title="Dynamic QR Code Pricing and Plans | QR-Genie" description={description} path="/pricing" jsonLd={structuredData} />
      <SiteHeader isAuthenticated={isAuthenticated} onLogout={handleLogout} />

      <main>
        <PageBanner
          eyebrow={{ icon: FaTag, label: "Pricing" }}
          title="Dynamic QR Code"
          highlight="Pricing"
          subtitle={planPrice ? `Free for 14 days, then ${planPrice}` : "Free for 14 days, then one simple plan"}
          summary="One plan with everything: unlimited dynamic QR codes, scan analytics, your own design and link editing."
          crumbs={[{ name: "Pricing", path: "/pricing" }]}
          visual={<PriceVisual planPrice={planPrice} />}
          visualClassName="hidden lg:block"
        />

        {/* Plans */}
        <section className={`bg-white ${sectionSpacing}`}>
          <div className={container}>
            <SectionHeading
              eyebrow="Plans"
              title="Start free, upgrade when you're ready"
              description="Every feature for 14 days, no card needed. Then one simple plan you can cancel anytime."
            />
            <PricingCards basicPlan={basicPlan} currentUser={initialUser} />
          </div>
        </section>

        {/* Plan comparison */}
        <section className={`border-t border-slate-100 bg-white ${sectionSpacing}`}>
          <div className={container}>
            <SectionHeading
              eyebrow="Compare"
              title="What's in each plan"
              description="The free trial has every feature, so you can try everything before you pay."
            />
            <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 sm:mt-14">
              <table className="w-full text-left text-sm sm:text-[15px]">
                <caption className="sr-only">Free Trial and Basic Package compared</caption>
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-50 via-white to-purple-50">
                    <th scope="col" className="px-4 py-4 font-display font-semibold text-slate-900 sm:px-8">
                      <span className="sr-only">Feature</span>
                    </th>
                    <th scope="col" className="w-[26%] px-3 py-4 text-center font-display font-semibold text-slate-900 sm:px-6">
                      Free Trial
                    </th>
                    <th scope="col" className="w-[30%] px-3 py-4 text-center font-display font-semibold text-indigo-700 sm:px-6">
                      Basic Package
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonRows(planPrice).map(([feature, trial, basic]) => (
                    <tr key={feature} className="transition-colors hover:bg-indigo-50/40">
                      <th scope="row" className="px-4 py-3.5 font-medium text-slate-700 sm:px-8">
                        {feature}
                      </th>
                      {[trial, basic].map((value, i) => (
                        <td key={i} className="px-3 py-3.5 text-center text-slate-700 sm:px-6">
                          {value === true ? (
                            <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                              <FaCheck className="h-2.5 w-2.5" aria-hidden="true" />
                              <span className="sr-only">Included</span>
                            </span>
                          ) : (
                            <span className={i === 1 ? "font-semibold text-slate-900" : ""}>{value}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

        {/* FAQ (the same questions go to search engines as FAQ structured data) */}
        <section className={`bg-white ${sectionSpacing}`}>
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
