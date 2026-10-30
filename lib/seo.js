// Structured data (schema.org JSON-LD) for search engines. Plain data, safe to import from pages and components.
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/site";
import { formatPrice, formatMonthly, formatBilled, monthlyAmount, cheapestPlan } from "@/lib/billing/price";
import { PLAN_TERMS, termById } from "@/lib/billing/terms";
import { TRIAL_DAYS } from "@/lib/billing/subscription";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export const organizationSchema = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "QR-Genie",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/logo-512.png`,
  email: SUPPORT_EMAIL,
};

/** FAQ structured data; the questions and answers must be the ones shown on the page */
export function faqPageSchema(faqs) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

/** Breadcrumb trail: [{ name, path }], starting at the home page */
export function breadcrumbSchema(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export const BLOG_ID = `${SITE_URL}/blog#blog`;

/** A blog article (pages/blog/[slug].js); post from getBlogPost in lib/blog/wordpress.js */
export function blogPostingSchema(post) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.seo.description,
    url,
    mainEntityOfPage: url,
    image: post.seo.image ? [post.seo.image.src] : [`${SITE_URL}/og-image.png`],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: post.author.team ? { "@id": ORGANIZATION_ID } : { "@type": "Person", name: post.author.name },
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": BLOG_ID },
    articleSection: post.categories[0]?.name,
    keywords: post.tags.length ? post.tags.map((tag) => tag.name).join(", ") : undefined,
    inLanguage: "en",
  };
}

/** The blog itself (components/blog/BlogListPage.js) with the articles on the page; posts from getBlogListPage */
export function blogSchema(posts) {
  return {
    "@type": "Blog",
    "@id": BLOG_ID,
    name: "QR-Genie Blog",
    url: `${SITE_URL}/blog`,
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "en",
    blogPost: posts.slice(0, 20).map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.publishedAt,
      image: post.image?.src,
    })),
  };
}

/**
 * The product with its prices. plans: { INR?: { "3m", "6m", "12m" }, USD?: … } from publicPlans(); every currency is
 * listed whoever is looking, so search engines see both (visitors still pay only in their own currency). Each offer
 * is the amount charged for its term.
 */
export function softwareApplicationSchema({ description, plans = {} }) {
  const paid = Object.values(plans).flatMap((byTerm) => PLAN_TERMS.map((term) => byTerm[term.id]).filter(Boolean));
  const trialCurrency = plans.USD ? "USD" : paid[0]?.currency || "USD";
  return {
    "@type": "SoftwareApplication",
    name: "QR-Genie",
    url: `${SITE_URL}/`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web browser",
    description,
    publisher: { "@id": ORGANIZATION_ID },
    offers: [
      { "@type": "Offer", name: `Free trial (${TRIAL_DAYS} days)`, price: "0", priceCurrency: trialCurrency },
      ...paid.map((plan) => ({
        "@type": "Offer",
        name: termById(plan.term).planName,
        description: `Billed ${formatBilled(plan)} (${formatMonthly(plan)})`,
        price: (plan.amount / 100).toFixed(2),
        priceCurrency: plan.currency,
      })),
    ],
  };
}

/**
 * The lowest monthly price for search result text, the same for every visitor: "$19.99/month (₹2,000 in India)".
 * Empty when Razorpay prices couldn't be loaded.
 */
export function pricesForSearch(plans = {}) {
  const usd = cheapestPlan(plans.USD);
  const inr = cheapestPlan(plans.INR);
  if (usd && inr) return `${formatMonthly(usd)} (${formatPrice(monthlyAmount(inr), inr.currency)} in India)`;
  return formatMonthly(usd || inr);
}
