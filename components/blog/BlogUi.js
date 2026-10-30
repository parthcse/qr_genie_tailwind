import Link from "next/link";
import { FaArrowRight, FaQrcode } from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import { categoryPath, formatPostDate, postPath } from "@/lib/blog/format";
import { SITE_URL } from "@/lib/site";

/**
 * Pieces shared by the blog list (pages/blog/index.js) and the article page (pages/blog/[slug].js). post: a card from
 * lib/blog/wordpress.js ({ slug, title, excerpt, date, publishedAt, categories, author, image, readingMinutes }).
 */

/** The post's featured image at the right size for the screen (WordPress's own sizes), or a soft brand placeholder */
export function PostImage({ image, sizes, className = "", loading = "lazy", fetchPriority }) {
  if (!image) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-indigo-100 via-violet-50 to-purple-100 ${className}`} aria-hidden="true">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-indigo-500 shadow-sm ring-1 ring-indigo-100">
          <FaQrcode className="h-6 w-6" />
        </span>
      </div>
    );
  }
  return (
    <img
      src={image.src}
      srcSet={image.srcSet || undefined}
      sizes={image.srcSet ? sizes : undefined}
      alt={image.alt}
      width={image.width || undefined}
      height={image.height || undefined}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      className={className}
    />
  );
}

/** Round avatar: the QR-Genie mark for the team, the author's initials otherwise */
export function AuthorAvatar({ author, className = "h-10 w-10" }) {
  const initials = author.name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 font-sans text-sm font-semibold text-white shadow-md shadow-indigo-600/20 ring-2 ring-white ${className}`}
      aria-hidden="true"
    >
      {author.team ? <FaQrcode className="h-[45%] w-[45%]" /> : initials}
    </span>
  );
}

/** "30 Oct 2026 · 4 min read" */
export function PostMeta({ post, className = "" }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium text-slate-500 ${className}`}>
      <time dateTime={post.publishedAt || post.date}>{formatPostDate(post.date, { short: true })}</time>
      <span aria-hidden="true" className="text-slate-300">
        •
      </span>
      <span>{post.readingMinutes} min read</span>
    </p>
  );
}

/** Author, date and reading time */
export function Byline({ post, className = "" }) {
  return (
    <div className={`flex items-center gap-3 text-left ${className}`}>
      <AuthorAvatar author={post.author} />
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-semibold text-slate-900">{post.author.name}</p>
        <PostMeta post={post} className="mt-1" />
      </div>
    </div>
  );
}

/** A topic pill linking to the blog list filtered to it; above the card's link so it stays clickable on its own */
export function CategoryChip({ category, onImage = false }) {
  return (
    <Link
      href={categoryPath(category.slug)}
      className={`relative z-10 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors duration-200 ${
        onImage
          ? "bg-white/90 !text-indigo-700 shadow-sm ring-white/60 backdrop-blur hover:bg-white hover:!text-purple-700"
          : "bg-indigo-50 !text-indigo-700 ring-indigo-100 hover:bg-indigo-100 hover:!text-indigo-800"
      }`}
    >
      {category.name}
    </Link>
  );
}

// The title link stretches over the whole card (::after), so one link makes the card clickable
const stretchedLink =
  "!text-inherit after:absolute after:inset-0 after:z-0 after:content-[''] focus:outline-none focus-visible:after:rounded-[inherit] focus-visible:after:ring-4 focus-visible:after:ring-indigo-300";

/**
 * Article card for the grids (4 across on wide screens): picture with its topic, date and reading time, title, a few
 * lines of the excerpt. The whole card opens the article; the topic opens the list filtered to it.
 */
export function PostCard({ post, headingLevel: Heading = "h3" }) {
  const category = post.categories[0];
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-900/[0.07] hover:ring-indigo-200 motion-reduce:transform-none">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <PostImage
          image={post.image}
          sizes="(min-width: 1280px) 310px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.05] motion-reduce:transform-none"
        />
        {category && (
          <span className="absolute left-3.5 top-3.5">
            <CategoryChip category={category} onImage />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <PostMeta post={post} />
        <Heading className="mt-2.5 text-balance font-display text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em] text-slate-900 transition-colors duration-300 group-hover:text-indigo-700">
          <Link href={postPath(post.slug)} className={`${stretchedLink} after:rounded-3xl`}>
            {post.title}
          </Link>
        </Heading>
        {post.excerpt && <p className="mt-2 line-clamp-3 flex-1 text-[14.5px] leading-relaxed text-slate-600">{post.excerpt}</p>}
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700" aria-hidden="true">
          Read article
          <FaArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none" />
        </span>
      </div>
    </article>
  );
}

/** The blog banner's picture (decorative): a little stack of article cards, the front one with a real code to the blog */
export function BlogVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="absolute h-72 w-72 rounded-full bg-indigo-300/25 blur-3xl" />
      <div className="group relative h-[19rem] w-[23rem]">
        <div className="absolute right-0 top-3 h-60 w-56 rotate-[7deg] rounded-3xl bg-white/60 shadow-xl shadow-indigo-900/5 ring-1 ring-slate-900/5 transition duration-700 ease-out group-hover:rotate-[10deg] motion-reduce:transition-none" />
        <div className="absolute left-0 top-6 h-60 w-56 -rotate-[6deg] rounded-3xl bg-white/75 p-5 shadow-xl shadow-indigo-900/5 ring-1 ring-slate-900/5 transition duration-700 ease-out group-hover:-rotate-[9deg] motion-reduce:transition-none">
          <div className="h-20 rounded-2xl bg-gradient-to-br from-cyan-100 to-indigo-100" />
          <div className="mt-4 h-2.5 w-3/4 rounded-full bg-slate-200" />
          <div className="mt-2 h-2.5 w-1/2 rounded-full bg-slate-200" />
        </div>

        <div className="absolute left-1/2 top-1/2 w-60 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-4 shadow-2xl shadow-indigo-900/15 ring-1 ring-slate-900/5 transition duration-500 ease-out group-hover:-translate-y-[54%] motion-reduce:transition-none">
          <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500">
            <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/20 blur-xl" />
            <div className="relative rounded-xl bg-white p-2 shadow-lg">
              <QRCodeSVG value={`${SITE_URL}/blog`} size={72} level="M" fgColor="#312e81" bgColor="#ffffff" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-5 rounded-full bg-indigo-50 px-2.5 text-[10px] font-semibold leading-5 text-indigo-700">Guides</span>
            <span className="text-[10px] font-medium text-slate-400">5 min read</span>
          </div>
          <div className="mt-3 h-3 w-full rounded-full bg-slate-200" />
          <div className="mt-2 h-3 w-2/3 rounded-full bg-slate-200" />
          <div className="mt-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
              <FaQrcode className="h-3 w-3" />
            </span>
            <span className="h-2 w-20 rounded-full bg-slate-100" />
          </div>
        </div>

        <div className="absolute -right-2 bottom-6 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-xl shadow-indigo-900/10 ring-1 ring-slate-900/5 motion-safe:animate-float">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-slate-800">New article</span>
        </div>
      </div>
    </div>
  );
}
