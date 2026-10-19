// Structured data (schema.org JSON-LD) for search engines. Plain data, safe to import from pages and components.
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/site";
import { formatPrice, formatPlanPriceShort } from "@/lib/billing/price";

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
 * The product with its prices. plans: { INR?, USD? } from publicPlans(); every currency is listed whoever is
 * looking, so search engines see both prices (visitors still pay only in their own currency).
 */
export function softwareApplicationSchema({ description, plans = {} }) {
  const paid = Object.values(plans);
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
      { "@type": "Offer", name: "Free Trial", price: "0", priceCurrency: trialCurrency },
      ...paid.map((plan) => ({
        "@type": "Offer",
        name: "Basic Package",
        price: (plan.amount / 100).toFixed(2),
        priceCurrency: plan.currency,
      })),
    ],
  };
}

/**
 * Prices for search result text, the same for every visitor: "$5/month (₹499 in India)".
 * Empty when Razorpay prices couldn't be loaded.
 */
export function pricesForSearch(plans = {}) {
  const usd = formatPlanPriceShort(plans.USD);
  const inr = formatPlanPriceShort(plans.INR);
  if (usd && inr) {
    const samePeriod = plans.USD.period === plans.INR.period && plans.USD.interval === plans.INR.interval;
    return `${usd} (${samePeriod ? formatPrice(plans.INR.amount, plans.INR.currency) : inr} in India)`;
  }
  return usd || inr;
}
