import LinksLanding from "./LinksLanding";
import SocialLanding from "./SocialLanding";

// The hosted page for each "page" type (lib/qr/qrTypes.js)
const PAGES = {
  links: LinksLanding,
  social: SocialLanding,
};

export const hasLandingPage = (type) => !!PAGES[type];

/**
 * The page a scanner sees for a "page" type. The scan page (pages/r/[slug].js) passes the saved, cleaned content;
 * the create page passes the form as it's being filled in, with preview on.
 */
export default function QrLanding({ type, content, preview = false }) {
  const Page = PAGES[type];
  return Page ? <Page content={content || {}} preview={preview} /> : null;
}
