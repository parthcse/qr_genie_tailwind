// pages/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";

import { 
  FaCheck, 
  FaQrcode, 
  FaChartLine, 
  FaUsers, 
  FaLock, 
  FaMobileAlt,
  FaGlobe,
  FaShieldAlt,
  FaRocket,
  FaStar,
  FaArrowRight,
  FaInfinity,
  FaClock,
  FaHeadset,
  FaCog,
  FaFileAlt,
  FaLink,
  FaEye,
  FaDownload
} from "react-icons/fa";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import CurrencySwitch from "../components/CurrencySwitch";
import { formatPrice, formatPeriod } from "../lib/price";
// Reusable auth hook for checking authentication state
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on client side
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include' // Important for sending cookies
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { user, loading };
}

// Server-side auth check
export async function getServerSideProps(context) {
  const { getUserFromRequest } = await import('../lib/auth');
  const user = await getUserFromRequest(context.req);

  // Basic Package prices from Razorpay (cached), shown in rupees to visitors in India and dollars elsewhere
  let plans = {};
  let defaultCurrency = null;
  try {
    const { getBasicPlans, publicPlans, pickDefaultCurrency } = await import('../lib/plans');
    const { getClientIp } = await import('../lib/clientIp');
    const all = await getBasicPlans();
    plans = publicPlans(all);
    defaultCurrency = pickDefaultCurrency(all, { ip: getClientIp(context.req) });
  } catch (err) {
    console.error('Landing prices:', err.message);
  }

  return {
    props: {
      // Pass initial auth state from server to avoid flashing
      initialUser: user ? JSON.parse(JSON.stringify(user)) : null,
      plans,
      defaultCurrency,
    },
  };
}

const features = [
  {

    icon: <FaQrcode className="h-6 w-6" />,
    title: "Dynamic QR Codes",
    description: "Update your QR code destinations anytime without reprinting. Perfect for menus, flyers, and marketing materials.",
    color: "from-blue-500 to-indigo-600"
  },
  {
    icon: <FaChartLine className="h-6 w-6" />,
    title: "Real-time Analytics",
    description: "Track scans, locations, devices, and timestamps. Get insights into your audience behavior instantly.",
    color: "from-purple-500 to-pink-600"
  },
  {
    icon: <FaUsers className="h-6 w-6" />,
    title: "Team Collaboration",
    description: "Share access with your team members. Manage multiple QR codes from one dashboard.",
    color: "from-green-500 to-emerald-600"
  },
  {
    icon: <FaShieldAlt className="h-6 w-6" />,
    title: "Secure & Private",
    description: "Enterprise-grade security with password protection and custom domain options.",
    color: "from-red-500 to-orange-600"
  },
  {
    icon: <FaMobileAlt className="h-6 w-6" />,
    title: "Mobile Optimized",
    description: "Create QR codes optimized for mobile scanning. Works seamlessly across all devices.",
    color: "from-yellow-500 to-amber-600"
  },
  {
    icon: <FaGlobe className="h-6 w-6" />,
    title: "Custom Branding",
    description: "Add your logo, colors, and custom frames. Make your QR codes uniquely yours.",
    color: "from-cyan-500 to-blue-600"
  }
];

const howItWorks = [
  {
    number: '1',
    title: 'Sign Up Free',
    description: 'Create your account in seconds. No credit card required. Start with our free plan.',
    icon: <FaRocket className="h-8 w-8" />
  },
  {
    number: '2',
    title: 'Create QR Codes',
    description: 'Generate unlimited dynamic QR codes. Link to websites, PDFs, vCards, and more.',
    icon: <FaQrcode className="h-8 w-8" />
  },
  {
    number: '3',
    title: 'Customize & Track',
    description: 'Design your QR codes with custom colors and logos. Track every scan in real-time.',
    icon: <FaCog className="h-8 w-8" />
  },
  {
    number: '4',
    title: 'Update Anytime',
    description: 'Change destinations without reprinting. Your QR codes stay the same, your links evolve.',
    icon: <FaLink className="h-8 w-8" />
  }
];

