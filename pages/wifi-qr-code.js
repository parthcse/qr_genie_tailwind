import LandingPage from "@/components/landing/LandingPage";
import { LANDING_PAGES } from "@/components/landing/landingPages";

// Content: LANDING_PAGES.wifi in components/landing/landingPages.js
export default function WifiQrCodePage() {
  return <LandingPage page={LANDING_PAGES.wifi} />;
}
