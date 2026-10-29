// pages/index.js
import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { QRCodeSVG } from "qrcode.react";

import {
  FaCheck,
  FaQrcode,
  FaChartLine,
  FaFolderOpen,
  FaMobileAlt,
  FaGlobe,
  FaShieldAlt,
  FaRocket,
  FaStar,
  FaArrowRight,
  FaCog,
  FaLink,
  FaQuoteLeft,
  FaWifi,
  FaWhatsapp,
  FaInstagram,
  FaUtensils,
  FaStore,
  FaTicketAlt,
  FaHotel,
  FaHome,
  FaBullhorn,
} from "react-icons/fa";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SeoMeta from "@/components/layout/SeoMeta";
import PricingCards, { PricingFootnote } from "@/components/landing/PricingCards";
import { PhonePreview } from "@/components/landing/TypeScreen";
import {
  container,
  sectionSpacing,
  primaryButton,
  secondaryButton,
  heroIntro,
  HeroBackground,
  HeroTitle,
  SectionHeading,
  FeatureGrid,
  StepsList,
  FaqList,
} from "@/components/landing/LandingUi";
import { formatMonthly, cheapestPlan } from "@/lib/billing/price";
import { TRIAL_DAYS } from "@/lib/billing/subscription";
import { SITE_URL } from "@/lib/site";
import { organizationSchema, softwareApplicationSchema, faqPageSchema, pricesForSearch, ORGANIZATION_ID } from "@/lib/seo";

// Server-side auth check
export async function getServerSideProps(context) {
  const { getUserFromRequest } = await import('@/lib/auth');
  const user = await getUserFromRequest(context.req);

  // Plan prices from Razorpay (cached): rupees for visitors in India, dollars everywhere else
  let prices = null;
  let plans = {};
  try {
    const { getPlans, publicPlans, currencyForIp } = await import('@/lib/billing/plans');
    const { getClientIp } = await import('@/lib/clientIp');
    const all = await getPlans();
    plans = publicPlans(all);
    prices = plans[currencyForIp(all, getClientIp(context.req))] || null;
  } catch (err) {
    console.error('Landing prices:', err.message);
  }

  return {
    props: {
      // Only what this page uses: page data is visible in the HTML
      initialUser: user ? { id: user.id, name: user.name || null, subscriptionPlan: user.subscriptionPlan } : null,
      // The visitor's plans by term ({ "3m", "6m", "12m" }) in their currency
      prices,
      // Every currency's price, for the search result text and structured data (the same for every visitor)
      plans,
    },
  };
}

const features = [
  {
    icon: <FaQrcode className="h-5 w-5" />,
    title: "Dynamic QR Codes",
    description: "Update your QR code destinations anytime without reprinting. Perfect for menus, flyers, and marketing materials.",
  },
  {
    icon: <FaChartLine className="h-5 w-5" />,
    title: "QR Code Scan Tracking and Analytics",
    description: "Track scans, locations, devices, and timestamps. Get insights into your audience behavior instantly.",
  },
  {
    icon: <FaFolderOpen className="h-5 w-5" />,
    title: "Folders and Bulk Actions",
    description: "Sort your codes into folders, search and filter them, and pause, move or delete several at once from one dashboard.",
  },
  {
    icon: <FaShieldAlt className="h-5 w-5" />,
    title: "Password Protected QR Codes",
    description: "Ask for a password before your page opens. It's never stored in readable form, and any dynamic code can be paused in one click.",
  },
  {
    icon: <FaMobileAlt className="h-5 w-5" />,
    title: "Mobile Optimized",
    description: "Create QR codes optimized for mobile scanning. Works seamlessly across all devices.",
  },
  {
    icon: <FaGlobe className="h-5 w-5" />,
    title: "Custom QR Codes with Your Logo and Colours",
    description: "Add your logo, colors, and custom frames. Make your QR codes uniquely yours.",
  }
];

