import { FaPlus } from "react-icons/fa";

/**
 * Building blocks shared by the home page, the QR type and industry pages and the pricing page, so every
 * marketing page has the same widths, buttons, headings, cards, steps and FAQ.
 */

export const container = "mx-auto max-w-site px-4 sm:px-6 lg:px-8";
export const sectionSpacing = "py-16 sm:py-24 lg:py-28";

export const primaryButton =
  "btn-shine group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-7 py-3.5 text-base font-semibold !text-white shadow-lg shadow-indigo-600/25 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-600/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 motion-reduce:transform-none sm:w-auto";
export const secondaryButton =
  "btn-shine btn-shine-soft inline-flex w-full items-center justify-center rounded-xl bg-white px-7 py-3.5 text-base font-semibold !text-slate-800 shadow-sm ring-1 ring-inset ring-slate-200 transition duration-200 hover:bg-slate-50 hover:!text-indigo-700 hover:ring-indigo-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 sm:w-auto";

// Light hero background: soft indigo wash, a faint grid fading out, and two blurred colour blobs
export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/90 via-white to-white" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(99_102_241/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(99_102_241/0.07)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,#000_45%,transparent_100%)]" />
      <div className="absolute -top-40 right-[-8%] h-[30rem] w-[30rem] rounded-full bg-purple-300/30 blur-3xl" />
      <div className="absolute -left-40 top-32 h-[26rem] w-[26rem] rounded-full bg-indigo-300/25 blur-3xl" />
    </div>
  );
}

/**
 * The page's h1: the search phrase large and dark, the promise underneath in the brand gradient. Search engines and
 * screen readers read it as one heading, "Title: subtitle".
 */
export function HeroTitle({ title, subtitle, className = "mt-7" }) {
  return (
    <h1 className={`${className} font-bold tracking-[-0.02em] text-slate-900`}>
      <span className="block text-balance text-[2.5rem] leading-[1.06] sm:text-6xl lg:text-[3.6rem] xl:text-[4.1rem]">
        {title}
        <span className="sr-only">:</span>
      </span>{" "}
      <span className="mt-4 block text-balance bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text pb-1.5 text-[1.65rem] leading-[1.15] text-transparent sm:text-4xl xl:text-[2.6rem]">
        {subtitle}
      </span>
    </h1>
  );
}

// Eyebrow, heading and intro shared by the sections below the hero
export function SectionHeading({ eyebrow, title, description, children }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1.5 text-sm font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100">
        <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" aria-hidden="true" />
        {eyebrow}
      </span>
      <h2 className="mt-5 text-balance text-3xl font-bold tracking-[-0.015em] text-slate-900 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && <p className="mx-auto mt-4 text-balance text-lg leading-relaxed text-slate-600">{description}</p>}
      {children}
    </div>
  );
}

