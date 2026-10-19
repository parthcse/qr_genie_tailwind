import Link from "next/link";
import { FaArrowRight, FaCheck, FaChevronRight } from "react-icons/fa";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SeoMeta from "@/components/layout/SeoMeta";
import { PhonePreview } from "./TypeScreen";
import { TYPE_PAGES, LANDING_LINKS } from "./landingPages";
import {
  container,
  sectionSpacing,
  primaryButton,
  secondaryButton,
  HeroBackground,
  HeroTitle,
  SectionHeading,
  FeatureGrid,
  StepsList,
  FaqList,
} from "./LandingUi";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { organizationSchema, breadcrumbSchema, faqPageSchema } from "@/lib/seo";

/**
 * A QR type or industry page (website, Wi-Fi, restaurants, hotels…): hero with a phone preview, benefits, steps,
 * ideas, FAQ and links to the other pages. page: one entry of LANDING_PAGES (components/landing/landingPages.js).
 * The page is static; the signed-in state only changes where the main button goes.
 */
export default function LandingPage({ page }) {
  const { loading, user } = useCurrentUser();
  const createHref = user ? `/dashboard/create-qr${page.createType ? `?type=${page.createType}` : ""}` : "/auth/register";
  const Eyebrow = page.eyebrow.icon;
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
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <HeroBackground />
          <div className={`${container} pb-16 pt-10 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-16`}>
            <nav aria-label="Breadcrumb" className="flex justify-center lg:justify-start">
              <ol className="flex items-center gap-2 text-sm text-slate-500">
                <li>
                  <Link href="/" className="font-medium !text-slate-500 transition-colors hover:!text-indigo-700">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">
                  <FaChevronRight className="h-2.5 w-2.5 text-slate-400" />
                </li>
                <li aria-current="page" className="font-medium text-slate-700">
                  {page.crumb}
                </li>
              </ol>
            </nav>

            <div className="mt-8 grid items-center gap-14 lg:mt-10 lg:grid-cols-[1.1fr_1fr] lg:gap-10 xl:gap-16">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100">
                  <Eyebrow className="h-3.5 w-3.5" />
                  {page.eyebrow.label}
                </div>

                <HeroTitle title={page.title} subtitle={page.subtitle} />

                <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-600 sm:text-xl lg:mx-0">{page.intro}</p>

                <div className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center lg:justify-start">
                  <Link href={createHref} className={primaryButton}>
                    {page.cta}
                    <FaArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
                  </Link>
                  <Link href="/pricing" className={secondaryButton}>
                    See pricing
                  </Link>
                </div>
                {!user && (
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-600 lg:justify-start">
                    <FaCheck className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                    Free for 14 days, no card needed
                  </p>
                )}
              </div>

              <div className="relative pb-4 lg:pb-0">
                <PhonePreview
                  type={page.preview.type}
                  screen={page.preview.screen}
                  qrColor={page.preview.qrColor}
                  className="max-w-[14rem] sm:max-w-[16rem] lg:max-w-[17rem]"
                >
                  {/* A note about what just happened, floating beside the phone (lower down on phones, where it
                      covers only the empty part of the screen) */}
                  <div className="absolute -right-5 bottom-20 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-indigo-900/10 ring-1 ring-slate-900/5 motion-safe:animate-float sm:bottom-auto sm:-right-20 sm:top-14 lg:-right-16 xl:-right-24">
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
