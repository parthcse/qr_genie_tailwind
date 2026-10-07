import Link from "next/link";
import { FaQrcode, FaCheck, FaEnvelope, FaLock, FaArrowUp } from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import { SUPPORT_EMAIL, SITE_URL } from "@/lib/site";

const SIGNUP_URL = `${SITE_URL}/auth/register`;

// Hover: the colour deepens and a thin gradient underline grows from the left
const footerLink =
  "bg-gradient-to-r from-indigo-500 to-purple-500 bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 !text-gray-500 transition-all duration-300 hover:bg-[length:100%_1px] hover:!text-indigo-700 motion-reduce:transition-none";

/**
 * Site-wide footer.
 * - showCta: the closing sign-up panel with a scannable QR code (landing page only)
 * - isAuthenticated: which account links to show
 */
export default function SiteFooter({ showCta = false, isAuthenticated = false }) {
  const container = "mx-auto max-w-site px-4 sm:px-6 lg:px-8";

  return (
    <footer className="relative bg-white" role="contentinfo">
      {showCta && (
        <div className={`${container} pt-16 md:pt-20`}>
          <section
            aria-labelledby="footer-cta-heading"
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 px-6 py-12 shadow-2xl shadow-indigo-900/20 sm:px-10 md:px-14 md:py-16"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(167,139,250,0.3)_0%,transparent_55%)]"
              aria-hidden="true"
            />
            <div className="relative grid items-center gap-10 md:grid-cols-[1fr_auto] md:gap-16">
              <div>
                <h2
                  id="footer-cta-heading"
                  className="max-w-xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl"
                >
                  Print once. Change the link whenever you like.
                </h2>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-indigo-200 md:text-lg">
                  Dynamic QR codes you can edit after they&apos;re printed, with scan analytics built in.
                  Try it free for 14 days, no card needed.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href={isAuthenticated ? "/dashboard" : "/auth/register"}
                    className="btn-shine btn-shine-soft inline-flex items-center justify-center rounded-xl bg-white px-7 py-3.5 text-base font-semibold !text-indigo-950 shadow-lg transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
                  >
                    {isAuthenticated ? "Go to dashboard" : "Start free trial"}
                  </Link>
                  <Link
                    href="/#pricing"
                    className="btn-shine inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-base font-semibold !text-white ring-1 ring-inset ring-white/25 transition hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
                  >
                    See pricing
                  </Link>
                </div>
              </div>

              {/* Illustration of the headline: one printed code whose link changes. Signed out, the code is
                  real and opens the sign-up page; the notes around it never cover the code itself. */}
              <figure className="relative mx-auto hidden w-60 pb-16 pt-10 md:block lg:w-72">
                <div className="absolute inset-6 rounded-full bg-purple-400/30 blur-3xl" aria-hidden="true" />

                <div className="relative -rotate-2 rounded-2xl bg-white p-5 shadow-2xl shadow-black/30 transition-transform duration-500 hover:rotate-0 motion-reduce:transition-none">
                  <div className="flex items-center justify-between gap-2" aria-hidden="true">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700">Printed once</span>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">Dynamic</span>
                  </div>
                  <div className="mt-4 flex justify-center rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                    <QRCodeSVG
                      value={isAuthenticated ? SITE_URL : SIGNUP_URL}
                      size={152}
                      level="H"
                      fgColor="#1e1b4b"
                      bgColor="#ffffff"
                      imageSettings={{ src: "/favicon.png", height: 30, width: 30, excavate: true }}
                      title={isAuthenticated ? "QR code that opens the QR-Genie website" : "QR code that opens the QR-Genie sign-up page"}
                    />
                  </div>
                  {!isAuthenticated && (
                    <figcaption className="mt-3 text-center text-xs leading-snug text-slate-600">
                      Scan with your phone camera to sign up
                    </figcaption>
                  )}
                </div>

                <div
                  className="absolute -right-6 top-0 flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 shadow-xl shadow-black/25 motion-safe:animate-float lg:-right-10"
                  aria-hidden="true"
                >
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <FaCheck className="h-3 w-3" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold text-slate-900">Link updated</span>
                    <span className="block text-[11px] text-slate-500">yourcafe.com/winter-menu</span>
                  </span>
                </div>

                <div
                  className="absolute -left-6 bottom-0 w-40 rounded-xl bg-white px-3 py-2.5 shadow-xl shadow-black/25 motion-safe:animate-float motion-safe:[animation-delay:-3s] lg:-left-10"
                  aria-hidden="true"
                >
                  <span className="block text-[11px] font-medium text-slate-500">Scans this month</span>
                  <span className="mt-2 flex h-8 items-end gap-1">
                    {[35, 55, 45, 70, 60, 90, 100].map((height, i) => (
                      <span key={i} className="flex-1 rounded-sm bg-gradient-to-t from-indigo-500 to-purple-400" style={{ height: `${height}%` }} />
                    ))}
                  </span>
                </div>
              </figure>
            </div>
          </section>
        </div>
      )}

      <div className="relative bg-gradient-to-b from-white to-slate-50/80">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent"
          aria-hidden="true"
        />
        <div className={`${container} pb-8 ${showCta ? "pt-16" : "pt-14"}`}>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-4">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md">
                  <FaQrcode className="h-5 w-5 text-white" />
                </span>
                <span className="font-display text-lg font-bold tracking-tight text-gray-900">QR-Genie</span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">
                Dynamic QR codes for menus, events and campaigns, editable any time after printing.
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="group mt-6 inline-flex items-center gap-3 rounded-2xl bg-white py-2.5 pl-2.5 pr-5 shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-200 motion-reduce:transform-none"
              >
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 ring-1 ring-inset ring-indigo-100 transition-colors duration-300 group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white group-hover:ring-transparent">
                  <FaEnvelope className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-xs text-slate-500">Questions? Email us</span>
                  <span className="block text-sm font-semibold text-slate-900 transition-colors group-hover:text-indigo-700">{SUPPORT_EMAIL}</span>
                </span>
              </a>
            </div>

            {/* Phones: Product on the left, Account and Support stacked on the right */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-8 lg:pl-16">
              <nav aria-labelledby="footer-product" className="row-span-2 sm:row-span-1">
                <h3 id="footer-product" className="text-sm font-semibold text-gray-900">Product</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  <li><Link href="/#qr-types" className={footerLink}>QR code types</Link></li>
                  <li><Link href="/#features" className={footerLink}>Features</Link></li>
                  <li><Link href="/#how-it-works" className={footerLink}>How it works</Link></li>
                  <li><Link href="/#pricing" className={footerLink}>Pricing</Link></li>
                  <li><Link href="/#testimonials" className={footerLink}>Testimonials</Link></li>
                </ul>
              </nav>
              <nav aria-labelledby="footer-account">
                <h3 id="footer-account" className="text-sm font-semibold text-gray-900">Account</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {isAuthenticated ? (
                    <>
                      <li><Link href="/dashboard" className={footerLink}>My QR codes</Link></li>
                      <li><Link href="/dashboard/create-qr" className={footerLink}>Create a QR code</Link></li>
                      <li><Link href="/dashboard/billing" className={footerLink}>Billing</Link></li>
                    </>
                  ) : (
                    <>
                      <li><Link href="/auth/login" className={footerLink}>Log in</Link></li>
                      <li><Link href="/auth/register" className={footerLink}>Start free trial</Link></li>
                    </>
                  )}
                </ul>
              </nav>
              <nav aria-labelledby="footer-support">
                <h3 id="footer-support" className="text-sm font-semibold text-gray-900">Support</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  <li><Link href="/contact" className={footerLink}>Contact us</Link></li>
                  <li><Link href="/privacy" className={footerLink}>Privacy policy</Link></li>
                  <li><Link href="/terms" className={footerLink}>Terms of service</Link></li>
                  <li><Link href="/refund-policy" className={footerLink}>Refund policy</Link></li>
                </ul>
              </nav>
            </div>
          </div>

          <div className="mt-14 flex flex-col-reverse gap-5 border-t border-slate-200/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} QR-Genie. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-3">
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
                <FaLock className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                Payments are processed securely by Razorpay.
              </p>
              {/* Glides up with the site's smooth scrolling (instant when motion is reduced) */}
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0 })}
                className="btn-shine btn-shine-soft group inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:text-indigo-700 hover:ring-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                Back to top
                <FaArrowUp className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 motion-reduce:transform-none" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
