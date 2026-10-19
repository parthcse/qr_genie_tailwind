import LandingPage from "@/components/landing/LandingPage";
import { LANDING_PAGES } from "@/components/landing/landingPages";

// Content: LANDING_PAGES.instagram in components/landing/landingPages.js
export default function InstagramQrCodePage() {
  return <LandingPage page={LANDING_PAGES.instagram} />;
}
