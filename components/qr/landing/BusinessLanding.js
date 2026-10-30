import { FaClock } from "react-icons/fa6";
import { WEEK_DAYS } from "@/lib/qr/qrContent";
import { landingTheme } from "@/lib/qr/landingThemes";
import LandingShell, { LandingHeader } from "./LandingShell";
import { ActionRow, DetailsCard, SaveContactButton, contactActions } from "./ContactBlocks";
import { ProfileButtons } from "./SocialLanding";

function OpeningHours({ hours = {}, themeId }) {
  const theme = landingTheme(themeId);
  const days = WEEK_DAYS.filter((day) => hours[day.id]);
  if (days.length === 0) return null;
  return (
    <section className="mt-6 rounded-2xl px-5 py-4 shadow-sm" style={{ background: theme.button, color: theme.buttonText, border: `1px solid ${theme.buttonBorder}` }}>
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] opacity-60">
        <FaClock className="h-3 w-3" aria-hidden="true" />
        Opening hours
      </h2>
      <dl className="mt-2 divide-y divide-black/5 text-[15px]">
        {days.map((day) => (
          <div key={day.id} className="flex justify-between gap-4 py-1.5">
            <dt className="opacity-70">{day.label}</dt>
            <dd className="text-right font-medium">{hours[day.id]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * "Business" page: logo, name, description, one-tap actions, opening hours, the contact details, social profiles and
 * "Save contact". content: the cleaned business content (lib/qr/qrContent.js); slug: for the contact file.
 */
export default function BusinessLanding({ content = {}, preview = false, slug = null }) {
  const actions = contactActions(content);
  return (
    <LandingShell themeId={content.theme} preview={preview}>
      <LandingHeader image={content.avatar} title={content.businessName} description={content.description} themeId={content.theme} preview={preview} placeholder="Your business name" />
      <ActionRow actions={actions} preview={preview} themeId={content.theme} />
      <OpeningHours hours={content.hours} themeId={content.theme} />
      <DetailsCard actions={actions} preview={preview} themeId={content.theme} />
      <ProfileButtons profiles={content.profiles || []} preview={preview} themeId={content.theme} className="mt-6" />
      <SaveContactButton slug={slug} preview={preview} themeId={content.theme} />
    </LandingShell>
  );
}
