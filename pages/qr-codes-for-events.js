import LandingPage from "@/components/landing/LandingPage";
import { LANDING_PAGES } from "@/components/landing/landingPages";

// Content: LANDING_PAGES.events in components/landing/landingPages.js
export default function EventQrCodesPage() {
  return <LandingPage page={LANDING_PAGES.events} />;
}
