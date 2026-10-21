import Link from "next/link";
import { FaArrowRight, FaCheck } from "react-icons/fa";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SeoMeta from "@/components/layout/SeoMeta";
import PageBanner from "./PageBanner";
import { PhonePreview } from "./TypeScreen";
import { TYPE_PAGES, LANDING_LINKS } from "./landingPages";
import { container, sectionSpacing, primaryButton, secondaryButton, SectionHeading, FeatureGrid, StepsList, FaqList } from "./LandingUi";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { organizationSchema, breadcrumbSchema, faqPageSchema } from "@/lib/seo";

/**
 * A QR type or industry page (website, Wi-Fi, restaurants, hotels…): a banner with a phone preview, an overview with
 * the buttons, benefits, steps, ideas, FAQ and links to the other pages. page: one entry of LANDING_PAGES
 * (components/landing/landingPages.js). The page is static; the signed-in state only changes the buttons.
 */
export default function LandingPage({ page }) {
  const { loading, user } = useCurrentUser();
  const createHref = user ? `/dashboard/create-qr${page.createType ? `?type=${page.createType}` : ""}` : "/auth/register";
  const Note = page.preview.note.icon;

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
          visual={
            <>
              <div className="absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/3 rounded-full bg-indigo-300/30 blur-3xl" />
              {/* The phone rises from the bottom edge of the banner, which cuts it off */}
              <div className="absolute left-1/2 top-6 w-52 -translate-x-1/2 sm:w-60 lg:top-12 lg:w-64">
                <PhonePreview
                  type={page.preview.type}
                  screen={page.preview.screen}
                  qrColor={page.preview.qrColor}
                  className=""
                  qrClassName="hidden lg:block -left-28 top-44"
                >
                  {/* A note about what just happened, floating over the top corner of the phone like a notification
                      (clear of the screen's headline text) */}
                  <div className="absolute -right-24 top-3 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-indigo-900/10 ring-1 ring-slate-900/5 motion-safe:animate-float sm:flex lg:-right-20 xl:-right-28">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Note className="h-3.5 w-3.5" />
                    </span>
                    <span className="whitespace-nowrap">
                      <span className="block text-sm font-semibold text-slate-900">{page.preview.note.title}</span>
                      <span className="block text-xs text-slate-500">{page.preview.note.text}</span>
                    </span>
                  </div>
                </PhonePreview>
              </div>
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
