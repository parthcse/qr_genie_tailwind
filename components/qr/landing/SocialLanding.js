import { socialPlatform, socialProfileLink } from "@/lib/qr/socialPlatforms";
import LandingShell, { LandingButton, LandingHeader } from "./LandingShell";
import { BrandTile } from "./brandIcons";

/**
 * A button per social profile, with the platform's icon (Social media page, and the profiles on Contact card and
 * Business pages). Saved profiles are { platform, handle, url }; in the create page's preview they're as typed
 * ({ platform, value }), so their links are worked out here just for display.
 */
export function ProfileButtons({ profiles = [], preview = false, themeId, placeholder = null, className = "mt-8" }) {
  const shown = profiles
    .map((profile) => {
      if (profile.url !== undefined) return profile;
      const link = socialProfileLink(profile.platform, profile.value);
      return { platform: profile.platform, handle: link.handle || "", url: link.url || "", typed: profile.value };
    })
    .filter((profile) => profile.url || profile.typed);
  const list = shown.length === 0 && placeholder ? placeholder : shown;
  if (list.length === 0) return null;

  return (
    <ul className={`space-y-3 ${className} ${shown.length === 0 ? "opacity-60" : ""}`}>
      {list.map((profile, i) => {
        const label = socialPlatform(profile.platform)?.label || "Profile";
        const subtitle = profile.handle ? (profile.platform === "whatsapp" ? profile.handle : `@${profile.handle}`) : profile.typed || "";
        return (
          <li key={`${i}-${profile.platform}`}>
            <LandingButton href={profile.url} preview={preview} themeId={themeId} icon={<BrandTile platform={profile.platform} />} title={label} subtitle={subtitle} />
          </li>
        );
      })}
    </ul>
  );
}

const PLACEHOLDER = [
  { platform: "instagram", handle: "yourname" },
  { platform: "tiktok", handle: "yourname" },
  { platform: "youtube", handle: "yourchannel" },
];

/**
 * "Social media" page: photo, title, description and a button per profile.
 * content: { title, description, avatar, theme, profiles }, cleaned by lib/qr/qrContent.js on the real page.
 */
export default function SocialLanding({ content = {}, preview = false }) {
  return (
    <LandingShell themeId={content.theme} preview={preview}>
      <LandingHeader image={content.avatar} title={content.title} description={content.description} themeId={content.theme} preview={preview} placeholder="Your name or brand" />
      <ProfileButtons profiles={content.profiles || []} preview={preview} themeId={content.theme} placeholder={preview ? PLACEHOLDER : null} />
    </LandingShell>
  );
}
