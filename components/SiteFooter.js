import Link from "next/link";
import { FaQrcode } from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";

const SIGNUP_URL = `${(process.env.NEXT_PUBLIC_BASE_URL || "https://qr-genie.co").replace(/\/$/, "")}/auth/register`;

const footerLink = "!text-gray-500 transition hover:!text-indigo-700";

/**
 * Site-wide footer.
 * - showCta: the closing sign-up panel with a scannable QR code (landing page only)
 * - isAuthenticated: which account links to show
 */
export default function SiteFooter({ showCta = false, isAuthenticated = false }) {
  const container = "mx-auto max-w-site px-4 sm:px-6 lg:px-8";

  return (
    <footer className={`relative bg-white ${showCta ? "" : "border-t border-gray-100"}`} role="contentinfo">
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
                    className="inline-flex items-center justify-center rounded-xl bg-white px-7 py-3.5 text-base font-semibold !text-indigo-950 shadow-lg transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
                  >
                    {isAuthenticated ? "Go to dashboard" : "Start free trial"}
                  </Link>
                  <Link
                    href="/#pricing"
                    className="inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-base font-semibold !text-white ring-1 ring-inset ring-white/25 transition hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
                  >
                    See pricing
                  </Link>
                </div>
              </div>

              {!isAuthenticated && (
                <figure className="hidden flex-col items-center md:flex">
                  <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-white/10">
                    <QRCodeSVG
                      value={SIGNUP_URL}
                      size={152}
                      level="H"
                      fgColor="#1e1b4b"
                      bgColor="#ffffff"
                      imageSettings={{ src: "/favicon.png", height: 30, width: 30, excavate: true }}
                      title="QR code that opens the QR-Genie sign-up page"
                    />
                  </div>
                  <figcaption className="mt-4 max-w-[12rem] text-center text-sm leading-snug text-indigo-200">
                    Scan with your phone camera to sign up
                  </figcaption>
                </figure>
              )}
            </div>
          </section>
        </div>
      )}

      <div className={`${container} pb-10 ${showCta ? "pt-14" : "pt-12"}`}>
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md">
                <FaQrcode className="h-5 w-5 text-white" />
              </span>
              <span className="text-lg font-bold text-gray-900">QR-Genie</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              Dynamic QR codes for menus, events and campaigns, editable any time after printing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-16">
            <nav aria-labelledby="footer-product">
              <h3 id="footer-product" className="text-sm font-semibold text-gray-900">Product</h3>
              <ul className="mt-4 space-y-3 text-sm">
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

        <div className="mt-12 flex flex-col gap-2 border-t border-gray-100 pt-6 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} QR-Genie. All rights reserved.</p>
          <p>Payments are processed securely by Razorpay.</p>
        </div>
      </div>
    </footer>
  );
}