/** Feature cards: icon tile, title (h3) and text. items: [{ icon: <Icon />, title, description }] */
export function FeatureGrid({ items }) {
  return (
    <div className="mt-14 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-16 lg:grid-cols-3 lg:gap-6">
      {items.map((feature) => (
        <div
          key={feature.title}
          className="group relative flex cursor-pointer gap-5 overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-slate-200/80 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-900/5 hover:ring-indigo-200 motion-reduce:transform-none sm:block sm:p-8"
        >
          {/* Hover: a light gradient that keeps drifting, plus a sheen that sweeps across once */}
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgb(238_242_255)_0%,rgb(250_245_255)_30%,rgb(255_255_255)_50%,rgb(245_243_255)_70%,rgb(238_242_255)_100%)] bg-[length:250%_250%] opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-safe:group-hover:animate-gradient-pan"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full motion-reduce:hidden"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden="true"
          />
          <div className="relative flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 ring-1 ring-inset ring-indigo-100 transition-colors duration-300 group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white group-hover:ring-transparent">
            {feature.icon}
          </div>
          <div className="relative min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 sm:mt-6">{feature.title}</h3>
            <p className="mt-2 leading-relaxed text-slate-600">{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Where the line joining the steps starts and ends on large screens (the middle of the first and last column)
const STEP_LAYOUT = {
  3: { grid: "lg:grid-cols-3", line: "left-[16.667%] right-[16.667%]" },
  4: { grid: "lg:grid-cols-4", line: "left-[12.5%] right-[12.5%]" },
};

/** Numbered steps joined by a line (across on large screens, down the side below that). steps: [{ icon: <Icon />, title, description }], 3 or 4 */
export function StepsList({ steps }) {
  const layout = STEP_LAYOUT[steps.length] || STEP_LAYOUT[4];
  return (
    <div className="relative mx-auto mt-14 max-w-2xl lg:mt-20 lg:max-w-none">
      <div
        className={`absolute ${layout.line} top-8 hidden h-px bg-gradient-to-r from-indigo-200 via-purple-300 to-indigo-200 lg:block`}
        aria-hidden="true"
      />
      <div className="absolute bottom-8 left-8 top-8 w-px bg-gradient-to-b from-indigo-200 via-purple-300 to-indigo-200 lg:hidden" aria-hidden="true" />

      <ol className={`relative grid gap-10 ${layout.grid} lg:gap-8`}>
        {steps.map((step, i) => (
          <li key={step.title} className="group flex cursor-pointer gap-6 lg:flex-col lg:items-center lg:text-center">
            {/* Hover: the tile lifts and fills, the icon tilts, the number spins with a pulse */}
            <div className="relative flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-lg shadow-indigo-900/5 ring-1 ring-slate-200 transition duration-300 group-hover:-translate-y-1.5 group-hover:bg-gradient-to-br group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-indigo-500/25 group-hover:ring-transparent motion-reduce:transform-none">
              <span className="transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110 motion-reduce:transform-none">
                {step.icon}
              </span>
              <span className="absolute -right-2.5 -top-2.5 flex h-7 w-7 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-purple-400 opacity-0 group-hover:opacity-60 motion-safe:group-hover:animate-ping" aria-hidden="true" />
                <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 font-sans text-xs font-bold text-white ring-4 ring-slate-50 transition-transform duration-700 ease-out group-hover:rotate-[360deg] group-hover:scale-125 motion-reduce:transform-none">
                  {i + 1}
                </span>
              </span>
            </div>
            <div className="pt-1 lg:pt-0">
              <h3 className="text-lg font-semibold text-slate-900 transition-colors duration-300 group-hover:text-indigo-700 lg:mt-7">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600 lg:mx-auto lg:max-w-[17rem]">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Questions that open in place (no script needed, so search engines read every answer). The same list feeds the
 * FAQ structured data (faqPageSchema in lib/seo.js), so keep answers as plain text. faqs: [{ question, answer }]
 */
export function FaqList({ faqs }) {
  return (
    <div className="mx-auto mt-12 max-w-3xl space-y-3 sm:mt-14 sm:space-y-4">
      {faqs.map((faq) => (
        <details
          key={faq.question}
          className="group rounded-2xl bg-white ring-1 ring-slate-200/80 transition duration-300 hover:shadow-lg hover:shadow-indigo-900/5 hover:ring-indigo-200 open:shadow-lg open:shadow-indigo-900/5 open:ring-indigo-200"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-5 rounded-2xl px-5 py-4 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 sm:px-7 sm:py-5 [&::-webkit-details-marker]:hidden">
            <h3 className="text-base font-semibold text-slate-900 transition-colors duration-300 group-hover:text-indigo-700 sm:text-lg">
              {faq.question}
            </h3>
            {/* The plus turns into a cross and fills with the brand gradient when open */}
            <span
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100 transition duration-300 group-hover:ring-indigo-200 group-open:rotate-45 group-open:bg-gradient-to-br group-open:from-indigo-600 group-open:to-purple-600 group-open:text-white group-open:ring-transparent motion-reduce:transform-none"
              aria-hidden="true"
            >
              <FaPlus className="h-3 w-3" />
            </span>
          </summary>
          <p className="px-5 pb-5 text-[15px] leading-relaxed text-slate-600 motion-safe:animate-fade-in sm:px-7 sm:pb-6 sm:text-base">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
