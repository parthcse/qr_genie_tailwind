import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, LazyMotion, MotionConfig, domMax, m } from "motion/react";
import {
  FaBars,
  FaChartLine,
  FaChevronDown,
  FaChevronRight,
  FaCreditCard,
  FaCrown,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaLifeRing,
  FaPlus,
  FaQrcode,
  FaShieldAlt,
  FaSignOutAlt,
  FaThumbtack,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";
import { TRIAL_DAYS } from "@/lib/billing/subscription";
import { planNameFor } from "@/lib/billing/terms";

const createItem = { href: "/dashboard/create-qr", label: "Create QR code", icon: FaPlus };
const navGroups = [
  {
    title: "Workspace",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: FaChartLine },
      { href: "/dashboard", label: "My QR codes", icon: FaQrcode },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/dashboard/account", label: "My account", icon: FaUserCircle },
      { href: "/dashboard/billing", label: "Billing", icon: FaCreditCard },
      { href: "/contact", label: "Help & support", icon: FaLifeRing },
    ],
  },
];

const PIN_KEY = "qrgenie.sidebarPinned";
const EASE = [0.16, 1, 0.3, 1];
const ACTIVE_PLANS = ["TRIAL_ACTIVE", "SUBSCRIPTION_ACTIVE"];

// Each dashboard page renders this layout itself, so it remounts when moving between pages. Kept outside React: the
// account and pin survive that (no flicker), and the sidebar only slides in on the first load.
let cachedAccount = null;
let sidebarEntered = false;
let pinnedChoice = false;

const upgradeLinkClass =
  "btn-shine mt-3 block rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 py-2 text-center text-sm font-semibold !text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2";

function initialsOf(user) {
  const source = (user?.name || user?.email || "").trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (user?.name ? parts[1]?.[0] || "" : "")).toUpperCase() || "?";
}

