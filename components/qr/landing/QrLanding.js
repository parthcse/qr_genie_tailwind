import LinksLanding from "./LinksLanding";
import SocialLanding from "./SocialLanding";
import ContactLanding from "./ContactLanding";
import BusinessLanding from "./BusinessLanding";
import CouponLanding from "./CouponLanding";
import AppLanding from "./AppLanding";
import VideoLanding from "./VideoLanding";
import MenuLanding from "./MenuLanding";
import ImagesLanding from "./ImagesLanding";
import AudioLanding from "./AudioLanding";
import PdfLanding from "./PdfLanding";

// The hosted page for each "page" type (lib/qr/qrTypes.js)
const PAGES = {
  links: LinksLanding,
  social: SocialLanding,
  vcard: ContactLanding,
  business: BusinessLanding,
  coupon: CouponLanding,
  apps: AppLanding,
  video: VideoLanding,
  menu: MenuLanding,
  images: ImagesLanding,
  mp3: AudioLanding,
  pdf: PdfLanding,
};

export const hasLandingPage = (type) => !!PAGES[type];

/**
 * The page a scanner sees for a "page" type. The scan page (pages/r/[slug].js) passes the saved, cleaned content;
 * the create page passes the form as it's being filled in, with preview on. slug: the code's short link, for links
 * back to QR-Genie such as the "Save contact" file.
 */
export default function QrLanding({ type, content, preview = false, slug = null }) {
  const Page = PAGES[type];
  return Page ? <Page content={content || {}} preview={preview} slug={slug} /> : null;
}
