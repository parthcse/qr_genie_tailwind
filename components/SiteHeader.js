import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaQrcode, FaThLarge, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaBars, FaTimes, FaChevronRight } from "react-icons/fa";

// Main menu. "/#..." glides to the section on the landing page and navigates there from anywhere else
const SECTION_LINKS = [
  { href: "/#qr-types", label: "QR types" },
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/contact", label: "Contact" },
];

// Header account icons share one filled style, signed in or not; log out turns red on hover
const iconBase =
  "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br !text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
const iconButton = `${iconBase} from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus-visible:ring-indigo-400`;
const logoutIconButton = `${iconBase} from-indigo-600 to-purple-600 hover:from-rose-500 hover:to-red-600 focus-visible:ring-red-400`;

function Logo({ onClick }) {
  return (
    <Link href="/" onClick={onClick} className="group flex flex-shrink-0 items-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg transition-shadow group-hover:shadow-xl sm:h-10 sm:w-10">
        <FaQrcode className="h-5 w-5 text-white sm:h-6 sm:w-6" />
      </span>
      <span className="ml-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text font-display text-xl font-bold tracking-tight text-transparent sm:ml-3 sm:text-2xl">
        QR-Genie
      </span>
    </Link>
  );
}

/**
 * Site-wide header with a full-height menu that slides in from the right on smaller screens.
 * - isAuthenticated / loading: which account actions to show (icons when signed in, log in / get started otherwise)
 * - onLogout: defaults to logging out and showing the logged-out page
 * - drawerLinks: [{ href, label, active, icon? }] for the menu; defaults to the landing page sections
 * - drawerFooter: (close) => node pinned to the bottom of the menu; defaults to account buttons
 * - menuBreakpoint: "lg" (default) or "md" — the width from which the menu button is hidden
 */
