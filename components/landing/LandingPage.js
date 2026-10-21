import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { FaArrowRight, FaCheck, FaLink, FaWifi } from "react-icons/fa";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SeoMeta from "@/components/layout/SeoMeta";
import PageBanner from "./PageBanner";
import { TYPE_PAGES, LANDING_LINKS } from "./landingPages";
import { container, sectionSpacing, primaryButton, secondaryButton, SectionHeading, FeatureGrid, StepsList, FaqList } from "./LandingUi";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { SITE_URL } from "@/lib/site";
import { organizationSchema, breadcrumbSchema, faqPageSchema } from "@/lib/seo";

// Banner picture on phones and tablets (decorative): the code itself, what it opens and its scans on one card that
// fits the screen, with the page's note tucked under its corner. Large screens show the bigger CodePanel instead.
function CodeCard({ page }) {
  const { card, qrColor, note } = page.preview;
  const Icon = page.eyebrow.icon;
  const Note = note.icon;
  return (
    <div className="relative mx-auto max-w-sm pb-12 pt-2 text-left sm:max-w-md lg:hidden">
      <div className="absolute inset-x-10 top-6 -z-10 h-32 rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-xl shadow-indigo-900/10 ring-1 ring-slate-900/5 sm:gap-5 sm:p-5">
        <div className="flex-none rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-2 ring-1 ring-indigo-100">
          <QRCodeSVG value={SITE_URL} size={88} level="M" fgColor={qrColor} bgColor="#ffffff" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="truncate font-display text-[15px] font-semibold text-slate-900">{card.title}</span>
          </div>
          <p className="mt-1.5 truncate text-xs text-slate-500">{card.detail}</p>
          {card.isStatic ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <FaCheck className="h-2.5 w-2.5" />
              {card.stat}
            </p>
          ) : (
            <div className="mt-3">
              <div className="flex h-7 items-end gap-1">
                {[38, 52, 34, 66, 58, 84, 100].map((height, i) => (
                  <span key={i} className="flex-1 rounded-sm bg-gradient-to-t from-indigo-500 to-purple-400" style={{ height: `${height}%` }} />
                ))}
              </div>
              <p className="mt-1.5 text-[11px] font-medium text-slate-500">{card.stat}</p>
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-5 right-4 flex items-center gap-2 rounded-xl bg-white py-2 pl-2 pr-3 shadow-lg shadow-indigo-900/10 ring-1 ring-slate-900/5 motion-safe:animate-float">
        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Note className="h-3 w-3" />
        </span>
        <span className="whitespace-nowrap text-xs font-semibold text-slate-900">{note.title}</span>
      </div>
    </div>
  );
}

// Banner picture on large screens (decorative): the code as it looks in the dashboard (name, status, the code itself
// and where it points), with its scans and the page's note floating beside it. Sized to fit inside the banner.
function CodePanel({ page }) {
  const { card, qrColor, note } = page.preview;
  const Icon = page.eyebrow.icon;
  const Note = note.icon;
  const Target = card.isStatic ? FaWifi : FaLink;
  const floating = "absolute rounded-2xl bg-white shadow-xl shadow-indigo-900/10 ring-1 ring-slate-900/5";

  return (
    <div className="absolute inset-0 hidden items-center justify-center lg:flex">
      <div className="absolute h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="relative w-[21rem] xl:w-[22.5rem]">
        <div className="rounded-[1.75rem] bg-white p-5 shadow-2xl shadow-indigo-900/10 ring-1 ring-slate-900/5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{card.title}</p>
                <p className="truncate text-xs text-slate-500">{card.isStatic ? "Static QR code" : "Dynamic QR code"}</p>
              </div>
            </div>
            <span className="inline-flex flex-none items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>

          <div className="mt-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 ring-1 ring-inset ring-indigo-100/70">
            <div className="mx-auto w-fit rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-900/5">
              <QRCodeSVG
                value={SITE_URL}
                size={120}
                level="H"
                fgColor={qrColor}
                bgColor="#ffffff"
                imageSettings={{ src: "/icon-192.png", height: 24, width: 24, excavate: true }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5">
            <Target className="h-3.5 w-3.5 flex-none text-indigo-500" />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{card.detail}</span>
            {card.isStatic ? (
              <span className="flex-none rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Static</span>
            ) : (
              <span className="flex-none rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">Edit link</span>
            )}
          </div>
        </div>

        {/* The floating cards never cover the code itself. Scans this week for dynamic codes; Wi-Fi codes join
            directly, so they say that instead */}
        {card.isStatic ? (
          <div className={`${floating} -right-16 top-[5.5rem] flex items-center gap-2 py-2.5 pl-2.5 pr-3.5 motion-safe:animate-float xl:-right-20`}>
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <FaCheck className="h-2.5 w-2.5" />
            </span>
            <span className="whitespace-nowrap text-xs font-semibold text-slate-900">{card.stat}</span>
          </div>
        ) : (
          <div className={`${floating} -right-16 top-[5.5rem] w-36 p-3 motion-safe:animate-float xl:-right-20`}>
            <p className="text-[11px] font-medium text-slate-500">{card.stat}</p>
            <div className="mt-2 flex h-9 items-end gap-1">
              {[38, 52, 34, 66, 58, 84, 100].map((height, i) => (
                <span key={i} className="flex-1 rounded-sm bg-gradient-to-t from-indigo-500 to-purple-400" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        )}

        <div className={`${floating} -bottom-7 -left-10 flex items-center gap-3 px-3.5 py-2.5 motion-safe:animate-float motion-safe:[animation-delay:-3s] xl:-left-14`}>
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Note className="h-3.5 w-3.5" />
          </span>
          <span className="whitespace-nowrap">
            <span className="block text-sm font-semibold text-slate-900">{note.title}</span>
            <span className="block text-xs text-slate-500">{note.text}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * A QR type or industry page (website, Wi-Fi, restaurants, hotels…): a banner (a code card that fits the banner on
 * every screen size), an overview with the buttons, benefits, steps, ideas, FAQ and links to the other pages.
 * page: one entry of LANDING_PAGES (components/landing/landingPages.js). The page is static; the signed-in state only
 * changes the buttons.
 */
export default function LandingPage({ page }) {
  const { loading, user } = useCurrentUser();
  const createHref = user ? `/dashboard/create-qr${page.createType ? `?type=${page.createType}` : ""}` : "/auth/register";

  const structuredData = [
    organizationSchema,
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: page.crumb, path: page.path },
    ]),
    faqPageSchema(page.faqs),
  ];

  return (
    <div className="min-h-screen bg-white">
      <SeoMeta title={page.seoTitle} description={page.description} path={page.path} jsonLd={structuredData} />
      <SiteHeader isAuthenticated={!!user} loading={loading} />

      <main>
        <PageBanner
          eyebrow={page.eyebrow}
          title={page.title}
          highlight={page.highlight}
          subtitle={page.subtitle}
          summary={page.summary}
          crumbs={[{ name: page.crumb, path: page.path }]}
          visualClassName="lg:h-auto"
          visual={
            <>
              {/* Phones and tablets: a compact card that fits the screen */}
              <CodeCard page={page} />

              {/* Large screens: the code card with its scans, sized to fit inside the banner */}
              <CodePanel page={page} />
            </>
          }
        />

        {/* Overview: the full introduction, the main points and the buttons */}
        <section className="bg-white py-12 sm:py-16">
          <div className={`${container} grid items-center gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-16`}>
            <div>
              <p className="border-l-2 border-indigo-200 pl-5 text-pretty text-[17px] leading-[1.8] text-slate-700 sm:pl-6">{page.intro}</p>
              <ul className="mt-6 flex flex-wrap gap-2.5">
                {page.benefits.items.slice(0, 3).map((item) => (
                  <li
                    key={item.title}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"
                  >
                    <FaCheck className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                    {item.title}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 shadow-sm ring-1 ring-indigo-100 sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-purple-200/40 blur-2xl" aria-hidden="true" />
              <p className="relative font-display text-xl font-semibold tracking-[-0.01em] text-slate-900">
                {user ? "Create it from your dashboard" : "Try it free for 14 days"}
              </p>
              <p className="relative mt-1.5 text-[15px] leading-relaxed text-slate-600">
                {user ? "Your new code is ready to download in a few minutes." : "Make your first code in minutes. No card needed, cancel anytime."}
              </p>
              <div className="relative mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link href={createHref} className={primaryButton}>
                  {page.cta}
                  <FaArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
                </Link>
                <Link href="/pricing" className={secondaryButton}>
                  See pricing
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className={`border-t border-slate-100 bg-white ${sectionSpacing}`}>
          <div className={container}>
            <SectionHeading eyebrow="Why it works" title={page.benefits.title} description={page.benefits.description} />
            <FeatureGrid items={page.benefits.items} />
          </div>
        </section>

        {/* Steps */}
        <section className={`relative isolate overflow-hidden bg-slate-50 ${sectionSpacing}`}>
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgb(224_231_255/0.8),transparent)]"
            aria-hidden="true"
          />
          <div className={container}>
            <SectionHeading eyebrow="How it works" title={page.steps.title} description="Ready in a few minutes, and you can change it whenever you like." />
            <StepsList steps={page.steps.items} />
          </div>
        </section>

        {/* Ideas */}
        <section className={`bg-white ${sectionSpacing}`}>
          <div className={container}>
            <SectionHeading eyebrow="Ideas" title={page.ideas.title} />
            <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {page.ideas.items.map((idea) => (
                <li
                  key={idea.title}
                  className="group flex cursor-pointer gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-900/5 hover:ring-indigo-200 motion-reduce:transform-none sm:p-6"
                >
                  <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors duration-300 group-hover:bg-emerald-500 group-hover:text-white">
                    <FaCheck className="h-2.5 w-2.5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">{idea.title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{idea.description}</p>
                    {idea.type && (
                      <Link
                        href={TYPE_PAGES[idea.type].path}
                        className="group/type mt-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold !text-indigo-700 ring-1 ring-inset ring-indigo-100 transition-colors hover:bg-indigo-100"
                      >
                        {TYPE_PAGES[idea.type].label}
                        <FaArrowRight className="h-2.5 w-2.5 transition-transform group-hover/type:translate-x-0.5 motion-reduce:transform-none" />
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ (the same questions go to search engines as FAQ structured data) */}
        <section className={`bg-slate-50 ${sectionSpacing}`}>
          <div className={container}>
            <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
            <FaqList faqs={page.faqs} />
          </div>
        </section>

        {/* Other pages */}
        <section className="bg-white pb-4 pt-16 sm:pt-20">
          <div className={container}>
            <h2 className="text-center text-xl font-semibold tracking-[-0.01em] text-slate-900 sm:text-2xl">More ways to use QR-Genie</h2>
            <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-3">
              {page.related.map((path) => (
                <li key={path}>
                  <Link
                    href={path}
                    className="btn-shine btn-shine-soft group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold !text-slate-700 shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-0.5 hover:!text-indigo-700 hover:shadow-md hover:ring-indigo-200 motion-reduce:transform-none"
                  >
                    {LANDING_LINKS[path].long}
                    <FaArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter showCta isAuthenticated={!!user} />
    </div>
  );
}
