import { useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardLayout";
import { FaCheck, FaCrown, FaChevronDown } from "react-icons/fa";

// Server-side authentication check
export async function getServerSideProps(context) {
  const { getUserFromRequest } = await import('../../lib/auth');
  const user = await getUserFromRequest(context.req);
  if (!user) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
  return {
    props: {},
  };
}

// Pricing plans data - ids match API: MONTHLY | QUARTERLY | ANNUAL
const pricingPlans = [
  {
    id: "MONTHLY",
    name: "Monthly",
    price: "1,799",
    currency: "₹",
    period: "/mo",
    billingNote: "Billed monthly",
    popular: false,
    discount: null,
  },
  {
    id: "QUARTERLY",
    name: "Quarterly",
    price: "999",
    currency: "₹",
    period: "/mo",
    billingNote: "Billed every 3 months",
    popular: false,
    discount: null,
  },
  {
    id: "ANNUAL",
    name: "Annual",
    price: "699",
    currency: "₹",
    period: "/mo",
    billingNote: "Billed yearly",
    popular: true,
    discount: "60%",
  },
];

// Features list - shared across all plans
const planFeatures = [
  "Create unlimited dynamic QR codes",
  "Access a variety of QR types",
  "Unlimited modifications of QR codes",
  "Unlimited scans",
  "Multiple QR code download formats",
  "Unlimited users",
  "Premium customer support",
  "Cancel at anytime",
];

// FAQ data
const faqItems = [
  {
    id: 1,
    question: "Do you refund unused subscriptions?",
    answer: "Yes, we offer refunds for unused portions of your subscription. Contact our support team for assistance with refund requests.",
  },
  {
    id: 2,
    question: "What are my payment options?",
    answer: "We accept all major credit cards, debit cards, and UPI payments. All payments are processed securely through our payment gateway.",
  },
  {
    id: 3,
    question: "How can I cancel my subscription?",
    answer: "You can cancel your subscription at any time from your account settings. Your subscription will remain active until the end of the current billing period.",
  },
];

export default function BillingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState(null);
  const [buyingPlan, setBuyingPlan] = useState(null);

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const handleBuyNow = async (plan) => {
    if (!plan || !["MONTHLY", "QUARTERLY", "ANNUAL"].includes(plan)) return;
    setBuyingPlan(plan);
    try {
      const res = await fetch("/api/checkout/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Checkout failed. Please try again.");
        return;
      }
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      alert("Checkout failed. Please try again.");
    } finally {
      setBuyingPlan(null);
    }
  };

  return (
    <DashboardLayout title="" description="">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Main Heading */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-2 sm:mb-4">
            Plans{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">&</span> Pricing
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 px-4">
            Select the most convenient plan for you.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl sm:rounded-2xl border-2 bg-white shadow-lg transition-all duration-300 ${
                plan.popular
                  ? "border-indigo-500 md:scale-105"
                  : "border-gray-200 hover:border-indigo-300 hover:shadow-xl"
              }`}
            >
              {/* Discount Badge for Annually */}
              {plan.discount && (
                <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 z-10">
                  <div className="bg-yellow-400 text-gray-900 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg">
                    {plan.discount}
                  </div>
                </div>
              )}

              {/* Card Header - Gradient background for popular plan */}
              <div
                className={`rounded-t-xl sm:rounded-t-2xl px-4 sm:px-6 py-4 sm:py-6 ${
                  plan.popular
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    : "bg-white"
                }`}
              >
                {plan.popular && (
                  <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
                    <FaCrown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    <span className="text-xs sm:text-sm font-semibold text-white">Most Popular</span>
                  </div>
                )}
                <h3
                  className={`text-lg sm:text-xl font-bold text-center ${
                    plan.popular ? "text-white" : "bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                  }`}
                >
                  {plan.name}
                </h3>
              </div>

              {/* Card Body */}
              <div className="px-4 sm:px-6 py-4 sm:py-6">
                {/* Price */}
                <div className="text-center mb-3 sm:mb-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">
                      {plan.currency}
                    </span>
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-lg sm:text-xl text-gray-600">{plan.period}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                    {plan.billingNote}
                  </p>
                </div>

                {/* Buy Now Button */}
                <button
                  type="button"
                  onClick={() => handleBuyNow(plan.id)}
                  disabled={buyingPlan !== null}
                  className={`w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base text-white transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed ${
                    plan.popular
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg"
                  }`}
                >
                  {buyingPlan === plan.id ? "Processing..." : "Buy Now"}
                </button>

                {/* Features List */}
                <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                  {planFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <FaCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Questions About{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Plans & Pricing</span>
          </h2>

          <div className="space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl hover:border-indigo-300 overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(item.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-indigo-50 transition-colors"
                >
                  <span className="text-base font-semibold text-gray-900 pr-4">
                    {item.question}
                  </span>
                  <FaChevronDown
                    className={`flex-shrink-0 w-5 h-5 text-indigo-600 transition-transform duration-200 ${
                      openFaq === item.id ? "transform rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === item.id && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