const testimonials = [
  {

    name: "Sarah Chen",
    role: "Marketing Director at TechCorp",
    content: "QR-Genie has completely transformed our marketing campaigns. We can update our QR codes instantly without reprinting materials. The analytics are incredibly detailed and help us understand our audience better.",
    avatar: "SC",
    rating: 5,
    company: "TechCorp"
  },
  {
    name: "Michael Rodriguez",
    role: "Restaurant Owner",
    content: "As a restaurant owner, I update my menu frequently. QR-Genie makes it so easy - I just change the link and my QR codes automatically update. Customer support is fantastic too!",
    avatar: "MR",
    rating: 5,
    company: "Bella Vista Restaurant"
  },
  {
    name: "Emily Johnson",
    role: "Event Manager",
    content: "We use QR-Genie for all our events. The ability to track scans and see where our attendees are coming from is invaluable. Highly recommend!",
    avatar: "EJ",
    rating: 5,
    company: "EventPro Solutions"
  },
  {
    name: "David Kim",
    role: "E-commerce Director",
    content: "The custom branding features are amazing. Our QR codes match our brand perfectly, and the real-time analytics help us optimize our campaigns on the fly.",
    avatar: "DK",
    rating: 5,
    company: "ShopSmart Inc"
  }
];

const pricingPlans = [
  {
    name: "Free Trial",
    period: "for 14 days",
    description: "Perfect for getting started",
    features: [
      "14-day full access",
      "Create up to 2 QR codes",
      "All QR code types",
      "Dynamic link updates",
      "Basic analytics",
      "Email support"
    ],
    cta: "Start Free Trial",
    popular: false,
    color: "border-gray-200"
  },
  {
    name: "Basic Package",
    description: "For individuals and small businesses",
    features: [
      "Unlimited QR codes",
      "All QR code types",
      "Dynamic link updates",
      "Basic analytics",
      "Email support",
      "Cancel anytime"
    ],
    cta: "Subscribe Now",
    popular: true,
    color: "border-indigo-500"
  }
];

const stats = [
  { number: "50K+", label: "Active Users" },
  { number: "2M+", label: "QR Codes Created" },
  { number: "100M+", label: "Scans Tracked" },
  { number: "99.9%", label: "Uptime" }
];

const companies = [
  {
    name: "TechCorp",
    logo: "TC",
    gradient: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700"
  },
  {
    name: "ShopSmart",
    logo: "SS",
    gradient: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700"
  },
  {
    name: "EventPro",
    logo: "EP",
    gradient: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    textColor: "text-green-700"
  },
  {
    name: "Bella Vista",
    logo: "BV",
    gradient: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700"
  },
  {
    name: "GlobalBiz",
    logo: "GB",
    gradient: "from-indigo-500 to-purple-500",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700"
  },
  {
    name: "CloudSync",
    logo: "CS",
    gradient: "from-indigo-500 to-purple-500",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700"
  }
];

