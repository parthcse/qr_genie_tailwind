import { useEffect, useRef } from "react";
import { FaCheckCircle, FaEye } from "react-icons/fa";

// The pointer has to rest on a card this long before the preview changes, so crossing other cards on the way to the
// preview doesn't change it
const HOVER_INTENT_MS = 110;

/**
 * Step 1 of the create page: every QR type as a card. Previewing and choosing are separate:
 * - mouse: resting on a card previews it, clicking chooses it. The preview stays when the pointer leaves, until another card is previewed.
 * - keyboard: focusing a card previews it, Enter chooses it.
 * - touch: a tap previews (onTap decides how to show it). On a wide screen, a second tap on the same card chooses it.
 * types: from lib/qr/qrTypes.js with { active, icon }. categories: QR_TYPE_CATEGORIES. accentFor(id): the icon's colour classes.
 */
export default function QrTypePicker({ types, categories, selectedType, previewType, onPreview, onTap, onSelect, accentFor }) {
  const hoverTimer = useRef(null);
  const lastPointer = useRef("mouse");

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const onEnter = (id, event) => {
    if (event.pointerType !== "mouse") return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => onPreview(id), HOVER_INTENT_MS);
  };
  // Only cancels a preview that hasn't happened yet: the current one stays
  const onLeave = () => clearTimeout(hoverTimer.current);

  const onClick = (id, event) => {
    clearTimeout(hoverTimer.current);
    const byKeyboard = event.detail === 0;
    if (byKeyboard || lastPointer.current !== "touch") {
      onSelect(id);
      return;
    }
    const wideScreen = window.matchMedia("(min-width: 1024px)").matches;
    if (wideScreen && previewType === id) onSelect(id);
    else onTap(id);
  };

  const upcoming = types.filter((type) => type.active === false);
  const groups = categories
    .map((category) => ({ ...category, types: types.filter((type) => type.active && type.category === category.id) }))
    .filter((group) => group.types.length > 0);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">What should your QR code do?</h2>
      <p className="mt-1 text-sm text-gray-600">
        <span className="hidden [@media(hover:hover)]:inline">Point at a type to preview it, then click to choose it.</span>
        <span className="[@media(hover:hover)]:hidden">Tap a type to preview it.</span>
      </p>

      {groups.map((group) => (
        <section key={group.id} className="mt-5" aria-labelledby={`type-group-${group.id}`}>
          <h3 id={`type-group-${group.id}`} className="text-xs font-semibold text-gray-600">
            {group.label}
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {group.types.map((type) => {
              const Icon = type.icon;
              const selected = selectedType === type.id;
              const previewing = previewType === type.id && !selected;
              return (
                <button
                  key={type.id}
                  type="button"
                  aria-pressed={selected}
                  title={type.hint}
                  onPointerDown={(event) => {
                    lastPointer.current = event.pointerType;
                  }}
                  onPointerEnter={(event) => onEnter(type.id, event)}
                  onPointerLeave={onLeave}
                  onFocus={(event) => event.target.matches(":focus-visible") && onPreview(type.id)}
                  onClick={(event) => onClick(type.id, event)}
                  className={`group relative flex min-h-[8.25rem] flex-col rounded-2xl border p-3.5 text-left transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:p-4 ${
                    selected
                      ? "border-transparent bg-gradient-to-br from-indigo-50 to-purple-50 ring-2 ring-indigo-600"
                      : previewing
                        ? "border-indigo-300 bg-white shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-400/25"
                        : "border-white/80 bg-white/70 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/10 motion-reduce:transform-none"
                  }`}
                >
                  <span className="flex items-start justify-between gap-1.5">
                    <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none ${accentFor(type.id)}`}>
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    {selected ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">
                        <FaCheckCircle className="h-3.5 w-3.5" />
                        Selected
                      </span>
                    ) : previewing ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                        <FaEye className="h-3 w-3" />
                        Previewing
                      </span>
                    ) : (
                      type.isNew && (
                        <span className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-2 py-0.5 text-[11px] font-semibold text-white">New</span>
                      )
                    )}
                  </span>
                  <span className="mt-3 text-sm font-semibold text-gray-900 sm:text-[15px]">{type.label}</span>
                  <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-gray-600 sm:text-[13px]">{type.description}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {upcoming.length > 0 && (
        <div className="mt-6 border-t border-indigo-950/[0.06] pt-4">
          <p className="text-xs font-semibold text-gray-600">Coming soon</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {upcoming.map((type) => {
              const Icon = type.icon;
              return (
                <span key={type.id} className="inline-flex items-center gap-2 rounded-full border border-dashed border-indigo-200 bg-white/50 px-3 py-1.5 text-xs font-medium text-gray-600">
                  <Icon className="h-3 w-3" />
                  {type.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
