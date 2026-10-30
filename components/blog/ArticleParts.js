import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaArrowRight, FaCheck, FaChevronDown, FaFacebookF, FaLink, FaLinkedinIn, FaQrcode, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { TRIAL_DAYS } from "@/lib/billing/subscription";

/** Article page parts (pages/blog/[slug].js): reading progress, "On this page", sharing and the sign-up card */

/** A thin gradient line across the top of the screen that fills as the article is read. target: ref to the article. */
export function ReadingProgress({ target }) {
  const barRef = useRef(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!target.current || !barRef.current) return;
      const box = target.current.getBoundingClientRect();
      const distance = box.height - window.innerHeight;
      const progress = distance > 0 ? Math.min(1, Math.max(0, -box.top / distance)) : box.top < window.innerHeight ? 1 : 0;
      barRef.current.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [target]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px]" aria-hidden="true">
      <div ref={barRef} className="h-full origin-left scale-x-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
    </div>
  );
}

// The heading being read: the last one that has scrolled above a line just under the sticky header
function useActiveHeading(headings) {
  const [active, setActive] = useState(headings[0]?.id || null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = headings[0]?.id || null;
      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (element && element.getBoundingClientRect().top < 140) current = heading.id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
    };
  }, [headings]);
  return active;
}

function HeadingLinks({ headings, active }) {
  return (
    <ol className="space-y-0.5 border-l border-slate-200">
      {headings.map((heading) => {
        const current = heading.id === active;
        return (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={current ? "location" : undefined}
              className={`-ml-px block border-l-2 py-1.5 pr-2 text-sm leading-snug transition-colors duration-200 ${heading.level === 3 ? "pl-7" : "pl-4"} ${
                current ? "border-indigo-600 font-semibold !text-indigo-700" : "border-transparent !text-slate-600 hover:border-slate-300 hover:!text-slate-900"
              }`}
            >
              {heading.text}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * "On this page" beside the article on large screens, the current heading marked. A long list scrolls in its box and
 * follows the reader, keeping the current heading in view. headings: [{ id, text, level }]
 */
export function TableOfContents({ headings }) {
  const active = useActiveHeading(headings);
  const listRef = useRef(null);
  useEffect(() => {
    const box = listRef.current;
    const link = box?.querySelector('[aria-current="location"]');
    if (!link) return;
    if (link.offsetTop < box.scrollTop || link.offsetTop + link.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTop = link.offsetTop - box.clientHeight / 3;
    }
  }, [active]);
  return (
    <nav aria-labelledby="toc-heading" className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
      <p id="toc-heading" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        On this page
      </p>
      <div ref={listRef} className="relative mt-4 max-h-[50vh] overflow-y-auto overscroll-contain">
        <HeadingLinks headings={headings} active={active} />
      </div>
    </nav>
  );
}

/** The same list on phones and tablets, folded into a box above the article */
export function MobileTableOfContents({ headings, className = "" }) {
  const [open, setOpen] = useState(false);
  const active = useActiveHeading(headings);
  return (
    <nav aria-label="On this page" className={`overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="mobile-toc"
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-indigo-200"
      >
        On this page
        <FaChevronDown className={`h-3 w-3 text-indigo-600 transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <div id="mobile-toc" inert={!open} className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-4">
            {/* Stays open after a pick: folding it would move the article up while the page glides to the heading */}
            <HeadingLinks headings={headings} active={active} />
          </div>
        </div>
      </div>
    </nav>
  );
}

const shareButton =
  "btn-shine btn-shine-soft flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white !text-slate-600 ring-1 ring-slate-200 transition duration-200 hover:-translate-y-0.5 hover:!text-indigo-700 hover:shadow-md hover:shadow-indigo-900/5 hover:ring-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 motion-reduce:transform-none";

/** Share on X, LinkedIn, Facebook and WhatsApp (plain links, nothing loads from those sites), or copy the link */
export function ShareLinks({ url, title, className = "" }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  const link = encodeURIComponent(url);
  const networks = [
    { label: "Share on X", icon: FaXTwitter, href: `https://twitter.com/intent/tweet?url=${link}&text=${encodeURIComponent(title)}` },
    { label: "Share on LinkedIn", icon: FaLinkedinIn, href: `https://www.linkedin.com/sharing/share-offsite/?url=${link}` },
    { label: "Share on Facebook", icon: FaFacebookF, href: `https://www.facebook.com/sharer/sharer.php?u=${link}` },
    { label: "Share on WhatsApp", icon: FaWhatsapp, href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {networks.map(({ label, icon: Icon, href }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={shareButton}>
          <Icon className="h-4 w-4" />
        </a>
      ))}
      <button type="button" onClick={copy} aria-label="Copy link" title="Copy link" className={shareButton}>
        {copied ? <FaCheck className="h-4 w-4 text-emerald-600" /> : <FaLink className="h-4 w-4" />}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}

/** A small, light sign-up card beside the article */
export function ArticleCta({ signedIn }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 ring-1 ring-indigo-100 transition duration-300 hover:shadow-xl hover:shadow-indigo-900/5 hover:ring-indigo-200">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-200/50 blur-2xl transition-transform duration-700 group-hover:scale-125 motion-reduce:transform-none" aria-hidden="true" />
      <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25">
        <FaQrcode className="h-5 w-5" />
      </span>
      <p className="relative mt-4 font-display text-lg font-semibold leading-snug text-slate-900">Make a QR code you can change after printing</p>
      <p className="relative mt-2 text-sm leading-relaxed text-slate-600">
        Your logo and colours, scan analytics included. {signedIn ? "Ready in about a minute." : `Free for ${TRIAL_DAYS} days, no card needed.`}
      </p>
      <Link
        href={signedIn ? "/dashboard/create-qr" : "/auth/register"}
        className="btn-shine group/button relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold !text-white shadow-md shadow-indigo-600/20 transition hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
      >
        {signedIn ? "Create a QR code" : "Start free trial"}
        <FaArrowRight className="h-3 w-3 transition-transform group-hover/button:translate-x-0.5 motion-reduce:transform-none" />
      </Link>
    </div>
  );
}
