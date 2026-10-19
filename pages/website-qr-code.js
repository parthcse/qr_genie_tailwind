import LandingPage from "@/components/landing/LandingPage";
import { LANDING_PAGES } from "@/components/landing/landingPages";

// Content: LANDING_PAGES.website in components/landing/landingPages.js
export default function WebsiteQrCodePage() {
  return <LandingPage page={LANDING_PAGES.website} />;
}
