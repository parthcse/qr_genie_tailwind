import { FaArrowRight } from "react-icons/fa";
import { landingTheme } from "@/lib/qr/landingThemes";
import LandingShell, { LandingAvatar } from "./LandingShell";

/**
 * "List of links" page: photo, title, a short description and one button per link.
 * content: { title, description, avatar, theme, links: [{ title, url }] }, cleaned by lib/qr/qrContent.js on the real
 * page; in the create page's preview it's the form as typed, so anything may still be empty.
 */
export default function LinksLanding({ content = {}, preview = false }) {
  const theme = landingTheme(content.theme);
  const links = (content.links || []).filter((link) => link?.title || link?.url);
  const shownLinks = preview && links.length === 0 ? [{ title: "Your first link" }, { title: "Another link" }] : links;
  const placeholder = preview && links.length === 0;

  return (
    <LandingShell themeId={content.theme} preview={preview}>
      <div className="text-center">
        <LandingAvatar image={content.avatar} title={content.title} themeId={content.theme} />
        <h1 className={`mt-5 break-words font-display text-2xl font-bold tracking-tight ${content.title ? "" : "opacity-60"}`}>
          {content.title || (preview ? "Your page title" : "")}
        </h1>
        {content.description && (
          <p className="mx-auto mt-2 max-w-sm whitespace-pre-line break-words text-[15px] leading-relaxed" style={{ color: theme.muted }}>
            {content.description}
          </p>
        )}
      </div>

      <ul className={`mt-8 space-y-3 ${placeholder ? "opacity-60" : ""}`}>
        {shownLinks.map((link, i) => {
          const body = (
            <>
              <span className="min-w-0 flex-1 truncate">{link.title || link.url}</span>
              <FaArrowRight className="h-3 w-3 flex-none opacity-40 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
            </>
          );
          const className =
            "group flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-[15px] font-semibold shadow-sm transition duration-300";
          const style = { background: theme.button, color: theme.buttonText, border: `1px solid ${theme.buttonBorder}` };
          return (
            <li key={`${i}-${link.title}`}>
              {preview || !link.url ? (
                <span className={className} style={style}>
                  {body}
                </span>
              ) : (
                <a href={link.url} rel="noopener noreferrer nofollow" className={`${className} hover:-translate-y-0.5 hover:shadow-lg`} style={style}>
                  {body}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </LandingShell>
  );
}