const howItWorks = [
  {
    title: 'Sign Up Free',
    description: `Create your account in seconds. No credit card required. Start with a ${TRIAL_DAYS}-day free trial.`,
    icon: <FaRocket className="h-6 w-6" />
  },
  {
    title: 'Create QR Codes',
    description: 'Make QR codes for your website, Wi-Fi, WhatsApp or Instagram in a few clicks.',
    icon: <FaQrcode className="h-6 w-6" />
  },
  {
    title: 'Customize & Track',
    description: 'Design your QR codes with custom colors and logos. Track every scan in real-time.',
    icon: <FaCog className="h-6 w-6" />
  },
  {
    title: 'Update Anytime',
    description: 'Change destinations without reprinting. Your QR codes stay the same, your links evolve.',
    icon: <FaLink className="h-6 w-6" />
  }
];

// Home page FAQ, also sent to search engines as FAQ structured data
function homeFaqs() {
  return [
    {
      question: "What happens to my QR codes if my subscription ends?",
      answer:
        "Your dynamic QR codes are paused, not deleted. Anyone who scans one sees a short \"QR code paused\" page instead of your link. Subscribe again and they switch back on with the same links, so printed codes work again without reprinting. Static codes, such as Wi-Fi codes, hold their content inside the code and keep working.",
    },
    {
      question: "Can I change a QR code's destination after it is printed?",
      answer:
        "Yes, if it's a dynamic code. The printed code holds a short QR-Genie link, and you decide where that link sends people. Change the destination in your dashboard and the next scan goes to the new address. Static codes can't be changed once they're made.",
    },
    {
      question: "What is the difference between a static and a dynamic QR code?",
      answer:
        "A static QR code holds its content, such as a web address or Wi-Fi details, inside the pattern itself, so it can't be edited or tracked. A dynamic QR code holds a short link that forwards people to your content, so you can change the destination later, see how many people scan it, add a password or pause it.",
    },
    {
      question: "Do QR-Genie QR codes expire?",
      answer:
        "No. Dynamic codes work for as long as your free trial or subscription is active, with no expiry date and no scan limit. If your plan ends they're paused rather than deleted, and subscribing again brings them back. Static codes never expire.",
    },
    {
      question: "Can I download QR codes as SVG or PNG for print?",
      answer:
        "Yes. Every code can be downloaded as PNG, SVG, JPEG or PDF, or printed straight from your browser. SVG and PDF stay sharp at any size, which suits posters, signs and packaging.",
    },
    {
      question: "Is there a scan limit on the paid plans?",
      answer: `No. Every plan, 3, 6 or 12 months, has unlimited scans and lets you create as many QR codes as you need. The free trial includes up to 2 codes for ${TRIAL_DAYS} days.`,
    },
    {
      question: "How do the 3, 6 and 12-month plans work?",
      answer: `Every plan has the same features; the longer the plan, the lower the monthly price. You pay upfront for the months you choose, and the plan renews for the same length until you cancel. If you subscribe during your ${TRIAL_DAYS} free days, your paid months start when the free days end, so you don't lose any of them.`,
    },
    {
      question: "Can I move my existing QR codes from another generator?",
      answer:
        "Not directly: a code made with another service points to that service's own link, so only that service can change it. Create a dynamic QR code in QR-Genie for the same destination and use it on your next print run. If your old provider lets you edit the destination, you can point the old code at your new QR-Genie link in the meantime.",
    },
  ];
}

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

const stats = [
  { number: "50K+", label: "Active Users" },
  { number: "2M+", label: "QR Codes Created" },
  { number: "100M+", label: "Scans Tracked" },
  { number: "99.9%", label: "Uptime" }
];

// The kinds of business QR-Genie is made for (shown in the band under the hero); href: its own page, if any
const businessTypes = [
  {
    name: "Restaurants",
    icon: FaUtensils,
    gradient: "from-orange-500 to-red-500",
    textColor: "text-orange-700",
    href: "/restaurant-menu-qr-code"
  },
  {
    name: "Retail",
    icon: FaStore,
    gradient: "from-purple-500 to-pink-500",
    textColor: "text-purple-700"
  },
  {
    name: "Events",
    icon: FaTicketAlt,
    gradient: "from-green-500 to-emerald-500",
    textColor: "text-green-700",
    href: "/qr-codes-for-events"
  },
  {
    name: "Hotels",
    icon: FaHotel,
    gradient: "from-blue-500 to-cyan-500",
    textColor: "text-blue-700",
    href: "/qr-codes-for-hotels"
  },
  {
    name: "Real estate",
    icon: FaHome,
    gradient: "from-indigo-500 to-purple-500",
    textColor: "text-indigo-700",
    href: "/qr-codes-for-real-estate"
  },
  {
    name: "Marketing",
    icon: FaBullhorn,
    gradient: "from-fuchsia-500 to-pink-500",
    textColor: "text-fuchsia-700"
  }
];

