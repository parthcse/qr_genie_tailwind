import { socialPlatform, socialProfileLink } from "@/lib/qr/socialPlatforms";
import LandingShell, { LandingButton, LandingHeader } from "./LandingShell";
import { BrandTile } from "./brandIcons";

/**
 * "Social media" page: photo, title, description and a button per profile with the platform's icon.
 * content: { title, description, avatar, theme, profiles: [{ platform, handle, url }] } on the real page; in the
 * preview profiles are as typed ({ platform, value }), so their links are worked out here just for display.
 */
export default function SocialLanding({ content = {}, preview = false }) {
  const profiles = (content.profiles || [])
    .map((profile) => {
      if (profile.url !== undefined) return profile;
      const link = socialProfileLink(profile.platform, profile.value);
      return { platform: profile.platform, handle: link.handle || "", url: link.url || "", typed: profile.value };
    })
    .filter((profile) => profile.url || profile.typed);
  const placeholder = preview && profiles.length === 0;
  const shown = placeholder
    ? [{ platform: "instagram", handle: "yourname" }, { platform: "tiktok", handle: "yourname" }, { platform: "youtube", handle: "yourchannel" }]
    : profiles;

  return (
    <LandingShell themeId={content.theme} preview={preview}>
      <LandingHeader image={content.avatar} title={content.title} description={content.description} themeId={content.theme} preview={preview} placeholder="Your name or brand" />
      <ul className={`mt-8 space-y-3 ${placeholder ? "opacity-60" : ""}`}>
        {shown.map((profile, i) => {
          const label = socialPlatform(profile.platform)?.label || "Profile";
          const subtitle = profile.handle ? (profile.platform === "whatsapp" ? profile.handle : `@${profile.handle}`) : profile.typed || "";
          return (
            <li key={`${i}-${profile.platform}`}>
              <LandingButton
                href={profile.url}
                preview={preview}
                themeId={content.theme}
                icon={<BrandTile platform={profile.platform} />}
                title={label}
                subtitle={subtitle}
              />
            </li>
          );
        })}
      </ul>
    </LandingShell>
  );
}
