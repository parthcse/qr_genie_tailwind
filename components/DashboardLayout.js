import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { FaQrcode, FaBars, FaTimes } from "react-icons/fa";

const navItems = [
  { href: "/dashboard/create-qr", label: "Create QR Code" },
  { href: "/dashboard", label: "My QR Codes" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/account", label: "My Account" },
  { href: "/dashboard/billing", label: "Billing" },
];

// Additional mobile menu items
const mobileNavItems = [
  ...navItems,
  { href: "/contact", label: "Contact us" },
  { href: "/faqs", label: "FAQs" },
];

const PLAN_LABELS = { MONTHLY: "Monthly", QUARTERLY: "Quarterly", ANNUAL: "Annual" };

export default function DashboardLayout({ children, title, description }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Mobile Top Bar */}
      <header className="sm:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex-shrink-0 flex items-center group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
              <FaQrcode className="h-5 w-5 text-white" />
            </div>
            <span className="ml-2 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              QR-Genie
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-gray-600 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
            aria-label="Open menu"
          >
            <FaBars className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 sm:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Slide-in Menu */}
          <aside className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 sm:hidden overflow-y-auto">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Link href="/" className="flex-shrink-0 flex items-center group" onClick={() => setMobileMenuOpen(false)}>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <FaQrcode className="h-6 w-6 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  QR-Genie
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-400 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
                aria-label="Close menu"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-4 pt-4 pb-4 space-y-1">
              {mobileNavItems.map((item) => {
                const active =
                  router.pathname === item.href ||
                  (item.href === "/dashboard" &&
                    router.pathname === "/dashboard/index");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={[
                      "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700",
                    ].join(" ")}
                  >
                    <span className={active ? "font-semibold" : ""}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Subscription status (mobile) */}
            {user && subscriptionStatus && (
              <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 space-y-2">
                {subscriptionStatus.status === "TRIAL_ACTIVE" && (
                  <>
                    <p className="text-sm font-medium text-gray-900">Free trial – {subscriptionStatus.daysLeft} {subscriptionStatus.daysLeft === 1 ? "day" : "days"} left</p>
                    <Link href="/dashboard/billing" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold">Upgrade</Link>
                  </>
                )}
                {(subscriptionStatus.status === "TRIAL_EXPIRED" || subscriptionStatus.status === "SUBSCRIPTION_EXPIRED" || subscriptionStatus.status === "NONE") && (
                  <>
                    <p className="text-sm font-medium text-gray-900">
                      {subscriptionStatus.status === "TRIAL_EXPIRED" ? "Trial expired – upgrade to reactivate" : subscriptionStatus.status === "SUBSCRIPTION_EXPIRED" ? "Subscription expired" : "No active plan"}
                    </p>
                    <Link href="/dashboard/billing" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold">Upgrade</Link>
                  </>
                )}
                {subscriptionStatus.status === "SUBSCRIPTION_ACTIVE" && ["MONTHLY", "QUARTERLY", "ANNUAL"].includes(user.subscriptionPlan) && (
                  <>
                    <p className="text-sm font-medium text-gray-900">Plan: {PLAN_LABELS[user.subscriptionPlan] || user.subscriptionPlan}</p>
                    <Link href="/dashboard/billing" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center py-2 rounded-lg border-2 border-indigo-600 text-indigo-600 text-sm font-semibold">Upgrade</Link>
                  </>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="mt-auto border-t border-gray-200 px-4 pt-4 pb-6">
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="mb-3 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-all duration-200 hover:bg-red-50 hover:border-red-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Logout
              </button>
              <div className="text-xs text-gray-500 text-center">
                © {new Date().getFullYear()} QR-Genie
              </div>
            </div>
          </aside>
        </>
      )}

      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 pt-16 sm:pt-6">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 lg:w-72 flex-shrink-0 border-r border-indigo-100 bg-white/80 backdrop-blur-lg px-3 md:px-4 pt-4 md:pt-6 flex-col shadow-lg rounded-r-2xl">
          <div className="mb-4 md:mb-6 flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <FaQrcode className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <span className="ml-2 md:ml-3 text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                QR-Genie
              </span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const active =
                router.pathname === item.href ||
                (item.href === "/dashboard" &&
                  router.pathname === "/dashboard/index");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center rounded-xl px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700",
                  ].join(" ")}
                >
                  <span className={active ? "font-semibold" : ""}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-indigo-100 pt-3 md:pt-4 pb-3 md:pb-4">
            {user && subscriptionStatus && (
              <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 space-y-2">
                {subscriptionStatus.status === "TRIAL_ACTIVE" && (
                  <>
                    <p className="text-xs md:text-sm font-medium text-gray-900">Free trial – {subscriptionStatus.daysLeft} {subscriptionStatus.daysLeft === 1 ? "day" : "days"} left</p>
                    <Link href="/dashboard/billing" className="block w-full text-center py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs md:text-sm font-semibold">Upgrade</Link>
                  </>
                )}
                {(subscriptionStatus.status === "TRIAL_EXPIRED" || subscriptionStatus.status === "SUBSCRIPTION_EXPIRED" || subscriptionStatus.status === "NONE") && (
                  <>
                    <p className="text-xs md:text-sm font-medium text-gray-900">
                      {subscriptionStatus.status === "TRIAL_EXPIRED" ? "Trial expired – upgrade to reactivate" : subscriptionStatus.status === "SUBSCRIPTION_EXPIRED" ? "Subscription expired" : "No active plan"}
                    </p>
                    <Link href="/dashboard/billing" className="block w-full text-center py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs md:text-sm font-semibold">Upgrade</Link>
                  </>
                )}
                {subscriptionStatus.status === "SUBSCRIPTION_ACTIVE" && ["MONTHLY", "QUARTERLY", "ANNUAL"].includes(user.subscriptionPlan) && (
                  <>
                    <p className="text-xs md:text-sm font-medium text-gray-900">Plan: {PLAN_LABELS[user.subscriptionPlan] || user.subscriptionPlan}</p>
                    <Link href="/dashboard/billing" className="block w-full text-center py-1.5 rounded-lg border-2 border-indigo-600 text-indigo-600 text-xs md:text-sm font-semibold">Upgrade</Link>
                  </>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="mb-2 md:mb-3 w-full rounded-xl border border-red-200 bg-white px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium text-red-700 transition-all duration-200 hover:bg-red-50 hover:border-red-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Logout
            </button>
            <div className="text-[10px] md:text-xs text-gray-500 text-center md:text-left">
              © {new Date().getFullYear()} QR-Genie
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-h-full flex-1 flex-col md:pl-4 lg:pl-6 xl:pl-8 min-w-0">
          <main className="flex w-full flex-1 flex-col rounded-xl md:rounded-2xl border border-indigo-100 bg-white/80 backdrop-blur-lg px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-5 md:py-6 shadow-xl max-w-full overflow-hidden">
            {(title || description) && (
              <div className="mb-4 md:mb-6">
                {title && (
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="mt-1 md:mt-2 text-xs sm:text-sm text-gray-600">{description}</p>
                )}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
