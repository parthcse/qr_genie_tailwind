import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaBookOpen, FaThLarge } from "react-icons/fa";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SeoMeta from "@/components/layout/SeoMeta";
import PageBanner from "@/components/landing/PageBanner";
import { container, secondaryButton } from "@/components/landing/LandingUi";
import { BlogVisual, PostCard } from "@/components/blog/BlogUi";
import { BLOG_PATH } from "@/lib/blog/format";
import { BLOG_REVALIDATE_SECONDS, getBlogPosts, isBuildPhase } from "@/lib/blog/wordpress";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { organizationSchema, breadcrumbSchema, blogSchema } from "@/lib/seo";

// Articles shown at first and added by each "Show more": full rows of 4, 3 or 2 cards
const PAGE_SIZE = 12;

// Built once and refreshed from WordPress in the background every few minutes (lib/blog/wordpress.js). If WordPress
// can't be reached while a deploy builds the site, the blog starts empty and tries again a minute later; on the live
// site a failed refresh keeps the last good version.
export async function getStaticProps() {
  try {
    return { props: { posts: await getBlogPosts() }, revalidate: BLOG_REVALIDATE_SECONDS };
  } catch (error) {
    if (!isBuildPhase()) throw error;
    console.error(`Blog: WordPress could not be read during the build (${error.message}); the list refreshes in a minute.`);
    return { props: { posts: [] }, revalidate: 60 };
  }
}

/** /blog: every article as a card, newest first, 4 across on wide screens, with a topic filter (?category=<slug>) */
export default function BlogPage({ posts }) {
  const router = useRouter();
  const { loading, user } = useCurrentUser();

  // Topics with at least one article, the busiest first
  const categories = useMemo(() => {
    const counts = new Map();
    posts.forEach((post) =>
      post.categories.forEach((category) => counts.set(category.slug, { ...category, count: (counts.get(category.slug)?.count || 0) + 1 }))
    );
    return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [posts]);

  const requested = typeof router.query.category === "string" ? router.query.category : null;
  const active = categories.find((category) => category.slug === requested) || null;
  const [shown, setShown] = useState(PAGE_SIZE);
  useEffect(() => setShown(PAGE_SIZE), [active?.slug]);

  const choose = (slug) =>
    router.replace({ pathname: BLOG_PATH, query: slug ? { category: slug } : {} }, undefined, { shallow: true, scroll: false });

  const matching = active ? posts.filter((post) => post.categories.some((category) => category.slug === active.slug)) : posts;
  const visible = matching.slice(0, shown);

  const title = "QR Code Blog: Guides, Tips and Ideas | QR-Genie";
  const description =
    "Guides, tips and ideas for QR codes that work: restaurant menus, Wi-Fi, events, marketing and scan tracking. Practical advice from the QR-Genie team.";
  const structuredData = [
    organizationSchema,
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog", path: BLOG_PATH },
    ]),
    blogSchema(posts),
  ];

  return (
    <div className="min-h-screen bg-white">
      <SeoMeta title={title} description={description} path={BLOG_PATH} jsonLd={structuredData} />
      <SiteHeader isAuthenticated={!!user} loading={loading} />

      <main>
        <PageBanner
          eyebrow={{ icon: FaBookOpen, label: "Blog" }}
          title="The QR-Genie"
          highlight="Blog"
          subtitle="Ideas and how-tos for QR codes people scan"
          summary="Practical guides on creating, printing and tracking QR codes for menus, events, shops and campaigns, from the team behind QR-Genie."
          crumbs={[{ name: "Blog", path: BLOG_PATH }]}
          visual={<BlogVisual />}
          visualClassName="hidden lg:block"
        />

        <section className="bg-white pb-6 pt-12 sm:pt-16" aria-label="Articles">
          <div className={container}>
            {posts.length === 0 ? (
              <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/40 px-6 py-14 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                  <FaBookOpen className="h-5 w-5" />
                </span>
                <h2 className="mt-5 text-2xl font-bold tracking-[-0.015em] text-slate-900">Our first articles are on the way</h2>
                <p className="mt-3 text-slate-600">Meanwhile, see every kind of QR code you can make with QR-Genie.</p>
                <Link href="/qr-code-types" className={`${secondaryButton} mt-7 gap-2`}>
                  <FaThLarge className="h-4 w-4" />
                  Explore QR code types
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 className="font-display text-2xl font-bold tracking-[-0.015em] text-slate-900 sm:text-3xl">
                    {active ? active.name : "Latest articles"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {matching.length} {matching.length === 1 ? "article" : "articles"}
                  </p>
                </div>

                {categories.length > 1 && (
                  <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter by topic">
                    <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
                      {[{ slug: null, name: "All articles", count: posts.length }, ...categories].map((category) => {
                        const selected = (active?.slug || null) === category.slug;
                        return (
                          <button
                            key={category.slug || "all"}
                            type="button"
                            onClick={() => choose(category.slug)}
                            aria-pressed={selected}
                            className={`btn-shine inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 ${
                              selected
                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20"
                                : "btn-shine-soft bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:text-indigo-700 hover:ring-indigo-200"
                            }`}
                          >
                            {category.name}
                            <span className={`font-sans text-xs ${selected ? "text-white/80" : "text-slate-400"}`}>{category.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visible.map((post) => (
                    <li key={post.slug}>
                      <PostCard post={post} />
                    </li>
                  ))}
                </ul>
                {matching.length > visible.length && (
                  <div className="mt-12 text-center">
                    <button type="button" onClick={() => setShown(shown + PAGE_SIZE)} className={`${secondaryButton} cursor-pointer`}>
                      Show more articles
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <SiteFooter showCta isAuthenticated={!!user} />
    </div>
  );
}
