import LandingPage from "@/components/landing/LandingPage";
import { LANDING_PAGES } from "@/components/landing/landingPages";

// Content: LANDING_PAGES.whatsapp in components/landing/landingPages.js
export default function WhatsappQrCodePage() {
  return <LandingPage page={LANDING_PAGES.whatsapp} />;
}