function BrandMark({ className = "" }) {
  return (
    <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 ${className}`}>
      <FaQrcode className="h-5 w-5 text-white" />
    </span>
  );
}

/** What a plan is called and when it ends, for the sidebar, menu and top bar */
function planSummary(user, subscriptionStatus) {
  const status = subscriptionStatus?.status;
  if (status === "SUBSCRIPTION_ACTIVE") {
    if (subscriptionStatus.adminPlan) return { title: subscriptionStatus.planName, detail: "Free, never ends" };
    const renews = user?.subscriptionEndsAt ? new Date(user.subscriptionEndsAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : null;
    return { title: planNameFor(user?.subscriptionMonths), detail: renews ? `${user.subscriptionCancelledAt ? "Ends" : "Renews"} ${renews}` : "Active" };
  }
  if (status === "TRIAL_ACTIVE") {
    const daysLeft = subscriptionStatus.daysLeft ?? 0;
    return { title: "Free trial", detail: `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`, trial: true };
  }
  return {
    title: status === "TRIAL_EXPIRED" ? "Trial ended" : status === "SUBSCRIPTION_EXPIRED" ? "Subscription ended" : "No active plan",
    detail: "Your QR codes are paused",
    ended: true,
  };
}

/** Plan summary card in the account menu and the phone menu */
function PlanCard({ user, subscriptionStatus, onNavigate }) {
  const plan = planSummary(user, subscriptionStatus);

  if (subscriptionStatus?.status === "SUBSCRIPTION_ACTIVE") {
    return (
      <Link
        href="/dashboard/billing"
        onClick={onNavigate}
        className="group flex items-center gap-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-3 ring-1 ring-inset ring-indigo-100 transition hover:ring-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm">
          <FaCrown className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-gray-900">{plan.title}</span>
          <span className="block truncate text-xs text-gray-600">{plan.detail}</span>
        </span>
        <FaChevronRight className="h-3 w-3 flex-none text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600 motion-reduce:transform-none" />
      </Link>
    );
  }

  if (plan.trial) {
    const daysLeft = subscriptionStatus.daysLeft ?? 0;
    // Accounts from before the trial was shortened keep their longer trial
    const pct = Math.max(4, Math.min(100, (daysLeft / Math.max(TRIAL_DAYS, daysLeft)) * 100));
    return (
      <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-3 ring-1 ring-inset ring-indigo-100">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-gray-900">{plan.title}</span>
          <span className="text-xs tabular-nums text-gray-600">{plan.detail}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white" aria-hidden="true">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600" style={{ width: `${pct}%` }} />
        </div>
        <Link href="/dashboard/billing" onClick={onNavigate} className={upgradeLinkClass}>
          Choose a plan
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-inset ring-amber-200">
      <p className="text-sm font-semibold text-amber-900">{plan.title}</p>
      <p className="mt-0.5 text-xs text-amber-800">{plan.detail}.</p>
      <Link href="/dashboard/billing" onClick={onNavigate} className={upgradeLinkClass}>
        Choose a plan
      </Link>
    </div>
  );
}

/** Icon-only sidebar. See .dash-rail in styles/globals.css for how it opens. */
function Sidebar({ isActive, open, pinned, onTogglePin, user, subscriptionStatus, entering }) {
  const plan = subscriptionStatus ? planSummary(user, subscriptionStatus) : null;
  const itemBase = "flex h-11 items-center gap-3.5 rounded-xl px-[0.6875rem] text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400";
  return (
    <aside className={`dash-rail glass hidden flex-col px-2 py-3 md:flex ${entering ? "dash-rail-enter" : ""}`} data-open={open} aria-label="Sidebar">
      <Link href="/" title="QR-Genie home" className="mb-3 flex h-11 flex-none items-center gap-3 rounded-xl px-[0.4375rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400">
        <BrandMark />
        <span className="dash-rail-label bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text font-display text-xl font-bold tracking-tight text-transparent">QR-Genie</span>
      </Link>

      <nav className="-mx-2 flex-1 overflow-y-auto overflow-x-hidden px-2" aria-label="Dashboard">
        <Link
          href={createItem.href}
          title={createItem.label}
          aria-current={isActive(createItem.href) ? "page" : undefined}
          className={`group ${itemBase} mb-2 font-semibold ${isActive(createItem.href) ? "bg-white/90 !text-indigo-700 shadow-sm" : "!text-indigo-700 hover:bg-white/60"}`}
        >
          <span
            className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg transition ${
              isActive(createItem.href) ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30" : "bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200"
            }`}
          >
            <FaPlus className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90 motion-reduce:transform-none" />
          </span>
          <span className="dash-rail-label">{createItem.label}</span>
        </Link>

        {navGroups.map((group) => (
          <div key={group.title} className="mb-2 border-t border-indigo-950/[0.06] pt-2 last:mb-0">
            <p className="sr-only">{group.title}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    aria-current={active ? "page" : undefined}
                    className={`group ${itemBase} ${active ? "bg-white/90 font-semibold !text-indigo-700 shadow-sm" : "font-medium !text-gray-700 hover:bg-white/60 hover:!text-gray-900"}`}
                  >
                    <span
                      className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg transition ${
                        active ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30" : "text-gray-500 group-hover:text-indigo-600"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="dash-rail-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-2 flex-none space-y-1 border-t border-indigo-950/[0.06] pt-2">
        {plan && (
          <Link href="/dashboard/billing" title={`${plan.title}: ${plan.detail}`} className={`${itemBase} font-medium !text-gray-700 hover:bg-white/60`}>
            <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${plan.ended ? "bg-amber-100 text-amber-700" : "text-indigo-600"}`}>
              {plan.ended ? <FaExclamationTriangle className="h-3.5 w-3.5" /> : <FaCrown className="h-4 w-4" />}
            </span>
            <span className="dash-rail-label min-w-0 leading-tight">
              <span className="block truncate font-semibold text-gray-900">{plan.title}</span>
              <span className="block truncate text-xs text-gray-600">{plan.detail}</span>
            </span>
          </Link>
        )}
        <button
          type="button"
          onClick={onTogglePin}
          aria-pressed={pinned}
          title={pinned ? "Let the sidebar close" : "Keep the sidebar open"}
          className={`${itemBase} w-full text-left font-medium text-gray-600 hover:bg-white/60 hover:text-gray-900`}
        >
          <span className="flex h-8 w-8 flex-none items-center justify-center">
            <FaThumbtack className={`h-3.5 w-3.5 transition-transform duration-200 motion-reduce:transform-none ${pinned ? "text-indigo-600" : "-rotate-45"}`} />
          </span>
          <span className="dash-rail-label">{pinned ? "Let it close" : "Keep open"}</span>
        </button>
      </div>
    </aside>
  );
}

/** The round account button and its menu: who you are, your plan, account links and log out */
function AccountMenu({ user, subscriptionStatus, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);
  const button = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => !wrapper.current?.contains(event.target) && setOpen(false);
    const onKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = [...(wrapper.current?.querySelectorAll('[role="menuitem"]') || [])];
      if (!items.length) return;
      event.preventDefault();
      const index = items.indexOf(document.activeElement);
      const step = event.key === "ArrowDown" ? 1 : -1;
      items[(index + step + items.length) % items.length].focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menuLink = "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium !text-gray-700 transition hover:bg-indigo-50 hover:!text-indigo-700 focus:outline-none focus-visible:bg-indigo-50";
  const close = () => setOpen(false);

  return (
    <div ref={wrapper} className="relative flex-none">
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="group flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-semibold text-white ring-2 ring-white" aria-hidden="true">
          {initialsOf(user)}
        </span>
        <FaChevronDown className={`h-2.5 w-2.5 text-gray-500 transition-transform duration-200 motion-reduce:transform-none ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            role="menu"
            aria-label="Account"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl bg-white p-2 shadow-2xl shadow-indigo-950/15 ring-1 ring-indigo-950/[0.06]"
          >
            <div className="px-3 pb-2 pt-1.5">
              <p className="truncate text-sm font-semibold text-gray-900">{user?.name || "Your account"}</p>
              <p className="truncate text-xs text-gray-600">{user?.email}</p>
            </div>
            {subscriptionStatus && (
              <div className="mb-1 px-1">
                <PlanCard user={user} subscriptionStatus={subscriptionStatus} onNavigate={close} />
              </div>
            )}
            <Link role="menuitem" href="/dashboard/account" onClick={close} className={menuLink}>
              <FaUserCircle className="h-3.5 w-3.5 flex-none text-gray-500" /> My account
            </Link>
            <Link role="menuitem" href="/dashboard/billing" onClick={close} className={menuLink}>
              <FaCreditCard className="h-3.5 w-3.5 flex-none text-gray-500" /> Billing
            </Link>
            <Link role="menuitem" href="/contact" onClick={close} className={menuLink}>
              <FaLifeRing className="h-3.5 w-3.5 flex-none text-gray-500" /> Help &amp; support
            </Link>
            {subscriptionStatus?.adminPlan && (
              <Link role="menuitem" href="/admin" onClick={close} className={menuLink}>
                <FaShieldAlt className="h-3.5 w-3.5 flex-none text-gray-500" /> Admin
              </Link>
            )}
            <Link role="menuitem" href="/" onClick={close} className={menuLink}>
              <FaExternalLinkAlt className="h-3.5 w-3.5 flex-none text-gray-500" /> QR-Genie website
            </Link>
            <div className="my-1 border-t border-gray-100" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                onLogout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:bg-red-50"
            >
              <FaSignOutAlt className="h-3.5 w-3.5 flex-none text-gray-500" /> Log out
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Menu sliding in from the left on phones */
function PhoneDrawer({ open, onClose, isActive, user, subscriptionStatus, onLogout }) {
  const closeButton = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const allItems = [createItem, ...navGroups.flatMap((group) => group.items)];
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <m.div
            className="absolute inset-0 bg-indigo-950/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <m.aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.28, ease: EASE }}
            className="absolute inset-y-0 left-0 flex h-[100dvh] w-[86vw] max-w-sm flex-col rounded-r-3xl bg-white shadow-2xl"
          >
            <div className="flex h-16 flex-none items-center justify-between border-b border-gray-100 px-4">
              <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
                <BrandMark className="!h-9 !w-9" />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text font-display text-xl font-bold tracking-tight text-transparent">QR-Genie</span>
              </Link>
              <button
                ref={closeButton}
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu">
              {allItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={`mb-1 flex items-center justify-between rounded-xl px-4 py-3.5 text-base ${
                      active ? "bg-gradient-to-r from-indigo-600 to-purple-600 font-semibold !text-white shadow-md" : "font-medium !text-gray-800 transition hover:bg-indigo-50 hover:!text-indigo-700"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${active ? "text-white" : "text-indigo-500"}`} />
                      {item.label}
                    </span>
                    <FaChevronRight className={`h-3 w-3 ${active ? "text-white/70" : "text-gray-300"}`} />
                  </Link>
                );
              })}
            </nav>
            <div className="flex-none space-y-3 border-t border-gray-100 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {subscriptionStatus && <PlanCard user={user} subscriptionStatus={subscriptionStatus} onNavigate={onClose} />}
              <div className="flex items-center gap-3 px-1">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-semibold text-white" aria-hidden="true">
                  {initialsOf(user)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-900">{user?.name || "Your account"}</span>
                  <span className="block truncate text-xs text-gray-600">{user?.email}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  aria-label="Log out"
                  title="Log out"
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <FaSignOutAlt className="h-4 w-4" />
                </button>
              </div>
            </div>
          </m.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Thin progress bar while the next dashboard page loads */
function RouteProgress() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const start = () => setLoading(true);
    const stop = () => setLoading(false);
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", stop);
    router.events.on("routeChangeError", stop);
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", stop);
      router.events.off("routeChangeError", stop);
    };
  }, [router.events]);
  return loading ? <div className="dash-progress" aria-hidden="true" /> : null;
}

/** Shell of every dashboard page: glass sidebar and top bar over the backdrop, with the page content beside them */
export default function DashboardLayout({ children, title, description, actions }) {
  const router = useRouter();
  const [user, setUser] = useState(cachedAccount?.user || null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(cachedAccount?.subscriptionStatus || null);
  const [pinned, setPinned] = useState(pinnedChoice);
  // Touch screens have no hover: between md and lg the pin opens the sidebar over the page, and tapping away closes it
  const [drawerOpen, setDrawerOpen] = useState(false);
  const entering = useRef(!sidebarEntered);

  useEffect(() => {
    sidebarEntered = true;
    try {
      pinnedChoice = window.localStorage.getItem(PIN_KEY) === "1";
      setPinned(pinnedChoice);
    } catch {
      // Blocked storage only means the sidebar starts closed
    }
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const status = data.subscriptionStatus || { status: "NONE", daysLeft: null };
            cachedAccount = { user: data.user, subscriptionStatus: status };
            setUser(data.user);
            setSubscriptionStatus(status);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    fetchUserData();
  }, []);

  // Leaving the dashboard forgets the account, so the next person to sign in on this browser never sees it
  useEffect(() => {
    const onLeave = (url) => {
      if (!url.startsWith("/dashboard")) cachedAccount = null;
    };
    router.events.on("routeChangeStart", onLeave);
    return () => router.events.off("routeChangeStart", onLeave);
  }, [router.events]);

  const togglePin = () => {
    const next = !pinned;
    pinnedChoice = next;
    setPinned(next);
    try {
      window.localStorage.setItem(PIN_KEY, next ? "1" : "0");
    } catch {
      // The choice just won't be remembered
    }
  };

  // A code's details page belongs to "My QR codes"
  const isActive = (href) =>
    router.pathname === href || (href === "/dashboard" && (router.pathname === "/dashboard/index" || router.pathname.startsWith("/dashboard/qrs")));

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      cachedAccount = null;
      router.push("/auth/logout");
    }
  };

  const status = subscriptionStatus?.status;
  const planEnded = !!status && !ACTIVE_PLANS.includes(status);
  const onCreatePage = router.pathname === "/dashboard/create-qr";
  // Billing and the create page explain an ended plan themselves
  const showEndedNotice = planEnded && !onCreatePage && router.pathname !== "/dashboard/billing";
  const plan = subscriptionStatus ? planSummary(user, subscriptionStatus) : null;
  const year = new Date().getFullYear();
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <LazyMotion features={domMax}>
      <MotionConfig reducedMotion="user">
        <div className="dash-shell flex min-h-screen flex-col">
          <div className="dash-backdrop" aria-hidden="true">
            <span className="dash-finder dash-finder-a" />
            <span className="dash-finder dash-finder-b" />
            <span className="dash-finder dash-finder-c" />
          </div>
          <RouteProgress />

          <Sidebar
            isActive={isActive}
            open={pinned}
            pinned={pinned}
            onTogglePin={togglePin}
            user={user}
            subscriptionStatus={subscriptionStatus}
            entering={entering.current}
          />
          {/* Below lg an open sidebar lies over the page, so tapping beside it closes it */}
          {pinned && <button type="button" tabIndex={-1} aria-hidden="true" className="fixed inset-0 z-30 hidden cursor-default md:block lg:hidden" onClick={togglePin} />}
          <PhoneDrawer open={drawerOpen} onClose={closeDrawer} isActive={isActive} user={user} subscriptionStatus={subscriptionStatus} onLogout={handleLogout} />

          <div className="dash-main flex min-h-screen min-w-0 flex-1 flex-col" data-pinned={pinned}>
            {/* Solid on phones (no blur, see .glass), so text scrolling under it can't show through; a floating bar from md */}
            <header className="glass sticky top-0 z-30 flex h-16 flex-none items-center gap-2 border-x-0 border-t-0 px-3 max-md:!bg-white sm:gap-3 sm:px-4 md:top-3 md:mx-3 md:mt-3 md:rounded-2xl md:border-x md:border-t">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                aria-expanded={drawerOpen}
                className="-ml-1 flex h-10 w-10 flex-none items-center justify-center rounded-xl text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 md:hidden"
              >
                <FaBars className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                {title && <h1 className="truncate text-base font-bold tracking-tight text-gray-900 sm:text-lg">{title}</h1>}
                {description && <p className="hidden truncate text-xs text-gray-600 lg:block">{description}</p>}
              </div>
              {actions && <div className="flex flex-none items-center gap-2">{actions}</div>}
              {plan && (plan.trial || plan.ended) && (
                <Link
                  href="/dashboard/billing"
                  className={`hidden flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition lg:inline-flex ${
                    plan.ended ? "bg-amber-50 !text-amber-800 ring-amber-200 hover:bg-amber-100" : "bg-indigo-50 !text-indigo-700 ring-indigo-100 hover:bg-indigo-100"
                  }`}
                >
                  {plan.ended ? plan.title : `${plan.title}: ${plan.detail}`}
                </Link>
              )}
              {!onCreatePage && (
                <Link
                  href={createItem.href}
                  aria-label={createItem.label}
                  className="btn-shine group inline-flex h-10 flex-none items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 text-sm font-semibold !text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 sm:px-4"
                >
                  <FaPlus className="h-3 w-3 transition-transform duration-300 group-hover:rotate-90 motion-reduce:transform-none" />
                  <span className="hidden sm:inline">New QR code</span>
                </Link>
              )}
              <AccountMenu user={user} subscriptionStatus={subscriptionStatus} onLogout={handleLogout} />
            </header>

            {/* overflow-x-clip (not hidden), so the create page's sticky preview isn't trapped in a scroll container */}
            <main className="dash-page flex w-full min-w-0 flex-1 flex-col overflow-x-clip px-3 pb-6 pt-4 md:pt-3">
              {description && <p className="mb-4 text-sm text-gray-700 lg:hidden">{description}</p>}
              {showEndedNotice && (
                <div className="mb-4 flex flex-col gap-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-inset ring-amber-200 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex gap-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <FaExclamationTriangle className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-amber-900">
                        {status === "TRIAL_EXPIRED" ? "Your free trial has ended" : status === "SUBSCRIPTION_EXPIRED" ? "Your subscription has ended" : "No active plan"}
                      </p>
                      <p className="mt-0.5 text-sm text-amber-800">
                        Your QR codes are paused: scans show a paused page and downloads are off. Nothing is deleted, so subscribing switches them straight back on.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/billing"
                    className="btn-shine inline-flex flex-none items-center justify-center rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold !text-white shadow-sm transition hover:bg-amber-700"
                  >
                    View plans
                  </Link>
                </div>
              )}
              {children}
            </main>

            <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pb-5 text-xs text-gray-600">
              <p>&copy; {year} QR-Genie</p>
              <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1">
                <Link href="/contact" className="!text-gray-600 hover:!text-indigo-700">Help</Link>
                <Link href="/privacy" className="!text-gray-600 hover:!text-indigo-700">Privacy</Link>
                <Link href="/terms" className="!text-gray-600 hover:!text-indigo-700">Terms</Link>
                <Link href="/refund-policy" className="!text-gray-600 hover:!text-indigo-700">Refund policy</Link>
              </nav>
            </footer>
          </div>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
