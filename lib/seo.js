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
