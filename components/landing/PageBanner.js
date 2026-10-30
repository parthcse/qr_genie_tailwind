import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
import { container, HeroTitle } from "./LandingUi";

/**
 * The top of an inner marketing page (QR type, industry and pricing pages), deliberately calmer than the home page
 * hero: a medium-height banner on a plain light background with the h1, tagline and a short summary on the left and
 * a picture on the right, then the breadcrumb on its own row underneath.
 * - eyebrow: { icon, label }; title + highlight + subtitle: the h1 (see HeroTitle)
 * - visual: the picture on the right (decorative). On large screens it sits in a box as tall as the banner (at least
 *   26rem), so a picture centred in it fits without being cut off. visualClassName: that box's height per screen
 *   size (or "hidden lg:block" to leave the picture out on phones)
 * - crumbs: [{ name, path }] after Home; the last one is the current page (see BreadcrumbBar)
 */
export default function PageBanner({ eyebrow, title, highlight, subtitle, summary, visual, visualClassName = "h-48 sm:h-64 lg:h-auto", crumbs }) {
  const Icon = eyebrow.icon;

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-indigo-100/80 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="pointer-events-none absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full bg-purple-200/40 blur-3xl" aria-hidden="true" />
        <div className={`${container} grid gap-2 lg:min-h-[26rem] lg:grid-cols-[1.2fr_1fr] lg:gap-10`}>
          <div className="self-center pb-8 pt-12 text-center sm:pt-14 lg:py-16 lg:text-left xl:py-20">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100">
              <Icon className="h-3.5 w-3.5" />
              {eyebrow.label}
            </div>
            <HeroTitle title={title} highlight={highlight} subtitle={subtitle} compact className="mt-5" />
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-[1.7] text-slate-600 lg:mx-0">{summary}</p>
          </div>

          <div className={`relative ${visualClassName}`} aria-hidden="true">
            {visual}
          </div>
        </div>
      </section>

      <BreadcrumbBar crumbs={crumbs} />
    </>
  );
}

/**
 * The breadcrumb on its own row under a banner (PageBanner, blog articles): Home, then crumbs ([{ name, path }]); the
 * last one is the current page, cut short with "…" when it doesn't fit on one line.
 */
export function BreadcrumbBar({ crumbs }) {
  const current = crumbs[crumbs.length - 1];
  return (
    <nav aria-label="Breadcrumb" className="border-b border-slate-100 bg-white">
      <ol className={`${container} flex items-center gap-2 py-3.5 text-sm text-slate-500`}>
        <li className="flex-none">
          <Link href="/" className="font-medium !text-slate-500 transition-colors hover:!text-indigo-700">
            Home
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.path} className={`flex items-center gap-2 ${crumb === current ? "min-w-0" : "flex-none"}`}>
            <FaChevronRight className="h-2.5 w-2.5 flex-none text-slate-400" aria-hidden="true" />
            {crumb === current ? (
              <span aria-current="page" className="truncate font-medium text-slate-700">
                {crumb.name}
              </span>
            ) : (
              <Link href={crumb.path} className="font-medium !text-slate-500 transition-colors hover:!text-indigo-700">
                {crumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
