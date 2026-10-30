import LandingShell, { LandingHeader } from "./LandingShell";
import { ActionRow, DetailsCard, SaveContactButton, contactActions } from "./ContactBlocks";
import { ProfileButtons } from "./SocialLanding";

/**
 * "Contact card" (vCard) page: photo, name, job title and company, a short note, one-tap actions, "Save contact",
 * the details and social profiles. content: the cleaned vcard content (lib/qr/qrContent.js); slug: for the contact file.
 */
export default function ContactLanding({ content = {}, preview = false, slug = null }) {
  const name = [content.firstName, content.lastName].filter(Boolean).join(" ");
  const actions = contactActions(content);
  const details = [
    ...actions.filter((action) => action.id === "call"),
    ...(content.phone2 ? contactActions({ phone: content.phone2 }).map((action) => ({ ...action, id: "call2" })) : []),
    ...actions.filter((action) => action.id !== "call"),
  ];
  return (
    <LandingShell themeId={content.theme} preview={preview}>
      <LandingHeader
        image={content.avatar}
        title={name}
        subtitle={[content.jobTitle, content.company].filter(Boolean).join(" · ")}
        description={content.note}
        themeId={content.theme}
        preview={preview}
        placeholder="Your name"
      />
      <ActionRow actions={actions} preview={preview} themeId={content.theme} />
      <SaveContactButton slug={slug} preview={preview} themeId={content.theme} />
      <DetailsCard actions={details} preview={preview} themeId={content.theme} />
      <ProfileButtons profiles={content.profiles || []} preview={preview} themeId={content.theme} className="mt-6" />
    </LandingShell>
  );
}
