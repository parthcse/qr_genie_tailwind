// pages/index.js
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { QRCodeSVG } from "qrcode.react";

import {
  FaCheck,
  FaQrcode,
  FaChartLine,
  FaUsers,
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
  FaLock,
  FaPaperPlane,
  FaUtensils,
  FaStore,
  FaTicketAlt,
  FaHotel,
  FaHome,
  FaBullhorn,
} from "react-icons/fa";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { formatPrice, formatPeriod } from "../lib/price";
import { BASIC_PLAN_FEATURES } from "../lib/site";

const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://qr-genie.co").replace(/\/$/, "");

// Server-side auth check
export async function getServerSideProps(context) {
  const { getUserFromRequest } = await import('../lib/auth');
  const user = await getUserFromRequest(context.req);

  // Basic Package price from Razorpay (cached): rupees for visitors in India, dollars everywhere else
  let basicPlan = null;
  try {
    const { getBasicPlans, publicPlans, currencyForIp } = await import('../lib/plans');
    const { getClientIp } = await import('../lib/clientIp');
    const all = await getBasicPlans();
    basicPlan = publicPlans(all)[currencyForIp(all, getClientIp(context.req))] || null;
  } catch (err) {
    console.error('Landing prices:', err.message);
  }

  return {
    props: {
      initialUser: user ? JSON.parse(JSON.stringify(user)) : null,
      basicPlan,
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
    title: "Real-time Analytics",
    description: "Track scans, locations, devices, and timestamps. Get insights into your audience behavior instantly.",
  },
  {
    icon: <FaUsers className="h-5 w-5" />,
    title: "Team Collaboration",
    description: "Share access with your team members. Manage multiple QR codes from one dashboard.",
  },
  {
    icon: <FaShieldAlt className="h-5 w-5" />,
    title: "Secure & Private",
    description: "Enterprise-grade security with password protection and custom domain options.",
  },
  {
    icon: <FaMobileAlt className="h-5 w-5" />,
    title: "Mobile Optimized",
    description: "Create QR codes optimized for mobile scanning. Works seamlessly across all devices.",
  },
  {
    icon: <FaGlobe className="h-5 w-5" />,
    title: "Custom Branding",
    description: "Add your logo, colors, and custom frames. Make your QR codes uniquely yours.",
  }
];

const howItWorks = [
  {
    number: '1',
    title: 'Sign Up Free',
    description: 'Create your account in seconds. No credit card required. Start with our free plan.',
    icon: <FaRocket className="h-6 w-6" />
  },
  {
    number: '2',
    title: 'Create QR Codes',
    description: 'Generate unlimited dynamic QR codes. Link to websites, PDFs, vCards, and more.',
    icon: <FaQrcode className="h-6 w-6" />
  },
  {
    number: '3',
    title: 'Customize & Track',
    description: 'Design your QR codes with custom colors and logos. Track every scan in real-time.',
    icon: <FaCog className="h-6 w-6" />
  },
  {
    number: '4',
    title: 'Update Anytime',
    description: 'Change destinations without reprinting. Your QR codes stay the same, your links evolve.',
    icon: <FaLink className="h-6 w-6" />
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
  },
  {
    name: "Basic Package",
    description: "For individuals and small businesses",
    features: BASIC_PLAN_FEATURES,
    cta: "Subscribe Now",
    popular: true,
  }
];

const stats = [
  { number: "50K+", label: "Active Users" },
  { number: "2M+", label: "QR Codes Created" },
  { number: "100M+", label: "Scans Tracked" },
  { number: "99.9%", label: "Uptime" }
];

// The kinds of business QR-Genie is made for (shown in the band under the hero)
const businessTypes = [
  {
    name: "Restaurants",
    icon: FaUtensils,
    gradient: "from-orange-500 to-red-500",
    textColor: "text-orange-700"
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
    textColor: "text-green-700"
  },
  {
    name: "Hotels",
    icon: FaHotel,
    gradient: "from-blue-500 to-cyan-500",
    textColor: "text-blue-700"
  },
  {
    name: "Real estate",
    icon: FaHome,
    gradient: "from-indigo-500 to-purple-500",
    textColor: "text-indigo-700"
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
  },
];

const container = "mx-auto max-w-site px-4 sm:px-6 lg:px-8";
const sectionSpacing = "py-16 sm:py-24 lg:py-28";

const primaryButton =
  "btn-shine group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-7 py-3.5 text-base font-semibold !text-white shadow-lg shadow-indigo-600/25 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-600/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 motion-reduce:transform-none sm:w-auto";
const secondaryButton =
  "btn-shine btn-shine-soft inline-flex w-full items-center justify-center rounded-xl bg-white px-7 py-3.5 text-base font-semibold !text-slate-800 shadow-sm ring-1 ring-inset ring-slate-200 transition duration-200 hover:bg-slate-50 hover:!text-indigo-700 hover:ring-indigo-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 sm:w-auto";

// Eyebrow, heading and intro shared by the sections below the hero
function SectionHeading({ eyebrow, title, description, children }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1.5 text-sm font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100">
        <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" aria-hidden="true" />
        {eyebrow}
      </span>
      <h2 className="mt-5 text-balance text-3xl font-bold tracking-[-0.015em] text-slate-900 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mx-auto mt-4 text-balance text-lg leading-relaxed text-slate-600">{description}</p>
      {children}
    </div>
  );
}

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

