import { landingTheme } from "@/lib/qr/landingThemes";
import { SITE_URL } from "@/lib/site";

/**
 * The frame of every page QR-Genie hosts: the theme's background and colours, a centred phone-width column and a small
 * "Made with QR-Genie" footer. preview: drawn inside the create page's phone (fills it, no live links).
 */
export default function LandingShell({ themeId, preview = false, children }) {
  const theme = landingTheme(themeId);
  return (
    <div className={`flex flex-col ${preview ? "min-h-full" : "min-h-screen"}`} style={{ background: theme.background, color: theme.text }}>
      <main className={`mx-auto flex w-full max-w-md flex-1 flex-col px-5 ${preview ? "pb-6 pt-14" : "pb-10 pt-12 sm:pt-16"}`}>{children}</main>
      <footer className="pb-6 text-center text-xs font-medium" style={{ color: theme.muted }}>
        {preview ? (
          <span>Made with QR-Genie</span>
        ) : (
          <a href={SITE_URL} className="hover:underline" style={{ color: theme.muted }}>
            Made with QR-Genie
          </a>
        )}
      </footer>
    </div>
  );
}

/** Round photo, or the first letters of the title on a soft circle when there's no photo */
export function LandingAvatar({ image, title, themeId }) {
  const theme = landingTheme(themeId);
  const initials = (title || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element -- a data URL saved with the code, nothing to optimise
    <img src={image} alt="" className="mx-auto h-24 w-24 rounded-full object-cover shadow-lg ring-4" style={{ "--tw-ring-color": theme.buttonBorder === "transparent" ? "rgba(255,255,255,0.35)" : theme.buttonBorder }} />
  ) : (
    <span
      className="mx-auto flex h-24 w-24 items-center justify-center rounded-full font-display text-3xl font-bold shadow-lg"
      style={{ background: theme.button, color: theme.buttonText, border: `1px solid ${theme.buttonBorder}` }}
      aria-hidden="true"
    >
      {initials || "★"}
    </span>
  );
}
