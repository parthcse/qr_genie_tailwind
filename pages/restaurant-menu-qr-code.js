import LandingPage from "@/components/landing/LandingPage";
import { LANDING_PAGES } from "@/components/landing/landingPages";

// Content: LANDING_PAGES.restaurant in components/landing/landingPages.js
export default function RestaurantMenuQrCodePage() {
  return <LandingPage page={LANDING_PAGES.restaurant} />;
}
