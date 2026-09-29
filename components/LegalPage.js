import Head from "next/head";
import Link from "next/link";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { useCurrentUser } from "../lib/useCurrentUser";
import { LEGAL_LAST_UPDATED, SUPPORT_EMAIL } from "../lib/site";

const POLICIES = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
  { href: "/refund-policy", label: "Refund policy" },
];

/**
 * Layout for policy pages: title band, "on this page" list (sticky on desktop) and readable sections.
 * sections: [{ id, heading, body }] where body is JSX (paragraphs, lists, links)
 */
export default function LegalPage({ path, title, description, intro, sections }) {
  const { loading, user } = useCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Head>
        <title>{`${title} | QR-Genie`}</title>
        <meta name="description" content={description} />
      </Head>
      <SiteHeader isAuthenticated={!!user} loading={loading} />

      <main className="flex-1">
        <div className="border-b border-indigo-100/70 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="mx-auto max-w-site px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600">{intro}</p>
            <p className="mt-5 text-sm text-gray-500">Last updated {LEGAL_LAST_UPDATED}</p>
          </div>
        </div>

        <div className="mx-auto grid max-w-site gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-28">
              <p className="text-sm font-semibold text-gray-900">On this page</p>
              <ol className="mt-4 space-y-2.5 border-l border-gray-200 text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="-ml-px block border-l border-transparent pl-4 !text-gray-500 transition hover:border-indigo-400 hover:!text-indigo-700">
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <article className="max-w-3xl">
            <div className="space-y-12">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-28">
                  <h2 className="text-xl font-semibold tracking-tight text-gray-900">{section.heading}</h2>
                  <div className="mt-4 space-y-4 text-[15px] leading-7 text-gray-700 [&_a]:font-medium [&_a]:!text-indigo-600 [&_a:hover]:!text-indigo-700 [&_a[href^=mailto]]:whitespace-nowrap [&_strong]:font-semibold [&_strong]:text-gray-900 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_li::marker]:text-indigo-300">
                    {section.body}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-16 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900">Questions about this policy?</h2>
              <p className="mt-1 text-sm text-gray-600">
                Send us a message or email{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium !text-indigo-600 hover:!text-indigo-700">{SUPPORT_EMAIL}</a>.
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold !text-white shadow-md transition hover:from-indigo-700 hover:to-purple-700"
              >
                Contact us
              </Link>
            </div>

            <nav aria-label="Other policies" className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {POLICIES.filter((p) => p.href !== path).map((p) => (
                <Link key={p.href} href={p.href} className="font-medium !text-gray-500 hover:!text-indigo-700">
                  {p.label}
                </Link>
              ))}
            </nav>
          </article>
        </div>
      </main>

      <SiteFooter isAuthenticated={!!user} />
    </div>
  );
}
