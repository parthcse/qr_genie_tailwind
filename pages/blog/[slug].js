import { useRef } from "react";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SeoMeta from "@/components/layout/SeoMeta";
import { container } from "@/components/landing/LandingUi";
import { BreadcrumbBar } from "@/components/landing/PageBanner";
import { Byline, CategoryChip, PostCard, PostImage } from "@/components/blog/BlogUi";
import { ArticleCta, MobileTableOfContents, ReadingProgress, ShareLinks, TableOfContents } from "@/components/blog/ArticleParts";
import { BLOG_PATH, categoryPath, formatPostDate, postPath } from "@/lib/blog/format";
import { BLOG_REVALIDATE_SECONDS, getBlogPost, getRelatedPosts } from "@/lib/blog/wordpress";
import { SITE_URL } from "@/lib/site";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { organizationSchema, breadcrumbSchema, blogPostingSchema } from "@/lib/seo";

// Each article is built the first time it's opened, then kept and refreshed from WordPress every few minutes. A post
// that's unpublished or deleted in WordPress turns into "not found" at its next refresh.
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const post = await getBlogPost(params.slug);
  if (!post) return { notFound: true, revalidate: 60 };
  const related = await getRelatedPosts(post).catch(() => []);
  return { props: { post, related }, revalidate: BLOG_REVALIDATE_SECONDS };
}

// "Updated …" only when the post changed on a later day than it was published
function updatedDate(post) {
  if (!post.updatedAt || !post.publishedAt) return null;
  return post.updatedAt.slice(0, 10) > post.publishedAt.slice(0, 10) ? post.updatedAt.slice(0, 10) : null;
}

/**
 * /blog/<slug>: one article from WordPress. A banner as wide as the site's other pages, the breadcrumb row, then the
 * picture and the text on the left with the sidebar ("On this page", sign-up card) beside both on the right; more
 * articles to read at the end.
 */
export default function BlogPostPage({ post, related }) {
  const { loading, user } = useCurrentUser();
  const contentRef = useRef(null);
  const path = postPath(post.slug);
  const url = `${SITE_URL}${path}`;
  const category = post.categories[0];
  const updated = updatedDate(post);
  const showContents = post.headings.length >= 2;

  const crumbs = [{ name: "Blog", path: BLOG_PATH }, ...(category ? [{ name: category.name, path: categoryPath(category.slug) }] : []), { name: post.title, path }];
  const structuredData = [
    organizationSchema,
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog", path: BLOG_PATH },
      { name: post.title, path },
    ]),
    blogPostingSchema(post),
  ];
  const shareImage = post.seo.image && { url: post.seo.image.src, width: post.seo.image.width, height: post.seo.image.height, alt: post.seo.image.alt };

  return (
    <div className="min-h-screen bg-white">
      <SeoMeta title={post.seo.title} description={post.seo.description} path={path} image={shareImage} type="article" jsonLd={structuredData}>
        {post.publishedAt && <meta property="article:published_time" content={post.publishedAt} key="article:published_time" />}
        {post.updatedAt && <meta property="article:modified_time" content={post.updatedAt} key="article:modified_time" />}
        {category && <meta property="article:section" content={category.name} key="article:section" />}
      </SeoMeta>
      <ReadingProgress target={contentRef} />
      <SiteHeader isAuthenticated={!!user} loading={loading} />

      <main>
        <article>
          {/* The same light banner as the site's other inner pages (PageBanner), the text on the left from lg */}
          <header className="relative isolate overflow-hidden border-b border-indigo-100/80 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="pointer-events-none absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full bg-purple-200/40 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -left-32 bottom-0 -z-10 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" aria-hidden="true" />
            <div className={`${container} py-12 text-center sm:py-14 lg:py-16 lg:text-left xl:py-20`}>
              <div className="mx-auto max-w-4xl lg:mx-0">
                {post.categories.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                    {post.categories.map((item) => (
                      <CategoryChip key={item.slug} category={item} />
                    ))}
                  </div>
                )}
                <h1 className="mt-5 text-balance text-[2.1rem] font-bold leading-[1.12] tracking-[-0.025em] text-slate-900 sm:text-5xl sm:leading-[1.1] lg:text-[3.1rem] xl:text-[3.35rem]">
                  {post.title}
                </h1>
                {post.lead && <p className="mx-auto mt-5 max-w-3xl text-pretty text-lg leading-relaxed text-slate-600 lg:mx-0">{post.lead}</p>}
                <div className="mt-8 flex flex-col items-center gap-x-5 gap-y-2 sm:flex-row sm:justify-center lg:justify-start">
                  <Byline post={post} />
                  {updated && <p className="text-xs font-medium text-slate-500 sm:border-l sm:border-slate-200 sm:pl-5">Updated {formatPostDate(updated)}</p>}
                </div>
              </div>
            </div>
          </header>
          <BreadcrumbBar crumbs={crumbs} />

          {/* Without "Keep reading" the footer's sign-up panel comes next, which has its own space above it */}
          <div className={`${container} pt-10 sm:pt-12 ${related.length ? "pb-16 sm:pb-24" : "pb-4 sm:pb-6"}`}>
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-16">
              <div className="min-w-0">
                {post.image && (
                  <PostImage
                    image={post.image}
                    sizes="(min-width: 1280px) 880px, (min-width: 1024px) 66vw, 100vw"
                    loading="eager"
                    fetchPriority="high"
                    className="h-auto w-full rounded-2xl shadow-xl shadow-indigo-900/10 ring-1 ring-slate-900/5 sm:rounded-3xl"
                  />
                )}
                {showContents && <MobileTableOfContents headings={post.headings} className={`lg:hidden ${post.image ? "mt-8" : ""}`} />}
                <div ref={contentRef} className={`blog-content ${post.image || showContents ? "mt-10 sm:mt-12" : ""}`} dangerouslySetInnerHTML={{ __html: post.html }} />

                {post.tags.length > 0 && (
                  <ul className="mt-12 flex flex-wrap gap-2" aria-label="Tags">
                    {post.tags.map((tag) => (
                      <li key={tag.slug} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        #{tag.name}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-12 flex flex-col gap-6 rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200/70 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Written by</p>
                    <Byline post={post} className="mt-3" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-right">Share this article</p>
                    <ShareLinks url={url} title={post.title} className="mt-3 sm:justify-end" />
                  </div>
                </div>

                <div className="mt-8 lg:hidden">
                  <ArticleCta signedIn={!!user} />
                </div>
              </div>

              {/* Beside the picture and the text, staying in view while the article scrolls */}
              <aside className="hidden lg:block" aria-label="About this article">
                <div className="sticky top-28 space-y-5">
                  {showContents && <TableOfContents headings={post.headings} />}
                  <ArticleCta signedIn={!!user} />
                </div>
              </aside>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="border-t border-slate-100 bg-slate-50/70 py-16 sm:py-20" aria-labelledby="related-heading">
            <div className={container}>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="related-heading" className="font-display text-2xl font-bold tracking-[-0.015em] text-slate-900 sm:text-3xl">
                  Keep reading
                </h2>
                <Link href={BLOG_PATH} className="group inline-flex items-center gap-2 text-sm font-semibold !text-indigo-700 transition-colors hover:!text-purple-700">
                  All articles
                  <FaArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
                </Link>
              </div>
              <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {related.map((item) => (
                  <li key={item.slug}>
                    <PostCard post={item} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      <SiteFooter showCta isAuthenticated={!!user} />
    </div>
  );
}
