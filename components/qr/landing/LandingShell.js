import { FaArrowRight } from "react-icons/fa";
import { landingTheme } from "@/lib/qr/landingThemes";
import { SITE_URL } from "@/lib/site";

/**
 * A full-width button in the theme's colours: an optional icon, a title and an optional second line. In the preview
 * (or without an address) it's drawn but not clickable. Links open in the same tab, without passing on where they came from.
 */
export function LandingButton({ href, preview = false, themeId, icon = null, title, subtitle }) {
  const theme = landingTheme(themeId);
  const body = (
    <>
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{title}</span>
        {subtitle && (
          <span className="block truncate text-xs font-medium opacity-60">{subtitle}</span>
        )}
      </span>
      <FaArrowRight className="h-3 w-3 flex-none opacity-40 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
    </>
  );
  const className = `group flex w-full items-center gap-3 rounded-2xl ${icon ? "px-3.5 py-3" : "px-5 py-4"} text-left text-[15px] font-semibold shadow-sm transition duration-300`;
  const style = { background: theme.button, color: theme.buttonText, border: `1px solid ${theme.buttonBorder}` };
  return preview || !href ? (
    <span className={className} style={style}>
      {body}
    </span>
  ) : (
    <a href={href} rel="noopener noreferrer nofollow" className={`${className} hover:-translate-y-0.5 hover:shadow-lg`} style={style}>
      {body}
    </a>
  );
}

/** Photo, title and description at the top of a hosted page; in the preview an empty title shows a placeholder */
export function LandingHeader({ image, title, description, themeId, preview = false, placeholder = "Your page title" }) {
  const theme = landingTheme(themeId);
  return (
    <div className="text-center">
      <LandingAvatar image={image} title={title} themeId={themeId} />
      <h1 className={`mt-5 break-words font-display text-2xl font-bold tracking-tight ${title ? "" : "opacity-60"}`}>
        {title || (preview ? placeholder : "")}
      </h1>
      {description && (
        <p className="mx-auto mt-2 max-w-sm whitespace-pre-line break-words text-[15px] leading-relaxed" style={{ color: theme.muted }}>
          {description}
        </p>
      )}
    </div>
  );
}

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