// "A QR code for every need": only the types that can be created today (see qrTypes in create-qr.js)
const qrTypeShowcase = [
  {
    id: "website",
    label: "Website",
    tagline: "Open any web page",
    icon: FaGlobe,
    accent: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    qrColor: "#4338ca",
    tab: {
      hover: "hover:ring-indigo-300 hover:shadow-indigo-500/15",
      selected: "ring-2 ring-indigo-500 shadow-indigo-500/20",
      tint: "from-indigo-50",
      chipHover: "group-hover:from-indigo-500 group-hover:to-violet-600 group-hover:shadow-indigo-500/30",
      chipSelected: "from-indigo-500 to-violet-600 shadow-indigo-500/30",
      label: "text-indigo-700",
      labelHover: "group-hover:text-indigo-700",
      bar: "from-indigo-500 to-violet-500",
    },
    kind: "Dynamic",
    title: "Website QR code",
    description:
      "Send people to your menu, booking page, shop or any other page. Because the code is dynamic, you can change where it points after it's printed, and every scan shows up in your analytics.",
    points: [
      "Change the link any time, no reprinting",
      "Scans by day, country and device",
      "Optional password before the page opens",
      "Pause it when a campaign ends",
    ],
    cta: "Create a website QR code",
    page: "/website-qr-code",
  },
  {
    id: "wifi",
    label: "Wi-Fi",
    tagline: "Join a network in one scan",
    icon: FaWifi,
    accent: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    qrColor: "#0e7490",
    tab: {
      hover: "hover:ring-cyan-300 hover:shadow-cyan-500/15",
      selected: "ring-2 ring-cyan-500 shadow-cyan-500/20",
      tint: "from-cyan-50",
      chipHover: "group-hover:from-cyan-500 group-hover:to-sky-600 group-hover:shadow-cyan-500/30",
      chipSelected: "from-cyan-500 to-sky-600 shadow-cyan-500/30",
      label: "text-cyan-700",
      labelHover: "group-hover:text-cyan-700",
      bar: "from-cyan-500 to-sky-500",
    },
    kind: "Static",
    title: "Wi-Fi QR code",
    description:
      "Guests point their camera at the code and join your network straight away, with no long password to read out or type. Made for cafés, hotels, offices and events.",
    points: [
      "Works with the iPhone and Android camera",
      "WPA, WEP and open networks",
      "Hidden networks supported",
      "The details live in the code, nothing to load",
    ],
    cta: "Create a Wi-Fi QR code",
    page: "/wifi-qr-code",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    tagline: "Start a chat with you",
    icon: FaWhatsapp,
    accent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    qrColor: "#047857",
    tab: {
      hover: "hover:ring-emerald-300 hover:shadow-emerald-500/15",
      selected: "ring-2 ring-emerald-500 shadow-emerald-500/20",
      tint: "from-emerald-50",
      chipHover: "group-hover:from-emerald-500 group-hover:to-green-600 group-hover:shadow-emerald-500/30",
      chipSelected: "from-emerald-500 to-green-600 shadow-emerald-500/30",
      label: "text-emerald-700",
      labelHover: "group-hover:text-emerald-700",
      bar: "from-emerald-500 to-green-500",
    },
    kind: "Dynamic",
    title: "WhatsApp QR code",
    description:
      "Let customers message you in one scan. WhatsApp opens with your number and, if you like, a message already typed, so asking a question or placing an order takes seconds.",
    points: [
      "Opens a chat with your number",
      "Optional ready-typed message",
      "See how many people scan it",
      "Great on counters, packaging and flyers",
    ],
    cta: "Create a WhatsApp QR code",
    page: "/whatsapp-qr-code",
  },
  {
    id: "instagram",
    label: "Instagram",
    tagline: "Open your profile",
    icon: FaInstagram,
    accent: "bg-pink-50 text-pink-600 ring-pink-100",
    qrColor: "#be185d",
    tab: {
      hover: "hover:ring-pink-300 hover:shadow-pink-500/15",
      selected: "ring-2 ring-pink-500 shadow-pink-500/20",
      tint: "from-pink-50",
      chipHover: "group-hover:from-amber-400 group-hover:via-pink-500 group-hover:to-purple-600 group-hover:shadow-pink-500/30",
      chipSelected: "from-amber-400 via-pink-500 to-purple-600 shadow-pink-500/30",
      label: "text-pink-700",
      labelHover: "group-hover:text-pink-700",
      bar: "from-pink-500 to-purple-500",
    },
    kind: "Dynamic",
    title: "Instagram QR code",
    description:
      "Turn people who see your posters, packaging or shop window into followers. One scan opens your profile, ready for them to tap Follow.",
    points: [
      "Opens your profile in one scan",
      "Opens in the Instagram app when it's installed",
      "See how many people scan it",
      "Styled in your brand colours",
    ],
    cta: "Create an Instagram QR code",
    page: "/instagram-qr-code",
  },
];

