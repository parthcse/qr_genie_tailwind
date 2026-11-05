import LandingShell, { LandingButton, LandingHeader, Part } from "./LandingShell";

/**
 * "List of links" page: photo, title, a short description and one button per link.
 * content: { title, description, avatar, theme, links: [{ title, url }] }, cleaned by lib/qr/qrContent.js on the real
 * page; in the create page's preview it's the form as typed, so anything may still be empty.
 */
export default function LinksLanding({ content = {}, preview = false }) {
  const links = (content.links || []).filter((link) => link?.title || link?.url);

  return (
    <LandingShell themeId={content.theme} preview={preview}>
      <LandingHeader image={content.avatar} title={content.title} description={content.description} themeId={content.theme} content={content} />
      <Part content={content} fields="links">
        <ul className="mt-8 space-y-3">
          {links.map((link, i) => (
            <li key={`${i}-${link.title}`}>
              <LandingButton href={link.url} preview={preview} themeId={content.theme} title={link.title || link.url} />
            </li>
          ))}
        </ul>
      </Part>
    </LandingShell>
  );
}
