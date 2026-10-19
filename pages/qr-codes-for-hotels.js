import LandingPage from "@/components/landing/LandingPage";
import { LANDING_PAGES } from "@/components/landing/landingPages";

// Content: LANDING_PAGES.hotels in components/landing/landingPages.js
export default function HotelQrCodesPage() {
  return <LandingPage page={LANDING_PAGES.hotels} />;
}
