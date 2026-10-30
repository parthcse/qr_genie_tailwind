import { landingTheme } from "@/lib/qr/landingThemes";
import LandingShell, { LandingHeader } from "./LandingShell";

/**
 * "Menu" page: logo, name and description, shortcuts to each section, then the dishes with their prices and
 * descriptions on white cards that stay easy to read in any theme, and notes (allergens, taxes) at the end.
 * content: { venueName, avatar, description, sections: [{ title, items: [{ name, description, price }] }], notes, theme }.
 */
export default function MenuLanding({ content = {}, preview = false }) {
  const theme = landingTheme(content.theme);
  const sections = (content.sections || [])
    .map((section) => ({ ...section, items: (section.items || []).filter((item) => item?.name || item?.price || item?.description) }))
    .filter((section) => section.items.length > 0);
  const placeholder = preview && sections.length === 0;
  const shown = placeholder
    ? [{ title: "Coffee", items: [{ name: "Cappuccino", price: "₹180", description: "Double shot, steamed milk" }, { name: "Cold brew", price: "₹220" }] }]
    : sections;
  const named = shown.filter((section) => section.title);

  return (
    <LandingShell themeId={content.theme} preview={preview}>
      <LandingHeader image={content.avatar} title={content.venueName} description={content.description} themeId={content.theme} preview={preview} placeholder="Your restaurant" />

      {named.length > 1 && (
        <nav aria-label="Menu sections" className="-mx-5 mt-6 overflow-x-auto px-5">
          <ul className="flex w-max gap-2">
            {named.map((section) => {
              const index = shown.indexOf(section);
              const chip = "block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold shadow-sm";
              const style = { background: theme.button, color: theme.buttonText, border: `1px solid ${theme.buttonBorder}` };
              return (
                <li key={index}>
                  {preview ? (
                    <span className={chip} style={style}>{section.title}</span>
                  ) : (
                    <a href={`#menu-section-${index}`} className={chip} style={style}>{section.title}</a>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <div className={`mt-6 space-y-5 ${placeholder ? "opacity-60" : ""}`}>
        {shown.map((section, index) => (
          <section key={index} id={`menu-section-${index}`} className="scroll-mt-4 rounded-2xl bg-white p-5 text-slate-900 shadow-lg shadow-black/5">
            {section.title && <h2 className="font-display text-lg font-bold tracking-tight">{section.title}</h2>}
            <ul className={`divide-y divide-slate-100 ${section.title ? "mt-2" : ""}`}>
              {section.items.map((item, i) => (
                <li key={i} className="py-3 first:pt-1 last:pb-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="min-w-0 break-words text-[15px] font-semibold">{item.name}</span>
                    {item.price && <span className="flex-none text-[15px] font-semibold tabular-nums text-slate-700">{item.price}</span>}
                  </div>
                  {item.description && <p className="mt-0.5 whitespace-pre-line break-words text-sm leading-relaxed text-slate-500">{item.description}</p>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {content.notes && (
        <p className="mt-6 whitespace-pre-line break-words text-center text-xs leading-relaxed" style={{ color: theme.muted }}>
          {content.notes}
        </p>
      )}
    </LandingShell>
  );
}
