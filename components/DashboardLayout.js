import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { FaCrown, FaChevronRight, FaSignOutAlt, FaPlus, FaQrcode, FaChartLine, FaUserCircle, FaCreditCard, FaLifeRing } from "react-icons/fa";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

const createItem = { href: "/dashboard/create-qr", label: "Create QR code", icon: FaPlus };
const navGroups = [
  {
    title: "Workspace",
    items: [
      { href: "/dashboard", label: "My QR codes", icon: FaQrcode },
      { href: "/dashboard/analytics", label: "Analytics", icon: FaChartLine },
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
const navItems = [createItem, ...navGroups.flatMap((group) => group.items)];

const TRIAL_DAYS = 14;

const upgradeLinkClass =
  "mt-3 block rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 py-2 text-center text-sm font-semibold !text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2";

function initialsOf(user) {
  const source = (user.name || user.email || "").trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (user.name ? parts[1]?.[0] || "" : "")).toUpperCase() || "?";
}

/** Plan summary card at the bottom of the sidebar */
function SidebarPlan({ user, subscriptionStatus, onNavigate }) {
  const status = subscriptionStatus?.status;

  if (status === "SUBSCRIPTION_ACTIVE") {
    const renews = user.subscriptionEndsAt
      ? new Date(user.subscriptionEndsAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })
      : null;
    return (
      <Link
        href="/dashboard/billing"
        onClick={onNavigate}
        className="group flex items-center gap-3 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-3 transition hover:border-indigo-200 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm">
          <FaCrown className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-gray-900">Basic Package</span>
          <span className="block truncate text-xs text-gray-500">{renews ? `Renews ${renews}` : "Active"}</span>
        </span>
        <FaChevronRight className="h-3 w-3 flex-none text-gray-400 transition group-hover:text-indigo-600" />
      </Link>
    );
  }

  if (status === "TRIAL_ACTIVE") {
    const daysLeft = subscriptionStatus.daysLeft ?? 0;
    const pct = Math.max(4, Math.min(100, (daysLeft / TRIAL_DAYS) * 100));
    return (
      <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-gray-900">Free trial</span>
          <span className="text-xs tabular-nums text-gray-600">
            {daysLeft} {daysLeft === 1 ? "day" : "days"} left
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white" aria-hidden="true">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600" style={{ width: `${pct}%` }} />
        </div>
        <Link href="/dashboard/billing" onClick={onNavigate} className={upgradeLinkClass}>
          Upgrade to Basic
        </Link>
      </div>
    );
  }

  const title =
    status === "TRIAL_EXPIRED" ? "Trial ended" : status === "SUBSCRIPTION_EXPIRED" ? "Subscription ended" : "No active plan";
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm font-semibold text-amber-900">{title}</p>
      <p className="mt-0.5 text-xs text-amber-800">Your QR codes are paused.</p>
      <Link href="/dashboard/billing" onClick={onNavigate} className={upgradeLinkClass}>
        Upgrade to Basic
      </Link>
    </div>
  );
}

/** Plan card plus the signed-in user and log out, pinned to the bottom of the sidebar */
function SidebarFooter({ user, subscriptionStatus, onLogout, onNavigate }) {
  if (!user || !subscriptionStatus) {
    return <div className="h-[132px] animate-pulse rounded-xl bg-indigo-50/70" aria-hidden="true" />;
  }
  return (
    <div className="space-y-3">
      <SidebarPlan user={user} subscriptionStatus={subscriptionStatus} onNavigate={onNavigate} />
      <div className="flex items-center gap-3 rounded-xl px-1 py-1">
        <span
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-semibold text-white"
          aria-hidden="true"
        >
          {initialsOf(user)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-gray-900">{user.name || "Your account"}</span>
          <span className="block truncate text-xs text-gray-500">{user.email}</span>
        </span>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <FaSignOutAlt className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children, title, description, actions }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            setSubscriptionStatus(data.subscriptionStatus || { status: "NONE", daysLeft: null });
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    fetchUserData();
  }, []);

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
      router.push("/auth/logout");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Dashboard pages are signed-in only; below md the header's menu shows the dashboard links, plan and account */}
      <SiteHeader
        isAuthenticated
        onLogout={handleLogout}
        menuBreakpoint="md"
        drawerLinks={navItems.map((item) => ({ ...item, active: isActive(item.href) }))}
        drawerFooter={(close) => (
          <SidebarFooter
            user={user}
            subscriptionStatus={subscriptionStatus}
            onNavigate={close}
            onLogout={() => {
              close();
              handleLogout();
            }}
          />
        )}
      />

      {/* overflow-x-clip (not hidden) so the sticky sidebar isn't trapped in a scroll container */}
      <div className="mx-auto flex w-full max-w-site flex-1 overflow-x-clip px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Desktop Sidebar: stays in view below the 80px site header while the page scrolls; plan and account pinned to its bottom */}
        <aside className="hidden md:sticky md:top-[6.5rem] md:flex md:h-[calc(100vh-8rem)] md:w-64 lg:w-72 flex-shrink-0 self-start flex-col rounded-2xl border border-indigo-100 bg-white/80 backdrop-blur-lg px-3 md:px-4 pt-4 pb-4 shadow-lg">
          <nav className="-mx-1 flex-1 overflow-y-auto px-1" aria-label="Dashboard">
            {/* Main action */}
            <Link
              href={createItem.href}
              aria-current={isActive(createItem.href) ? "page" : undefined}
              className={`group mb-5 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold !text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
                isActive(createItem.href) ? "ring-2 ring-indigo-200 ring-offset-2" : ""
              }`}
            >
              <FaPlus className="h-3 w-3 transition-transform duration-300 group-hover:rotate-90" />
              {createItem.label}
            </Link>

            {navGroups.map((group) => (
              <div key={group.title} className="mb-4 last:mb-0">
                <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{group.title}</p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                          active ? "bg-indigo-50 font-semibold !text-indigo-700" : "font-medium !text-gray-600 hover:bg-gray-50 hover:!text-gray-900"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg transition ${
                            active
                              ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30"
                              : "bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm group-hover:ring-1 group-hover:ring-indigo-100"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {active ? (
                          <span className="h-1.5 w-1.5 flex-none rounded-full bg-indigo-500" aria-hidden="true" />
                        ) : (
                          <FaChevronRight className="h-2.5 w-2.5 flex-none text-gray-300 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-4 border-t border-indigo-100 pt-4">
            <SidebarFooter user={user} subscriptionStatus={subscriptionStatus} onLogout={handleLogout} />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-h-full flex-1 flex-col md:pl-4 lg:pl-6 xl:pl-8 min-w-0">
          <main className="flex w-full flex-1 flex-col rounded-xl md:rounded-2xl border border-indigo-100 bg-white md:bg-white/80 md:backdrop-blur-lg px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-5 md:py-6 shadow-xl max-w-full overflow-hidden">
            {(title || description || actions) && (
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between md:mb-6">
                <div className="min-w-0">
                  {title && (
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="mt-1 md:mt-2 text-xs sm:text-sm text-gray-600">{description}</p>
                  )}
                </div>
                {actions && <div className="flex flex-none items-center gap-2">{actions}</div>}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>

      <SiteFooter isAuthenticated />
    </div>
  );
}
