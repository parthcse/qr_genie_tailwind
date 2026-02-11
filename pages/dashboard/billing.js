import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import DashboardLayout from "../../components/DashboardLayout";
import { FaCheck, FaCrown, FaChevronDown, FaBuilding, FaMapMarkerAlt, FaFileInvoice } from "react-icons/fa";

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

// Pricing plans data - Free Trial and Basic Package
const pricingPlans = [
  {
    id: "TRIAL",
    name: "Free Trial",
    price: "0",
    currency: "$",
    period: "/14 days",
    billingNote: "No credit card required",
    popular: false,
    discount: null,
    apiEndpoint: null, // No API endpoint - handled via registration
    features: [
      "14-day full access",
      "Create up to 2 QR codes",
      "All QR code types",
      "Dynamic link updates",
      "Basic analytics",
      "Email support"
    ],
  },
  {
    id: "BASIC",
    name: "Basic Package",
    price: "5",
    currency: "$",
    period: "/mo",
    billingNote: "Billed monthly",
    popular: true,
    discount: null,
    apiEndpoint: "/api/checkout/basic",
    features: [
      "Unlimited QR codes",
      "All QR code types",
      "Dynamic link updates",
      "Basic analytics",
      "Email support",
      "Cancel anytime"
    ],
  },
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
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
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
        }
      } catch (e) {
        setSubscriptionStatus({ status: "NONE", daysLeft: null });
      }
    };
    fetchMe();
  }, []);

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const handleBuyNow = async (plan) => {
    if (plan === "TRIAL") {
      // Free Trial is handled via registration - redirect to register page
      router.push("/auth/register");
      return;
    }
    
    if (plan !== "BASIC") return;
    setBuyingPlan(plan);
    try {
      const res = await fetch("/api/checkout/basic", {
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
      
      // Show success message
      alert("Basic Package activated successfully! Your QR codes have been reactivated.");
      
      // Refresh subscription status
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      if (meRes.ok) {
        const meData = await meRes.json();
        setSubscriptionStatus(meData.subscriptionStatus || { status: "NONE", daysLeft: null });
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 w-full">
        {/* Trial countdown banner */}
        {subscriptionStatus?.status === "TRIAL_ACTIVE" && subscriptionStatus.daysLeft != null && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-center">
            <p className="text-sm font-semibold text-gray-900">
              Free trial: <span className="text-indigo-600">{subscriptionStatus.daysLeft} {subscriptionStatus.daysLeft === 1 ? "day" : "days"} remaining</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">Choose a plan below to continue after your trial ends.</p>
          </div>
        )}
        {subscriptionStatus?.status === "TRIAL_EXPIRED" && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <p className="text-sm font-semibold text-amber-800">Your free trial has ended.</p>
            <p className="text-xs text-amber-700 mt-1">Subscribe to a plan to keep creating and using your QR codes.</p>
          </div>
        )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16 max-w-4xl mx-auto">
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

                {/* Buy Now / Start Trial Button */}
                <button
                  type="button"
                  onClick={() => handleBuyNow(plan.id)}
                  disabled={buyingPlan !== null || (plan.id === "TRIAL" && subscriptionStatus?.status === "TRIAL_ACTIVE")}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-base text-white transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed ${
                    plan.popular
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                      : plan.id === "TRIAL"
                      ? "bg-gray-600 hover:bg-gray-700 shadow-lg hover:shadow-xl"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {buyingPlan === plan.id 
                    ? "Processing..." 
                    : plan.id === "TRIAL"
                    ? subscriptionStatus?.status === "TRIAL_ACTIVE" 
                      ? "Trial Active" 
                      : "Start Free Trial"
                    : "Buy Now"}
                </button>

                {/* Features List */}
                <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                  {plan.features.map((feature, index) => (
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

        {/* Billing information from database (same as Account page) */}
        <div className="max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Your{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Billing Information</span>
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-gray-600">Saved billing details for invoices and receipts.</p>
              <Link
                href="/dashboard/account?tab=billing"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Edit in Account →
              </Link>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {billingInfo.billingName && (
                <div className="flex items-start gap-2">
                  <FaBuilding className="mt-0.5 text-indigo-600 w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</p>
                    <p className="text-gray-900">{billingInfo.billingName}</p>
                  </div>
                </div>
              )}
              {billingInfo.billingCompany && (
                <div className="flex items-start gap-2">
                  <FaBuilding className="mt-0.5 text-indigo-600 w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Company</p>
                    <p className="text-gray-900">{billingInfo.billingCompany}</p>
                  </div>
                </div>
              )}
              {billingInfo.billingAddress && (
                <div className="sm:col-span-2 flex items-start gap-2">
                  <FaMapMarkerAlt className="mt-0.5 text-indigo-600 w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</p>
                    <p className="text-gray-900">{billingInfo.billingAddress}</p>
                  </div>
                </div>
              )}
              {billingInfo.billingCity && (
                <div className="flex items-start gap-2">
                  <FaMapMarkerAlt className="mt-0.5 text-indigo-600 w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">City</p>
                    <p className="text-gray-900">{billingInfo.billingCity}</p>
                  </div>
                </div>
              )}
              {billingInfo.billingState && (
                <div className="flex items-start gap-2">
                  <FaMapMarkerAlt className="mt-0.5 text-indigo-600 w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">State</p>
                    <p className="text-gray-900">{billingInfo.billingState}</p>
                  </div>
                </div>
              )}
              {billingInfo.billingZipCode && (
                <div className="flex items-start gap-2">
                  <FaMapMarkerAlt className="mt-0.5 text-indigo-600 w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">ZIP / Postal code</p>
                    <p className="text-gray-900">{billingInfo.billingZipCode}</p>
                  </div>
                </div>
              )}
              {billingInfo.billingCountry && (
                <div className="flex items-start gap-2">
                  <FaMapMarkerAlt className="mt-0.5 text-indigo-600 w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Country</p>
                    <p className="text-gray-900">{billingInfo.billingCountry}</p>
                  </div>
                </div>
              )}
              {billingInfo.taxId && (
                <div className="flex items-start gap-2">
                  <FaFileInvoice className="mt-0.5 text-indigo-600 w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tax ID</p>
                    <p className="text-gray-900">{billingInfo.taxId}</p>
                  </div>
                </div>
              )}
            </div>
            {!billingInfo.billingName && !billingInfo.billingCompany && !billingInfo.billingAddress && !billingInfo.billingCity && !billingInfo.billingState && !billingInfo.billingZipCode && !billingInfo.billingCountry && !billingInfo.taxId && (
              <div className="px-6 pb-6">
                <p className="text-sm text-gray-500">No billing information saved yet.</p>
                <Link href="/dashboard/account?tab=billing" className="inline-block mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                  Add billing details in Account →
                </Link>
              </div>
            )}
          </div>
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
