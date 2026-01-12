import Link from "next/link";
import { useRouter } from "next/router";
import { FaQrcode } from "react-icons/fa";

const navItems = [
  { href: "/dashboard/create-qr", label: "Create QR Code" },
  { href: "/dashboard", label: "My QR Codes" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/account", label: "My Account" },
  { href: "/dashboard/billing", label: "Billing" },
];

export default function DashboardLayout({ children, title, description }) {
  const router = useRouter();

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen w-full px-4 py-6 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white px-4 pt-6 sm:flex sm:flex-col">
          <div className="mb-6 flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <FaQrcode className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-slate-900">QR-Genie</span>
            </div>
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
                    "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-indigo-50 text-indigo-700 shadow-sm"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")}
                >
                  <span className={active ? "font-semibold" : ""}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-200 pt-4 pb-4">
            <button
              type="button"
              onClick={handleLogout}
              className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-150 hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Logout
            </button>
            <div className="text-xs text-slate-500">
              © {new Date().getFullYear()} QR-Genie
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-h-full flex-1 flex-col pl-4 sm:pl-6 lg:pl-8">
          {/* Top bar for small screens */}
          <header className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:hidden">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <FaQrcode className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-slate-900">QR-Genie</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded px-2 py-1"
            >
              Logout
            </button>
          </header>

          <main className="flex w-full flex-1 flex-col rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-md sm:px-6">
            {(title || description) && (
              <div className="mb-5">
                {title && (
                  <h1 className="text-base font-semibold text-slate-900">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="mt-1 text-sm text-slate-600">{description}</p>
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