// What a scanner sees for each type, drawn inside the phone frame of QrTypesShowcase
function TypeScreen({ type }) {
  if (type === "wifi") {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 px-4">
        <div className="w-full rounded-2xl bg-white p-4 text-center shadow-lg">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
            <FaWifi className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-900">Join &ldquo;Cafe Guest&rdquo;?</p>
          <p className="mt-1 text-[11px] text-slate-500">WPA network · password included</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold">
            <span className="rounded-lg bg-slate-100 py-2 text-slate-600">Cancel</span>
            <span className="rounded-lg bg-cyan-700 py-2 text-white">Join</span>
          </div>
        </div>
        <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600">
          <FaCheck className="h-2.5 w-2.5 text-emerald-600" /> No password typing
        </p>
      </div>
    );
  }

  if (type === "whatsapp") {
    return (
      <div className="flex h-full flex-col bg-[#efeae2]">
        <div className="flex items-center gap-2.5 bg-[#075e54] px-3 pb-3 pt-8 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">YB</span>
          <div>
            <p className="text-xs font-semibold">Your Business</p>
            <p className="text-[10px] text-white/80">online</p>
          </div>
        </div>
        <div className="flex-1 space-y-2 p-3">
          <div className="w-fit max-w-[85%] rounded-lg rounded-tl-none bg-white px-3 py-2 text-[11px] leading-snug text-slate-700 shadow-sm">
            Hi! Thanks for scanning. How can we help?
          </div>
        </div>
        <div className="flex items-center gap-2 p-2">
          <div className="min-w-0 flex-1 rounded-full bg-white px-3 py-2 text-[11px] text-slate-700 shadow-sm">
            Hi, I&apos;d like to order a large pizza
          </div>
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#25d366] text-white">
            <FaPaperPlane className="h-3 w-3" />
          </span>
        </div>
      </div>
    );
  }

  if (type === "instagram") {
    return (
      <div className="flex h-full flex-col bg-white px-4 pb-4 pt-8">
        <p className="text-xs font-bold text-slate-900">yourbrand</p>
        <div className="mt-4 flex items-center gap-4">
          <span className="flex-none rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[3px]">
            <span className="block h-14 w-14 rounded-full border-2 border-white bg-gradient-to-br from-rose-100 to-purple-200" />
          </span>
          <div className="grid flex-1 grid-cols-3 text-center">
            {[["128", "posts"], ["4.2k", "followers"], ["312", "following"]].map(([n, l]) => (
              <div key={l}>
                <p className="text-xs font-bold text-slate-900">{n}</p>
                <p className="text-[9px] text-slate-500">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[11px] font-semibold text-slate-900">Your Brand</p>
        <p className="text-[10px] text-slate-500">Handmade candles · Pune</p>
        <div className="mt-3 rounded-lg bg-[#0095f6] py-1.5 text-center text-[11px] font-semibold text-white">Follow</div>
        <div className="mt-4 grid grid-cols-3 gap-0.5">
          {["from-amber-200 to-rose-300", "from-purple-200 to-indigo-300", "from-rose-200 to-pink-300", "from-indigo-200 to-sky-300", "from-orange-200 to-amber-300", "from-pink-200 to-purple-300"].map((g) => (
            <span key={g} className={`aspect-square bg-gradient-to-br ${g}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="px-3 pb-2.5 pt-8">
        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] text-slate-600">
          <FaLock className="h-2 w-2 text-slate-400" />
          yourcafe.com/menu
        </div>
      </div>
      <div className="bg-gradient-to-br from-indigo-500 to-purple-500 px-4 py-5 text-white">
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/80">Spring menu</p>
        <p className="mt-1 font-display text-lg font-bold leading-tight">Fresh dishes, new every week</p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {["from-amber-200 to-orange-300", "from-emerald-200 to-teal-300"].map((g) => (
          <div key={g}>
            <span className={`block aspect-[4/3] rounded-lg bg-gradient-to-br ${g}`} />
            <span className="mt-1.5 block h-1.5 w-3/4 rounded-full bg-slate-200" />
            <span className="mt-1 block h-1.5 w-1/2 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="space-y-1.5 px-3">
        <span className="block h-1.5 w-full rounded-full bg-slate-100" />
        <span className="block h-1.5 w-5/6 rounded-full bg-slate-100" />
      </div>
      <div className="mt-auto p-3">
        <div className="rounded-xl bg-slate-900 py-2 text-center text-[11px] font-semibold text-white">Book a table</div>
      </div>
    </div>
  );
}

// Tabs for the QR code types we offer, with a description and a phone showing the result of a scan
function QrTypesShowcase({ isAuthenticated }) {
  const [active, setActive] = useState(qrTypeShowcase[0].id);
  const tabRefs = useRef([]);
  const current = qrTypeShowcase.find((type) => type.id === active);
  const CurrentIcon = current.icon;
  const ctaHref = isAuthenticated ? `/dashboard/create-qr?type=${current.id}` : "/auth/register";

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
              aria-controls="qr-type-panel"
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

      <div
        id="qr-type-panel"
        role="tabpanel"
        aria-labelledby={`qr-type-tab-${current.id}`}
        className="relative isolate mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-50 via-white to-purple-50 ring-1 ring-indigo-100 lg:mt-10"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" aria-hidden="true" />

        <div key={current.id} className="grid items-center gap-10 p-5 motion-safe:animate-fade-in sm:gap-12 sm:p-10 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:p-14">
          <div>
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${current.accent}`}>
                <CurrentIcon className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                {current.kind} QR code
              </span>
            </div>
            <h3 className="mt-5 text-2xl font-bold tracking-[-0.01em] text-slate-900 sm:text-3xl">{current.title}</h3>
            <p className="mt-3 text-pretty leading-relaxed text-slate-600 sm:text-lg">{current.description}</p>
            <ul className="mt-7 grid gap-3.5 sm:grid-cols-2">
              {current.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-[15px] text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <FaCheck className="h-2.5 w-2.5" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link href={ctaHref} className={primaryButton}>
                {current.cta}
                <FaArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
              </Link>
              <p className="text-center text-sm text-slate-600 sm:text-left">Your colours, logo and frame on every type</p>
            </div>
          </div>

          {/* Phone showing the result of a scan, with the code beside it */}
          <div className="relative mx-auto w-full max-w-[13rem] sm:max-w-[16rem] lg:max-w-[17rem]" aria-hidden="true">
            <div className="rounded-[2.5rem] bg-slate-900 p-2 shadow-2xl shadow-indigo-900/25 ring-1 ring-slate-900/10">
              <div className="relative aspect-[9/18] overflow-hidden rounded-[2rem] bg-white">
                <span className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
                <TypeScreen type={current.id} />
              </div>
            </div>
            <div className="absolute -left-10 bottom-12 hidden rounded-2xl bg-white p-3 shadow-xl shadow-indigo-900/10 ring-1 ring-slate-900/5 sm:block lg:-left-16">
              <QRCodeSVG value={SITE_URL} size={88} level="M" fgColor={current.qrColor} bgColor="#ffffff" />
              <p className="mt-2 text-center text-[11px] font-semibold text-slate-700">Scan me</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Landing({ initialUser, basicPlan = null }) {
  const router = useRouter();

  // Pricing: the real Razorpay price in the visitor's currency (picked on the server by location)
  const displayPlans = pricingPlans.map((plan) =>
    plan.name === "Basic Package"
      ? {
          ...plan,
          price: basicPlan ? formatPrice(basicPlan.amount, basicPlan.currency) : "—",
          period: basicPlan ? formatPeriod(basicPlan.period, basicPlan.interval) : "",
        }
      : { ...plan, price: formatPrice(0, basicPlan?.currency || "USD") }
  );
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  // The server already knows who is signed in, so the right buttons are in the first HTML (no placeholder flash)
  const currentUser = initialUser;
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
    <div className="min-h-screen bg-white">
      <Head>
        <title>QR-Genie | Dynamic QR Code Solution for Modern Businesses</title>
        <meta name="description" content="Create, manage, and track dynamic QR codes with QR-Genie. Update your links anytime without reprinting. Perfect for restaurants, events, and marketing campaigns." />
        <meta name="keywords" content="QR codes, dynamic QR codes, QR code generator, QR code analytics, QR code tracking" />
      </Head>

      <SiteHeader isAuthenticated={isAuthenticated} onLogout={handleLogout} />

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/90 via-white to-white" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(99_102_241/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(99_102_241/0.07)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,#000_45%,transparent_100%)]" />
            <div className="absolute -top-40 right-[-8%] h-[30rem] w-[30rem] rounded-full bg-purple-300/30 blur-3xl" />
            <div className="absolute -left-40 top-32 h-[26rem] w-[26rem] rounded-full bg-indigo-300/25 blur-3xl" />
          </div>

          <div className={`${container} pb-16 pt-14 sm:pb-20 sm:pt-20 lg:pt-24`}>
            <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_1fr] lg:gap-10 xl:gap-16">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100">
                  <FaRocket className="h-3.5 w-3.5" />
                  Trusted by 50,000+ businesses worldwide
                </div>

                <h1 className="mt-7 text-[2.6rem] font-bold leading-[1.06] tracking-[-0.02em] text-slate-900 sm:text-6xl lg:text-[4.1rem] xl:text-7xl">
                  <span className="block">QR Codes That</span>
                  <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text pb-1.5 text-transparent">
                    Work For You
                  </span>
                </h1>

                <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-600 sm:text-xl lg:mx-0">
                  Create, manage, and track dynamic QR codes. Update your links anytime without reprinting.
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
              <p className="mt-3 text-balance font-display text-xl font-semibold tracking-[-0.01em] text-slate-900 sm:text-2xl">
                From café menus to property signs, change the link any time without reprinting
              </p>
            </div>

            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6 max-w-5xl mx-auto">
              {businessTypes.map((business) => (
                <div key={business.name} className="group relative">
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
                </div>
              ))}
            </div>

            {/* Additional Trust Badge */}
            <div className="mt-10 text-center sm:mt-12">
              <div className="inline-flex items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5 shadow-sm ring-1 ring-slate-200/80">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-600/30">
                  <FaCheck className="h-3 w-3" />
                </span>
                <span className="text-sm font-medium text-slate-700">
                  Free for <span className="font-semibold text-slate-900">14 days</span>, no card needed
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
              title="The right QR code for every job"
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
              title="Everything you need to succeed"
              description="Powerful features designed to make QR code management simple and effective"
            />

            <div className="mt-14 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-16 lg:grid-cols-3 lg:gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative flex cursor-pointer gap-5 overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-slate-200/80 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-900/5 hover:ring-indigo-200 motion-reduce:transform-none sm:block sm:p-8"
                >
                  {/* Hover: a light gradient that keeps drifting, plus a sheen that sweeps across once */}
                  <div
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgb(238_242_255)_0%,rgb(250_245_255)_30%,rgb(255_255_255)_50%,rgb(245_243_255)_70%,rgb(238_242_255)_100%)] bg-[length:250%_250%] opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-safe:group-hover:animate-gradient-pan"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full motion-reduce:hidden"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                  <div className="relative flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 ring-1 ring-inset ring-indigo-100 transition-colors duration-300 group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white group-hover:ring-transparent">
                    {feature.icon}
                  </div>
                  <div className="relative min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 sm:mt-6">{feature.title}</h3>
                    <p className="mt-2 leading-relaxed text-slate-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
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
              title="Get started in minutes"
              description="Simple steps to create and manage your dynamic QR codes"
            />

            <div className="relative mx-auto mt-14 max-w-2xl lg:mt-20 lg:max-w-none">
              {/* Line joining the steps: across on large screens, down the left side below that */}
              <div
                className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-gradient-to-r from-indigo-200 via-purple-300 to-indigo-200 lg:block"
                aria-hidden="true"
              />
              <div className="absolute bottom-8 left-8 top-8 w-px bg-gradient-to-b from-indigo-200 via-purple-300 to-indigo-200 lg:hidden" aria-hidden="true" />

              <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-8">
                {howItWorks.map((step) => (
                  <li key={step.number} className="group flex cursor-pointer gap-6 lg:flex-col lg:items-center lg:text-center">
                    {/* Hover: the tile lifts and fills, the icon tilts, the number spins with a pulse */}
                    <div className="relative flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-lg shadow-indigo-900/5 ring-1 ring-slate-200 transition duration-300 group-hover:-translate-y-1.5 group-hover:bg-gradient-to-br group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-indigo-500/25 group-hover:ring-transparent motion-reduce:transform-none">
                      <span className="transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110 motion-reduce:transform-none">
                        {step.icon}
                      </span>
                      <span className="absolute -right-2.5 -top-2.5 flex h-7 w-7 items-center justify-center">
                        <span className="absolute inset-0 rounded-full bg-purple-400 opacity-0 group-hover:opacity-60 motion-safe:group-hover:animate-ping" aria-hidden="true" />
                        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 font-sans text-xs font-bold text-white ring-4 ring-slate-50 transition-transform duration-700 ease-out group-hover:rotate-[360deg] group-hover:scale-125 motion-reduce:transform-none">
                          {step.number}
                        </span>
                      </span>
                    </div>
                    <div className="pt-1 lg:pt-0">
                      <h3 className="text-lg font-semibold text-slate-900 transition-colors duration-300 group-hover:text-indigo-700 lg:mt-7">{step.title}</h3>
                      <p className="mt-2 leading-relaxed text-slate-600 lg:mx-auto lg:max-w-[17rem]">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className={`bg-white ${sectionSpacing}`}>
          <div className={container}>
            <SectionHeading
              eyebrow="Pricing"
              title="Simple, transparent pricing"
              description="Start free for 14 days, no card needed. Cancel anytime."
            />

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
                      <h4 className="font-semibold text-slate-900">{testimonial.name}</h4>
                      <p className="text-sm text-slate-600">{testimonial.role}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{testimonial.company}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter showCta isAuthenticated={isAuthenticated} />
    </div>
  );
}
