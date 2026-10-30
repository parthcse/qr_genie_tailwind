import LandingPage from "@/components/landing/LandingPage";
import { LANDING_PAGES } from "@/components/landing/landingPages";

// Content: LANDING_PAGES.links in components/landing/landingPages.js
export default function MultipleLinksQrCodePage() {
  return <LandingPage page={LANDING_PAGES.links} />;
}
