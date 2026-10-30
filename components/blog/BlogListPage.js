import Link from "next/link";
import { FaArrowLeft, FaArrowRight, FaBookOpen, FaThLarge } from "react-icons/fa";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SeoMeta from "@/components/layout/SeoMeta";
import PageBanner from "@/components/landing/PageBanner";
import { container, secondaryButton } from "@/components/landing/LandingUi";
import { BlogVisual, PostCard } from "./BlogUi";
import { BLOG_PATH, blogListPath, categoryPath } from "@/lib/blog/format";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { organizationSchema, breadcrumbSchema, blogSchema } from "@/lib/seo";

// The grid's id: topic and page links land on it instead of the top of the banner
const LIST_ID = "articles";

// Page numbers to show: the first, the last and the ones next to the current page, "…" for the gaps
// (page 6 of 12: 1 … 5 6 7 … 12). A gap of one page shows that page instead.
function pageNumbers(page, pageCount) {
  const wanted = [...new Set([1, page - 1, page, page + 1, pageCount])].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  const items = [];
  wanted.forEach((n, i) => {
    const previous = wanted[i - 1];
    if (previous && n - previous === 2) items.push(previous + 1);
    else if (previous && n - previous > 2) items.push(`gap-${n}`);
    items.push(n);
  });
  return items;
}

const pageButton =
  "btn-shine btn-shine-soft inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold !text-slate-700 ring-1 ring-inset ring-slate-200 transition duration-200 hover:!text-indigo-700 hover:ring-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400";

/** Previous, the page numbers and Next; real links, so search engines follow every page */
function Pagination({ page, pageCount, category }) {
  if (pageCount < 2) return null;
  const href = (n) => `${blogListPath({ page: n, category })}#${LIST_ID}`;
  return (
    <nav aria-label="Article pages" className="mt-14 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={pageButton} aria-label="Previous page">
          <FaArrowLeft className="h-3 w-3" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </Link>
      ) : (
        <span className={`${pageButton} pointer-events-none opacity-40`} aria-hidden="true">
          <FaArrowLeft className="h-3 w-3" />
          <span className="hidden sm:inline">Previous</span>
        </span>
      )}
      <ol className="flex items-center gap-1.5">
        {pageNumbers(page, pageCount).map((item) =>
          typeof item === "string" ? (
            <li key={item} className="px-1 text-sm text-slate-400" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              {item === page ? (
                <span
                  aria-current="page"
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 font-sans text-sm font-semibold text-white shadow-md shadow-indigo-600/20"
                >
                  {item}
                </span>
              ) : (
                <Link href={href(item)} className={`${pageButton} font-sans`} aria-label={`Page ${item}`}>
                  {item}
                </Link>
              )}
            </li>
          )
        )}
      </ol>
      {page < pageCount ? (
        <Link href={href(page + 1)} rel="next" className={pageButton} aria-label="Next page">
          <span className="hidden sm:inline">Next</span>
          <FaArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      ) : (
        <span className={`${pageButton} pointer-events-none opacity-40`} aria-hidden="true">
          <span className="hidden sm:inline">Next</span>
          <FaArrowRight className="h-3 w-3" />
        </span>
      )}
    </nav>
  );
}

/** The topic links above the grid: all articles, then each topic, with their counts; the current one filled */
function TopicLinks({ categories, allTotal, current }) {
  const items = [{ slug: null, name: "All articles", count: allTotal }, ...categories];
  return (
    <nav aria-label="Topics" className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {items.map((item) => {
          const selected = (current?.slug || null) === item.slug;
          return (
            <li key={item.slug || "all"}>
              <Link
                href={`${item.slug ? categoryPath(item.slug) : BLOG_PATH}#${LIST_ID}`}
                aria-current={selected ? "page" : undefined}
                className={`btn-shine inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 ${
                  selected
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 !text-white shadow-md shadow-indigo-600/20"
                    : "btn-shine-soft bg-white !text-slate-700 ring-1 ring-inset ring-slate-200 hover:!text-indigo-700 hover:ring-indigo-200"
                }`}
              >
                {item.name}
                <span className={`font-sans text-xs ${selected ? "text-white/80" : "text-slate-400"}`}>{item.count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * The article list: /blog, /blog/page/<n>, /blog/category/<slug> and /blog/category/<slug>/page/<n> (pages/blog/…).
 * list: from getBlogListPage in lib/blog/wordpress.js. The banner, the heading with the count, topic links when there
 * are two topics or more, 12 cards (4 across from 1280 px, 3 on laptops, 2 on tablets, 1 on phones) and the page
 * numbers. Each address has its own title and canonical address.
 */
export default function BlogListPage({ list }) {
  const { loading, user } = useCurrentUser();
  const { posts, page, pageCount, total, categories, category } = list;
  const path = blogListPath({ page, category: category?.slug });

  const pageSuffix = page > 1 ? ` – Page ${page}` : "";
  const title = category ? `${category.name} – QR Code Blog${pageSuffix} | QR-Genie` : `QR Code Blog: Guides, Tips and Ideas${pageSuffix} | QR-Genie`;
  const description = category
    ? category.description || `Articles about ${category.name.toLowerCase()} from the QR-Genie blog: practical guides and ideas for QR codes that work.`
    : "Guides, tips and ideas for QR codes that work: restaurant menus, Wi-Fi, events, marketing and scan tracking. Practical advice from the QR-Genie team.";
  const crumbs = [
    { name: "Blog", path: BLOG_PATH },
    ...(category ? [{ name: category.name, path: categoryPath(category.slug) }] : []),
    ...(page > 1 ? [{ name: `Page ${page}`, path }] : []),
  ];
  const structuredData = [organizationSchema, breadcrumbSchema([{ name: "Home", path: "/" }, ...crumbs]), blogSchema(posts)];

  return (
    <div className="min-h-screen bg-white">
      <SeoMeta title={title} description={description} path={path} jsonLd={structuredData} />
      <SiteHeader isAuthenticated={!!user} loading={loading} />

      <main>
        <PageBanner
          eyebrow={{ icon: FaBookOpen, label: "Blog" }}
          title="The QR-Genie"
          highlight="Blog"
          subtitle="Ideas and how-tos for QR codes people scan"
          summary="Practical guides on creating, printing and tracking QR codes for menus, events, shops and campaigns, from the team behind QR-Genie."
          crumbs={crumbs}
          visual={<BlogVisual />}
          visualClassName="hidden lg:block"
        />

        <section id={LIST_ID} className="scroll-mt-20 bg-white pb-6 pt-12 sm:scroll-mt-24 sm:pt-16" aria-label="Articles">
          <div className={container}>
            {total === 0 && !category ? (
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
                  <h2 className="font-display text-2xl font-bold tracking-[-0.015em] text-slate-900 sm:text-3xl">{category ? category.name : "Latest articles"}</h2>
                  <p className="text-sm text-slate-500">
                    {total} {total === 1 ? "article" : "articles"}
                    {pageCount > 1 && ` · page ${page} of ${pageCount}`}
                  </p>
                </div>
                {category?.description && <p className="mt-3 max-w-3xl text-pretty leading-relaxed text-slate-600">{category.description}</p>}

                {categories.length > 1 && <TopicLinks categories={categories} allTotal={list.allTotal} current={category} />}

                <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {posts.map((post) => (
                    <li key={post.slug}>
                      <PostCard post={post} />
                    </li>
                  ))}
                </ul>

                <Pagination page={page} pageCount={pageCount} category={category?.slug} />
              </>
            )}
          </div>
        </section>
      </main>

      <SiteFooter showCta isAuthenticated={!!user} />
    </div>
  );
}
