import { FaEnvelope, FaGlobe, FaLocationDot, FaPhone, FaUserPlus } from "react-icons/fa6";
import { landingTheme } from "@/lib/qr/landingThemes";
import { telLink, mailLink, mapsLink } from "@/lib/qr/qrContent";
import { LandingButton } from "./LandingShell";

/**
 * Blocks shared by the Contact card and Business pages: one-tap actions, a details card and "Save contact".
 * Values are cleaned content (lib/qr/qrContent.js); in the preview they're the form as typed, so links aren't live.
 */

// Address without the protocol, for display
const shortUrl = (url) => url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");

/** The actions a contact supports, in order: call, email, website, directions */
export function contactActions({ phone, email, website, address }) {
  return [
    phone && { id: "call", label: "Call", icon: FaPhone, href: telLink(phone), detail: phone },
    email && { id: "email", label: "Email", icon: FaEnvelope, href: mailLink(email), detail: email },
    website && { id: "website", label: "Website", icon: FaGlobe, href: website, detail: shortUrl(website) },
    address && { id: "directions", label: "Directions", icon: FaLocationDot, href: mapsLink(address), detail: address },
  ].filter(Boolean);
}

/** Round buttons with a label under each */
export function ActionRow({ actions, preview, themeId }) {
  const theme = landingTheme(themeId);
  if (actions.length === 0) return null;
  return (
    <ul className="mt-6 flex justify-center gap-5">
      {actions.map(({ id, label, icon: Icon, href }) => {
        const circle = (
          <>
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md"
              style={{ background: theme.button, color: theme.buttonText, border: `1px solid ${theme.buttonBorder}` }}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="mt-1.5 text-xs font-medium" style={{ color: theme.muted }}>
              {label}
            </span>
          </>
        );
        return (
          <li key={id}>
            {preview ? (
              <span className="group flex flex-col items-center">{circle}</span>
            ) : (
              <a href={href} rel="noopener noreferrer nofollow" className="group flex flex-col items-center">
                {circle}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** A card listing the contact details, each tappable */
export function DetailsCard({ actions, preview, themeId, title = "Contact" }) {
  const theme = landingTheme(themeId);
  if (actions.length === 0) return null;
  return (
    <section className="mt-6 overflow-hidden rounded-2xl shadow-sm" style={{ background: theme.button, color: theme.buttonText, border: `1px solid ${theme.buttonBorder}` }}>
      <h2 className="px-5 pt-4 text-xs font-semibold uppercase tracking-[0.12em] opacity-60">{title}</h2>
      <ul className="px-2 pb-2 pt-1">
        {actions.map(({ id, label, icon: Icon, href, detail }) => {
          const row = (
            <>
              <Icon className="mt-0.5 h-4 w-4 flex-none opacity-60" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="sr-only">{label}: </span>
                <span className="block whitespace-pre-line break-words text-[15px] font-medium">{detail}</span>
              </span>
            </>
          );
          return (
            <li key={id}>
              {preview ? (
                <span className="flex gap-3 rounded-xl px-3 py-2.5">{row}</span>
              ) : (
                <a href={href} rel="noopener noreferrer nofollow" className="flex gap-3 rounded-xl px-3 py-2.5 transition hover:bg-black/5" style={{ color: "inherit" }}>
                  {row}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Downloads the contact file (pages/api/r/[slug]/vcard.js) so it can be added to the phone's contacts */
export function SaveContactButton({ slug, preview, themeId }) {
  return (
    <div className="mt-6">
      <LandingButton
        href={slug ? `/api/r/${encodeURIComponent(slug)}/vcard` : null}
        preview={preview}
        themeId={themeId}
        icon={
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-black/5">
            <FaUserPlus className="h-4 w-4" aria-hidden="true" />
          </span>
        }
        title="Save contact"
        subtitle="Add to your phone's contacts"
      />
    </div>
  );
}
