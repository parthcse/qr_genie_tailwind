import Link from "next/link";
import { useRouter } from "next/router";
import {
  FaCheck,
  FaChevronRight,
  FaFileInvoice,
  FaGlobe,
  FaLock,
  FaPause,
  FaTag,
  FaTimesCircle,
  FaUndo,
} from "react-icons/fa";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SeoMeta from "@/components/layout/SeoMeta";
import PricingCards from "@/components/landing/PricingCards";
import { container, sectionSpacing, HeroBackground, HeroTitle, SectionHeading, FeatureGrid, FaqList } from "@/components/landing/LandingUi";
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
        {/* Hero and plans */}
        <section className="relative isolate overflow-hidden">
          <HeroBackground />
          <div className={`${container} pb-16 pt-10 sm:pb-24 sm:pt-14 lg:pb-28 lg:pt-16`}>
            <nav aria-label="Breadcrumb" className="flex justify-center">
              <ol className="flex items-center gap-2 text-sm text-slate-500">
                <li>
                  <Link href="/" className="font-medium !text-slate-500 transition-colors hover:!text-indigo-700">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">
                  <FaChevronRight className="h-2.5 w-2.5 text-slate-400" />
                </li>
                <li aria-current="page" className="font-medium text-slate-700">
                  Pricing
                </li>
              </ol>
            </nav>

            <div className="mx-auto mt-8 max-w-3xl text-center lg:mt-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100">
                <FaTag className="h-3.5 w-3.5" />
                Pricing
              </div>
              <HeroTitle
                title="Dynamic QR Code Pricing"
                subtitle={planPrice ? `Free for 14 days, then ${planPrice}` : "Free for 14 days, then one simple plan"}
              />
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-slate-600 sm:text-xl">
                One plan with everything: unlimited dynamic QR codes, scan analytics, your own design and link editing. Start with a
                14-day free trial, no card needed, and cancel anytime.
              </p>
            </div>

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