/**
 * Counts a stat such as "50K+", "2M+" or "99.9%" up from zero the first time it scrolls into view.
 * The server HTML and screen readers get the final text; the counting copy is visual only, and an
 * invisible copy of the final text holds the width so nothing shifts. Skipped for reduced motion.
 */
function CountUp({ text, duration = 1600 }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(text);

  useLayoutEffect(() => {
    const el = ref.current;
    const match = text.match(/^([\d.]+)(.*)$/);
    if (!el || !match || !("IntersectionObserver" in window)) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const value = parseFloat(match[1]);
    const suffix = match[2];
    // Small numbers count in tenths so "2M+" doesn't just jump 0, 1, 2
    const decimals = Math.max((match[1].split(".")[1] || "").length, value < 10 ? 1 : 0);
    setDisplay(`${(0).toFixed(decimals)}${suffix}`);

    let frame;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(progress < 1 ? `${(value * eased).toFixed(decimals)}${suffix}` : text);
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text, duration]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span ref={ref} className="inline-grid justify-items-center" aria-hidden="true">
        <span className="invisible col-start-1 row-start-1">{text}</span>
        <span className="col-start-1 row-start-1">{display}</span>
      </span>
    </>
  );
}

// Decorative product preview next to the hero text: a dynamic code, its editable link and a scans chart
function HeroVisual() {
  return (
    <div className="relative mx-auto hidden w-full max-w-md md:block" aria-hidden="true">
      <div className="absolute inset-8 -z-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/30 to-purple-500/30 blur-2xl" />

      <div className="relative rounded-[2rem] bg-white p-6 shadow-2xl shadow-indigo-900/10 ring-1 ring-slate-900/5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FaQrcode className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">Restaurant menu</p>
              <p className="truncate text-xs text-slate-500">qr-genie.co/r/menu</p>
            </div>
          </div>
          <span className="inline-flex flex-none items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>

        <div className="mt-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-7 ring-1 ring-inset ring-indigo-100/70">
          <div className="mx-auto w-fit rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
            <QRCodeSVG
              value={SITE_URL}
              size={176}
              level="H"
              fgColor="#1e1b4b"
              bgColor="#ffffff"
              imageSettings={{ src: "/favicon.png", height: 34, width: 34, excavate: true }}
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
          <FaLink className="h-3.5 w-3.5 flex-none text-indigo-500" />
          <span className="min-w-0 flex-1 truncate text-sm text-slate-700">yourcafe.com/menu</span>
          <span className="flex-none rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">Edit link</span>
        </div>
      </div>

      <div className="absolute -right-4 top-20 w-44 rounded-2xl bg-white p-4 shadow-xl shadow-indigo-900/10 ring-1 ring-slate-900/5 motion-safe:animate-float xl:-right-12">
        <p className="text-xs font-medium text-slate-500">Scans this week</p>
        <div className="mt-3 flex h-12 items-end gap-1.5">
          {[38, 52, 34, 66, 58, 84, 100].map((height, i) => (
            <span
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-indigo-500 to-purple-400"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>

      <div className="absolute -left-4 bottom-20 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-indigo-900/10 ring-1 ring-slate-900/5 motion-safe:animate-float motion-safe:[animation-delay:-3s] xl:-left-12">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <FaCheck className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">Link updated</p>
          <p className="text-xs text-slate-500">No reprint needed</p>
        </div>
      </div>
    </div>
  );
}

// Tabs for the QR code types we offer, with a description and a phone showing the result of a scan
function QrTypesShowcase({ isAuthenticated }) {
  const [active, setActive] = useState(qrTypeShowcase[0].id);
  const tabRefs = useRef([]);
  const ctaHref = (type) => (isAuthenticated ? `/dashboard/create-qr?type=${type.id}` : "/auth/register");

  // Arrow keys, Home and End move between the tabs
  const onTabKeyDown = (e, index) => {
    const last = qrTypeShowcase.length - 1;
    const next = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setActive(qrTypeShowcase[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <>
      <div role="tablist" aria-label="QR code types" className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 lg:mt-14">
        {qrTypeShowcase.map((type, index) => {
          const selected = type.id === active;
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              ref={(el) => (tabRefs.current[index] = el)}
              id={`qr-type-tab-${type.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`qr-type-panel-${type.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(type.id)}
              onKeyDown={(e) => onTabKeyDown(e, index)}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-white px-3 py-3 text-left shadow-lg transition duration-300 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 motion-reduce:transform-none sm:flex-col sm:gap-0 sm:py-5 sm:text-center ${
                selected
                  ? type.tab.selected
                  : `shadow-transparent ring-1 ring-slate-200 hover:-translate-y-1 ${type.tab.hover}`
              }`}
            >
              {/* Hover (and selected): a tint in the type's colour fades in from the top, and a sheen sweeps across once */}
              <span
                className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${type.tab.tint} to-transparent transition-opacity duration-300 ${
                  selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute inset-0 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden"
                aria-hidden="true"
              />
              {/* The icon tile fills with the type's gradient and pops with a slight tilt */}
              <span
                className={`relative flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset transition-all duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110 group-hover:text-white group-hover:shadow-md group-hover:ring-transparent motion-reduce:transform-none sm:h-12 sm:w-12 ${
                  selected ? `${type.tab.chipSelected} text-white shadow-md ring-transparent` : `${type.accent} ${type.tab.chipHover}`
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="relative min-w-0 sm:mt-3">
                <span
                  className={`block font-display text-[15px] font-semibold transition-colors duration-300 ${
                    selected ? type.tab.label : `text-slate-900 ${type.tab.labelHover}`
                  }`}
                >
                  {type.label}
                </span>
                <span className="mt-0.5 hidden text-xs text-slate-500 sm:block">{type.tagline}</span>
                {/* Underline in the type's colours that grows on hover and stays on the selected tab */}
                <span
                  className={`mx-auto mt-2.5 hidden h-0.5 rounded-full bg-gradient-to-r ${type.tab.bar} transition-all duration-300 ease-out sm:block ${
                    selected ? "w-8 opacity-100" : "w-0 opacity-0 group-hover:w-8 group-hover:opacity-100"
                  }`}
                  aria-hidden="true"
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative isolate mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-50 via-white to-purple-50 ring-1 ring-indigo-100 lg:mt-10">
        <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" aria-hidden="true" />

        {/* Every type's panel is in the page (search engines read them all); only the selected one is shown */}
        {qrTypeShowcase.map((type) => {
          const TypeIcon = type.icon;
          return (
            <div
              key={type.id}
              id={`qr-type-panel-${type.id}`}
              role="tabpanel"
              aria-labelledby={`qr-type-tab-${type.id}`}
              hidden={type.id !== active}
            >
              <div className="grid items-center gap-10 p-5 motion-safe:animate-fade-in sm:gap-12 sm:p-10 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:p-14">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${type.accent}`}>
                      <TypeIcon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                      {type.kind} QR code
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl font-bold tracking-[-0.01em] text-slate-900 sm:text-3xl">{type.title}</h3>
                  <p className="mt-3 text-pretty leading-relaxed text-slate-600 sm:text-lg">{type.description}</p>
                  <ul className="mt-7 grid gap-3.5 sm:grid-cols-2">
                    {type.points.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-[15px] text-slate-700">
                        <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <FaCheck className="h-2.5 w-2.5" />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                    <Link href={ctaHref(type)} className={primaryButton}>
                      {type.cta}
                      <FaArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
                    </Link>
                    <Link
                      href={type.page}
                      className="group/more inline-flex items-center justify-center gap-1.5 text-[15px] font-semibold !text-indigo-700 transition-colors hover:!text-purple-700"
                    >
                      More about {type.label} QR codes
                      <FaArrowRight className="h-3 w-3 transition-transform group-hover/more:translate-x-1 motion-reduce:transform-none" />
                    </Link>
                  </div>
                  <p className="mt-4 text-center text-sm text-slate-600 sm:text-left">Your colours, logo and frame on every type</p>
                </div>

                {/* Phone showing the result of a scan, with the code beside it */}
                <PhonePreview type={type.id} qrColor={type.qrColor} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function Landing({ initialUser, prices = null, plans = {} }) {
  const router = useRouter();
  // The server already knows who is signed in, so the right buttons are in the first HTML (no placeholder flash)
  const currentUser = initialUser;
  const isAuthenticated = !!currentUser;

  // The visitor's lowest monthly price ("₹2,000/month" in India, "$19.99/month" elsewhere) for the pricing heading
  const fromPrice = formatMonthly(cheapestPlan(prices));
  const faqs = homeFaqs();

  // Search result text and structured data are the same for every visitor, with both currencies' prices
  const searchPrices = pricesForSearch(plans);
  const metaDescription =
    `Create dynamic QR codes you can edit anytime. Track scans by device and location, add your logo and try it free for ${TRIAL_DAYS} days.` +
    (searchPrices ? ` From ${searchPrices}.` : "");
  const structuredData = [
    organizationSchema,
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "QR-Genie", url: `${SITE_URL}/`, publisher: { "@id": ORGANIZATION_ID } },
    softwareApplicationSchema({ description: metaDescription, plans }),
    faqPageSchema(faqs),
  ];

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

  return (
    <div className="min-h-screen bg-white">
      <SeoMeta title="Dynamic QR Code Generator with Tracking | QR-Genie" description={metaDescription} path="/" jsonLd={structuredData} />

      <SiteHeader isAuthenticated={isAuthenticated} onLogout={handleLogout} />

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <HeroBackground />

          <div className={`${container} pb-16 pt-14 sm:pb-20 sm:pt-20 lg:pt-24`}>
            <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_1fr] lg:gap-10 xl:gap-16">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100">
                  <FaRocket className="h-3.5 w-3.5" />
                  Trusted by 50,000+ businesses worldwide
                </div>

                <HeroTitle title="Dynamic QR Code" highlight="Generator" subtitle="Edit links anytime, track every scan" />

                <p className={`${heroIntro} lg:mx-0`}>
                  Create, manage, and track editable QR codes. Update your links anytime without reprinting.
                  Perfect for restaurants, events, marketing campaigns, and more.
                </p>

                <div className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center lg:justify-start">
                  {isAuthenticated ? (
                    <Link href="/dashboard" className={primaryButton}>
                      Go to Dashboard
                      <FaArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
                    </Link>
                  ) : (
                    <>
                      <Link href="/auth/register" className={primaryButton}>
                        Get Started Free
                        <FaArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
                      </Link>
                      <Link href="#how-it-works" className={secondaryButton}>
                        Learn More
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <HeroVisual />
            </div>

            {/* Stats: open and light, on the hero background, with big gradient numbers that count up when seen */}
            <div className="relative mt-16 lg:mt-20">
              <div
                className="pointer-events-none absolute inset-x-0 -inset-y-10 -z-10 bg-[radial-gradient(ellipse_45%_40%_at_50%_55%,rgb(224_231_255/0.6),transparent)]"
                aria-hidden="true"
              />
              <div className="mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-indigo-200 to-transparent" aria-hidden="true" />
              <div className="grid grid-cols-2 gap-y-8 pt-10 sm:grid-cols-4 sm:gap-y-10 sm:pt-14">
                {stats.map((stat, i) => (
                  <div key={stat.label} className="group relative cursor-pointer px-2 text-center">
                    {i > 0 && (
                      <span
                        className="absolute left-0 top-1/2 hidden h-20 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-slate-200 to-transparent sm:block"
                        aria-hidden="true"
                      />
                    )}
                    <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 bg-clip-text pb-1 font-sans text-4xl font-bold leading-none tracking-[-0.03em] text-transparent tabular-nums transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transform-none sm:text-5xl lg:text-6xl">
                      <CountUp text={stat.number} />
                    </div>
                    <span
                      className="mx-auto mt-4 block h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50 transition-all duration-300 group-hover:w-14 group-hover:opacity-100 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                    <div className="mt-3 text-sm font-medium text-slate-600 sm:text-base">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Business types */}
        {/* The cards keep their original design (gradient fill, shine on hover) at the owner's request; only the
            band around them is styled. Its own tinted band so it doesn't run into the stats above. No z-index or
            isolate here: that would change how the cards' hover layers stack. */}
        <section className="relative border-y border-gray-200/70 bg-gray-50 py-16 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(99_102_241/0.14)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_65%_75%_at_50%_50%,#000_10%,transparent_100%)]"
            aria-hidden="true"
          />
          <div className={`relative ${container}`}>
            <div className="mb-10 text-center sm:mb-12">
              <div className="flex items-center justify-center gap-4">
                <span className="hidden h-px w-16 bg-gradient-to-r from-transparent to-indigo-300 sm:block" aria-hidden="true" />
                <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700 sm:text-sm">
                  Made for every kind of business
                </p>
                <span className="hidden h-px w-16 bg-gradient-to-l from-transparent to-indigo-300 sm:block" aria-hidden="true" />
              </div>
              <h2 className="mt-3 text-balance font-display text-xl font-semibold tracking-[-0.01em] text-slate-900 sm:text-2xl">
                Dynamic QR codes for restaurants, retail, events and real estate
              </h2>
            </div>

            {/* Cards with their own page (restaurants, events, hotels, real estate) link to it */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6 max-w-5xl mx-auto">
              {businessTypes.map((business) => {
                const Card = business.href ? Link : "div";
                return (
                  <Card key={business.name} {...(business.href ? { href: business.href } : {})} className="group relative block">
                    {/* Logo Card */}
                    <div className="relative overflow-hidden rounded-2xl p-3 sm:p-6 bg-white border-2 border-gray-200 hover:border-transparent transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-gray-200/50 hover:-translate-y-2 motion-reduce:transform-none cursor-pointer">
                      {/* Gradient Background on Hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${business.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                      {/* Icon */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${business.gradient} flex items-center justify-center font-display text-white font-bold text-base sm:text-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 motion-reduce:transform-none mb-3`}>
                          <business.icon className="h-5 w-5 sm:h-7 sm:w-7" aria-hidden="true" />
                        </div>

                        {/* Business type */}
                        <div className="text-center">
                          <p className={`text-xs sm:text-sm font-semibold group-hover:text-white transition-colors duration-300 ${business.textColor}`}>
                            {business.name}
                          </p>
                        </div>
                      </div>

                      {/* Shine Effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 motion-reduce:hidden"></div>
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
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${business.gradient} opacity-0 group-hover:opacity-20 blur-xl -z-10 transition-opacity duration-300`}></div>
                  </Card>
                );
              })}
            </div>

            {/* Additional Trust Badge */}
            <div className="mt-10 text-center sm:mt-12">
              <div className="inline-flex items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5 shadow-sm ring-1 ring-slate-200/80">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-600/30">
                  <FaCheck className="h-3 w-3" />
                </span>
                <span className="text-sm font-medium text-slate-700">
                  Free for <span className="font-semibold text-slate-900">{TRIAL_DAYS} days</span>, no card needed
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* QR code types */}
        <section id="qr-types" className={`bg-white ${sectionSpacing}`}>
          <div className={container}>
            <SectionHeading
              eyebrow="QR code types"
              title="Create website, Wi-Fi, WhatsApp and Instagram QR codes"
              description="Choose what happens when someone scans: open your website, join your Wi-Fi, start a WhatsApp chat or visit your Instagram. Every type is styled with your own colours and logo."
            />
            <QrTypesShowcase isAuthenticated={isAuthenticated} />
          </div>
        </section>

        {/* Features */}
        <section id="features" className={`border-t border-slate-100 bg-white ${sectionSpacing}`}>
          <div className={container}>
            <SectionHeading
              eyebrow="Features"
              title="QR code generator features: tracking, branding and security"
              description="Powerful features designed to make QR code management simple and effective"
            />
            <FeatureGrid items={features} />
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className={`relative isolate overflow-hidden bg-slate-50 ${sectionSpacing}`}>
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgb(224_231_255/0.8),transparent)]"
            aria-hidden="true"
          />
          <div className={container}>
            <SectionHeading
              eyebrow="How It Works"
              title="How to create a dynamic QR code in 4 steps"
              description="Simple steps to create and manage your dynamic QR codes"
            />
            <StepsList steps={howItWorks} />
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className={`bg-white ${sectionSpacing}`}>
          <div className={container}>
            <SectionHeading
              eyebrow="Pricing"
              title={`Dynamic QR code pricing: ${TRIAL_DAYS}-day free trial, plans from ${fromPrice || "one low monthly price"}`}
              description={`Try every feature free for ${TRIAL_DAYS} days, no card needed. Then pick 3, 6 or 12 months: the longer the plan, the lower the monthly price.`}
            />
            <PricingCards prices={prices} currentUser={currentUser} />
            <PricingFootnote />
            {/* Leads to the full pricing page: plan comparison, payment methods and everything included */}
            <div className="mx-auto mt-12 flex max-w-4xl flex-col items-center gap-6 rounded-3xl bg-gradient-to-r from-indigo-50 via-white to-purple-50 px-6 py-8 text-center ring-1 ring-indigo-100 transition duration-300 hover:shadow-lg hover:shadow-indigo-900/5 sm:px-10 md:flex-row md:justify-between md:text-left">
              <div>
                <h3 className="font-display text-xl font-bold tracking-[-0.015em] text-slate-900">Compare every plan side by side</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">
                  See the full plan comparison, the ways you can pay and everything that comes with every plan.
                </p>
              </div>
              <Link
                href="/pricing"
                className="btn-shine group inline-flex flex-none items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-[15px] font-semibold !text-white shadow-lg shadow-indigo-600/20 transition duration-300 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 motion-reduce:transform-none"
              >
                See full pricing
                <FaArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none" />
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className={`relative isolate overflow-hidden bg-slate-50 ${sectionSpacing}`}>
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgb(237_233_254/0.9),transparent)]"
            aria-hidden="true"
          />
          <div className={container}>
            <SectionHeading
              eyebrow="Testimonials"
              title="Loved by businesses worldwide"
              description="See what our customers have to say about QR-Genie"
            />

            <div className="mt-12 grid gap-4 sm:mt-14 sm:gap-6 md:grid-cols-2 lg:mt-16 lg:gap-8">
              {testimonials.map((testimonial) => (
                <figure
                  key={testimonial.name}
                  className="relative flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 transition duration-300 hover:shadow-lg hover:shadow-indigo-900/5 sm:p-9"
                >
                  <FaQuoteLeft className="absolute right-6 top-6 h-7 w-7 text-indigo-100 sm:right-9 sm:top-9 sm:h-8 sm:w-8" aria-hidden="true" />
                  <div className="flex gap-1" role="img" aria-label={`Rated ${testimonial.rating} out of 5`}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar key={i} className="h-4 w-4 text-amber-400" aria-hidden="true" />
                    ))}
                  </div>

                  <blockquote className="mt-4 flex-1 text-pretty text-[15px] leading-relaxed sm:mt-5 sm:text-[17px] text-slate-700">
                    <p>&ldquo;{testimonial.content}&rdquo;</p>
                  </blockquote>

                  <figcaption className="mt-7 flex items-center gap-4 border-t border-slate-100 pt-6">
                    <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 font-display text-sm font-bold text-white shadow-md shadow-indigo-600/20">
                      {testimonial.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-slate-900">{testimonial.name}</p>
                      <p className="text-sm text-slate-600">{testimonial.role}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{testimonial.company}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ (the same questions go to search engines as FAQ structured data). Little bottom padding: the
            footer's sign-up panel brings its own space */}
        <section id="faq" className="bg-white pb-4 pt-16 sm:pt-24 lg:pt-28">
          <div className={container}>
            <SectionHeading
              eyebrow="FAQ"
              title="Frequently asked questions"
              description="Straight answers about dynamic QR codes, your plan and what happens to printed codes."
            />
            <FaqList faqs={faqs} />
          </div>
        </section>
      </main>

      <SiteFooter showCta isAuthenticated={isAuthenticated} />
    </div>
  );
}
