import LandingPage from "@/components/landing/LandingPage";
import { LANDING_PAGES } from "@/components/landing/landingPages";

// Content: LANDING_PAGES.realEstate in components/landing/landingPages.js
export default function RealEstateQrCodesPage() {
  return <LandingPage page={LANDING_PAGES.realEstate} />;
}