export default function SiteHeader({
  isAuthenticated = false,
  loading = false,
  onLogout,
  drawerLinks,
  drawerFooter,
  menuBreakpoint = "lg",
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const wasOpen = useRef(false);

  const close = () => setOpen(false);

  // Escape closes; lock page scroll while open; move focus into the menu and back to the button afterwards
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const onKeyDown = (e) => {
        if (e.key === "Escape") setOpen(false);
      };
      window.addEventListener("keydown", onKeyDown);
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      closeButtonRef.current?.focus();
      return () => {
        window.removeEventListener("keydown", onKeyDown);
        document.body.style.overflow = previousOverflow;
      };
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      menuButtonRef.current?.focus();
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [router.asPath]);

  // On the landing page, underline the menu link of the section being read: the one crossing a thin
  // line 40% down the screen (none while the hero or the "trusted by" band is there)
  const [activeSection, setActiveSection] = useState(null);
  useEffect(() => {
    setActiveSection(null);
    if (router.pathname !== "/" || !("IntersectionObserver" in window)) return undefined;
    const sections = SECTION_LINKS.map((link) => document.getElementById(link.href.split("#")[1] || "")).filter(Boolean);
    const crossing = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => (entry.isIntersecting ? crossing.add(entry.target.id) : crossing.delete(entry.target.id)));
        setActiveSection(sections.find((section) => crossing.has(section.id))?.id || null);
      },
      { rootMargin: "-40% 0px -59% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [router.pathname]);

  const handleLogout =
    onLogout ||
    (async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      } finally {
        router.push("/auth/logout");
      }
    });

  const container = "mx-auto max-w-site px-4 sm:px-6 lg:px-8";
  const hiddenFrom = menuBreakpoint === "md" ? "md:hidden" : "lg:hidden";
  const links = drawerLinks || SECTION_LINKS;

  let actions;
  if (loading) {
    actions = <div className="h-10 w-[84px] animate-pulse rounded-xl bg-gray-100" aria-hidden="true" />;
  } else if (isAuthenticated) {
    actions = (
      <div className="flex items-center gap-1.5">
        <Link href="/dashboard" aria-label="Dashboard" title="Dashboard" className={iconButton}>
          <FaThLarge className="h-[18px] w-[18px]" />
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
          className={logoutIconButton}
        >
          <FaSignOutAlt className="h-[18px] w-[18px]" />
        </button>
      </div>
    );
  } else {
    actions = (
      <div className="flex items-center gap-1.5">
        <Link href="/auth/login" aria-label="Log in" title="Log in" className={iconButton}>
          <FaSignInAlt className="h-[18px] w-[18px]" />
        </Link>
        <Link href="/auth/register" aria-label="Get started free" title="Get started free" className={iconButton}>
          <FaUserPlus className="h-[18px] w-[18px]" />
        </Link>
      </div>
    );
  }

  const defaultDrawerFooter = isAuthenticated ? (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => {
          close();
          handleLogout();
        }}
        className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        <FaSignOutAlt className="h-3.5 w-3.5" />
        Log out
      </button>
      <Link
        href="/dashboard"
        onClick={close}
        className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-center text-sm font-semibold !text-white shadow-md"
      >
        Dashboard
      </Link>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-3">
      <Link
        href="/auth/login"
        onClick={close}
        className="rounded-xl border border-gray-200 py-3 text-center text-sm font-semibold !text-gray-800 transition hover:bg-gray-50"
      >
        Log in
      </Link>
      <Link
        href="/auth/register"
        onClick={close}
        className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-center text-sm font-semibold !text-white shadow-md"
      >
        Get started
      </Link>
    </div>
  );

  return (
    <>
      {/* Solid and GPU-layered on small screens: a backdrop blur repainting on every scroll frame makes the header jitter on phones */}
      <header className="sticky top-0 z-40 transform-gpu border-b border-gray-100 bg-white shadow-sm md:bg-white/80 md:backdrop-blur-lg">
        <div className={container}>
          {/* From lg: three columns so the section links sit in the exact centre whatever the side widths */}
          <div className="flex h-16 items-center justify-between gap-4 sm:h-20 lg:grid lg:grid-cols-[1fr_auto_1fr]">
            <div className="flex min-w-0 items-center">
              <Logo />
            </div>
            <nav className="hidden lg:flex lg:items-center lg:gap-1 xl:gap-6" aria-label="Site sections">
              {SECTION_LINKS.map((link) => {
                const current = activeSection !== null && link.href === `/#${activeSection}`;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={current ? "true" : undefined}
                    className={`relative whitespace-nowrap px-3 py-2 text-[15px] font-semibold transition-colors duration-200 hover:!text-indigo-700 focus:outline-none focus-visible:!text-indigo-700 after:absolute after:inset-x-3 after:bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-gradient-to-r after:from-indigo-600 after:to-purple-600 after:transition-transform after:duration-300 after:ease-out after:content-[''] hover:after:scale-x-100 focus-visible:after:scale-x-100 motion-reduce:after:transition-none ${
                      current ? "!text-indigo-700 after:scale-x-100" : "!text-gray-700 after:scale-x-0"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex flex-none items-center justify-end gap-1 sm:gap-2">
              {actions}
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setOpen(true)}
                aria-expanded={open}
                aria-controls="site-drawer"
                aria-label="Open menu"
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${hiddenFrom}`}
              >
                <FaBars className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full-height menu sliding in from the right; stays mounted so it can animate out */}
      <div className={`fixed inset-0 z-50 ${hiddenFrom} ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-300 motion-reduce:transition-none ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={close}
        />
        <aside
          id="site-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute inset-y-0 right-0 flex h-[100dvh] w-[86vw] max-w-sm flex-col bg-white shadow-2xl transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none ${
            open ? "visible translate-x-0" : "invisible translate-x-full"
          }`}
        >
          <div className="flex h-16 flex-none items-center justify-between border-b border-gray-100 px-5 sm:h-20">
            <Logo onClick={close} />
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  aria-current={link.active ? "page" : undefined}
                  className={
                    link.active
                      ? "mb-1 flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3.5 text-base font-semibold !text-white shadow-md"
                      : "mb-1 flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium !text-gray-800 transition hover:bg-indigo-50 hover:!text-indigo-700"
                  }
                >
                  <span className="flex items-center gap-3">
                    {Icon && <Icon className={`h-4 w-4 ${link.active ? "text-white" : "text-indigo-500"}`} />}
                    {link.label}
                  </span>
                  <FaChevronRight className={`h-3 w-3 ${link.active ? "text-white/70" : "text-gray-300"}`} />
                </Link>
              );
            })}
          </nav>

          <div className="flex-none border-t border-gray-100 px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {drawerFooter ? drawerFooter(close) : !loading && defaultDrawerFooter}
          </div>
        </aside>
      </div>
    </>
  );
}