export default function Landing({ initialUser, plans = {}, defaultCurrency = null }) {
  // Use auth hook with initial server state
  const { user, loading } = useAuth();
  const router = useRouter();

  // Pricing: real Razorpay prices in the visitor's currency, switchable when both are offered
  const [currency, setCurrency] = useState(defaultCurrency);
  const availableCurrencies = ["INR", "USD"].filter((c) => plans[c]);
  const basicPlan = currency ? plans[currency] : null;
  const displayPlans = pricingPlans.map((plan) =>
    plan.name === "Basic Package"
      ? {
          ...plan,
          price: basicPlan ? formatPrice(basicPlan.amount, basicPlan.currency) : "—",
          period: basicPlan ? formatPeriod(basicPlan.period, basicPlan.interval) : "",
        }
      : { ...plan, price: formatPrice(0, currency || "USD") }
  );
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  // Use server-provided user initially, then update with client state
  const currentUser = user || initialUser;
  const isAuthenticated = !!currentUser;

  // Fetch subscription status for logged-in users
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const fetchSubscriptionStatus = async () => {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setSubscriptionStatus(data.subscriptionStatus || { status: "NONE", daysLeft: null });
          }
        } catch (error) {
          console.error('Failed to fetch subscription status:', error);
          setSubscriptionStatus({ status: "NONE", daysLeft: null });
        }
      };
      fetchSubscriptionStatus();
    }
  }, [isAuthenticated, currentUser]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Always send the user to the logout confirmation page
      router.push('/auth/logout');
    }
  };

  // Dynamic CTA component to avoid layout shift
  const CallToAction = () => {
    if (loading) {

      return (
        <div className="mt-8 max-w-2xl mx-auto sm:flex sm:justify-center gap-4">
          <div className="w-full sm:w-48 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="w-full sm:w-48 h-12 bg-gray-200 rounded-lg animate-pulse mt-3 sm:mt-0"></div>
        </div>
      );
    }

    if (isAuthenticated) {

      return (
        <div className="mt-8 max-w-2xl mx-auto sm:flex sm:justify-center">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 !text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Go to Dashboard
            <FaArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      );
    }


    return (
      <div className="mt-8 max-w-2xl mx-auto sm:flex sm:justify-center gap-4">
        <Link
          href={isAuthenticated ? "/dashboard" : "/auth/register"}
          className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 !text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
          <FaArrowRight className="ml-2 h-4 w-4" />
        </Link>
        <Link
          href="#how-it-works"
          className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border-2 border-indigo-300 text-base font-semibold rounded-xl text-indigo-700 bg-white hover:bg-indigo-50 hover:border-indigo-200 shadow-md hover:shadow-lg transition-all duration-200"
        >
          Learn More
        </Link>
      </div>
    );
  };

  return (

    <div className="min-h-screen bg-white">
      <Head>
        <title>QR-Genie | Dynamic QR Code Solution for Modern Businesses</title>
        <meta name="description" content="Create, manage, and track dynamic QR codes with QR-Genie. Update your links anytime without reprinting. Perfect for restaurants, events, and marketing campaigns." />
        <meta name="keywords" content="QR codes, dynamic QR codes, QR code generator, QR code analytics, QR code tracking" />
      </Head>

      <SiteHeader isAuthenticated={isAuthenticated} loading={loading} onLogout={handleLogout} />

      {/* Hero Section */}

      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-site mx-auto py-20 px-4 sm:py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold mb-8">
              <FaRocket className="h-4 w-4 mr-2" />
              Trusted by 50,000+ businesses worldwide
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight">
              <span className="block">QR Codes That</span>
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Work For You
              </span>
            </h1>
            
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed">
              Create, manage, and track dynamic QR codes. Update your links anytime without reprinting. 
              Perfect for restaurants, events, marketing campaigns, and more.
            </p>
            
            {/* Dynamic CTA buttons */}
            <CallToAction />

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900">{stat.number}</div>
                  <div className="mt-2 text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* Trust Indicators */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16 border-b border-gray-100">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-2">
              Trusted by innovative companies
            </p>
            <p className="text-xs text-gray-400">
              Join thousands of businesses using QR-Genie
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
            {companies.map((company, index) => (
              <div
                key={index}
                className="group relative"
              >
                {/* Logo Card */}
                <div className={`
                  relative overflow-hidden rounded-2xl p-6 
                  bg-white border-2 border-gray-200 
                  hover:border-transparent
                  transition-all duration-300 ease-out
                  hover:shadow-2xl hover:shadow-gray-200/50
                  hover:-translate-y-2
                  cursor-pointer
                `}>
                  {/* Gradient Background on Hover */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-br ${company.gradient}
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-300
                  `}></div>
                  
                  {/* Logo Circle */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`
                      w-16 h-16 rounded-xl
                      bg-gradient-to-br ${company.gradient}
                      flex items-center justify-center
                      text-white font-bold text-xl
                      shadow-lg
                      group-hover:scale-110 group-hover:rotate-3
                      transition-all duration-300
                      mb-3
                    `}>
                      {company.logo}
                    </div>
                    
                    {/* Company Name */}
                    <div className="text-center">
                      <p className={`
                        text-sm font-semibold
                        group-hover:text-white
                        transition-colors duration-300
                        ${company.textColor}
                      `}>
                        {company.name}
                      </p>
                    </div>
                  </div>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>
                  
                  {/* Decorative Dots */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Glow Effect */}
                <div className={`
                  absolute inset-0 rounded-2xl
                  bg-gradient-to-br ${company.gradient}
                  opacity-0 group-hover:opacity-20
                  blur-xl -z-10
                  transition-opacity duration-300
                `}></div>
              </div>
            ))}
          </div>
          
          {/* Additional Trust Badge */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
              <FaCheck className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">
                Used by 50,000+ businesses worldwide
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold mb-4">
              Features
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make QR code management simple and effective
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300"
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-purple-100 text-purple-800 text-sm font-semibold mb-4">
              How It Works
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Get started in minutes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to create and manage your dynamic QR codes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-indigo-300 to-purple-300 transform translate-x-4"></div>
                )}
                
                <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-xl shadow-lg">
                      {step.number}
                    </div>
                    <div className="text-gray-300">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-semibold mb-4">
              Pricing
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free for 14 days, no card needed. Cancel anytime.
            </p>
            <CurrencySwitch currencies={availableCurrencies} value={currency} onChange={setCurrency} className="mt-8" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {displayPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl border-2 ${plan.color} p-8 shadow-lg hover:shadow-2xl transition-all duration-300 ${plan.popular ? 'scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-extrabold text-gray-900 tabular-nums">{plan.price}</span>
                    {plan.period && <span className="ml-2 text-gray-600">{plan.period}</span>}
                  </div>
                  <p className="mt-2 text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <FaCheck className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {(() => {
                  // Determine button behavior based on authentication and subscription status
                  const isFreeTrialPlan = plan.name === "Free Trial";
                  const isBasicPlan = plan.name === "Basic Package";
                  
                  let buttonHref = "/auth/register";
                  let buttonText = plan.cta;
                  let isDisabled = false;
                  
                  if (isAuthenticated) {
                    if (isFreeTrialPlan) {
                      // Free Trial plan for logged-in users
                      if (subscriptionStatus?.status === "TRIAL_ACTIVE") {
                        buttonHref = "/dashboard";
                        buttonText = "Trial Active - Go to Dashboard";
                        isDisabled = false;
                      } else {
                        // User is logged in but not on trial (expired or has Basic Package)
                        buttonHref = "/dashboard";
                        buttonText = "Go to Dashboard";
                        isDisabled = false;
                      }
                    } else if (isBasicPlan) {
                      // Basic Package plan for logged-in users
                      if (subscriptionStatus?.status === "SUBSCRIPTION_ACTIVE" && currentUser?.subscriptionPlan === "BASIC") {
                        buttonHref = "/dashboard/billing";
                        buttonText = "Manage Plan";
                        isDisabled = false;
                      } else {
                        // User needs to subscribe or upgrade
                        buttonHref = "/dashboard/billing";
                        buttonText = subscriptionStatus?.status === "TRIAL_EXPIRED" ? "Upgrade Now" : "Subscribe Now";
                        isDisabled = false;
                      }
                    }
                  }
                  
                  // For logged-out users, keep default behavior
                  if (isDisabled) {
                    return (
                      <button
                        disabled
                        className={`block w-full text-center py-4 px-6 rounded-xl font-semibold transition-all duration-200 opacity-60 cursor-not-allowed ${
                          plan.popular
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 !text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {buttonText}
                      </button>
                    );
                  }
                  
                  return (
                    <Link
                      href={buttonHref}
                      className={`block w-full text-center py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                        plan.popular
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 !text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                          : "bg-gray-100 text-gray-900 hover:bg-indigo-50 hover:text-indigo-900"
                      }`}
                    >
                      {buttonText}
                    </Link>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Loved by businesses worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our customers have to say about QR-Genie
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center mb-6">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-xs text-gray-500 mt-1">{testimonial.company}</p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="h-5 w-5 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-gray-700 leading-relaxed italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>

      </section>

      <SiteFooter showCta isAuthenticated={isAuthenticated} />

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
