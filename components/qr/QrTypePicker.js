import { useEffect, useRef } from "react";
import { FaCheckCircle, FaEye } from "react-icons/fa";

// The pointer has to rest on a card this long before the preview changes, so crossing other cards on the way to the
// preview doesn't change it
const HOVER_INTENT_MS = 110;

/**
 * Step 1 of the create page: every QR type as a small card, all on screen without scrolling (.dash-type-grid). Previewing
 * and choosing are separate:
 * - mouse: resting on a card previews it, clicking chooses it. The preview stays when the pointer leaves, until another card is previewed.
 * - keyboard: focusing a card previews it, Enter chooses it.
 * - touch: a tap previews (onTap decides how to show it). On a wide screen, a second tap on the same card chooses it.
 * types: from lib/qr/qrTypes.js with { active, icon }. accentFor(id): the icon's colour classes.
 */
export default function QrTypePicker({ types, selectedType, previewType, onPreview, onTap, onSelect, accentFor }) {
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

  const chip = "absolute -top-1.5 right-1.5 z-10 inline-flex h-[1.125rem] items-center gap-1 rounded-full px-1.5 text-[10px] font-semibold shadow-sm";

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <h2 className="text-base font-semibold text-gray-900">What should your QR code do?</h2>
        <p className="text-xs text-gray-600">
          <span className="hidden [@media(hover:hover)]:inline">Point at a type to preview it, then click to choose it.</span>
          <span className="[@media(hover:hover)]:hidden">Tap a type to preview it.</span>
        </p>
      </div>

      <div className="dash-type-grid mt-3">
        {types
          .filter((type) => type.active)
          .map((type) => {
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
                className={`group relative flex min-w-0 items-center gap-2.5 rounded-xl border p-2 text-left transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 max-sm:flex-col max-sm:justify-center max-sm:gap-1 max-sm:text-center sm:p-2.5 ${
                  selected
                    ? "border-transparent bg-gradient-to-br from-indigo-50 to-purple-50 ring-2 ring-indigo-600"
                    : previewing
                      ? "border-indigo-300 bg-white shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-400/25"
                      : "border-white/80 bg-white/70 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-md hover:shadow-indigo-500/10 motion-reduce:transform-none"
                }`}
              >
                <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none max-sm:h-8 max-sm:w-8 ${accentFor(type.id)}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 max-sm:w-full">
                  <span className="block truncate text-[13px] font-semibold leading-tight text-gray-900 max-sm:whitespace-normal max-sm:text-xs">{type.label}</span>
                  <span className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-gray-600 max-sm:hidden">{type.description}</span>
                </span>
                {selected ? (
                  <span className={`${chip} bg-indigo-600 text-white`}>
                    <FaCheckCircle className="h-2.5 w-2.5" />
                    Selected
                  </span>
                ) : previewing ? (
                  <span className={`${chip} bg-white text-indigo-700 ring-1 ring-indigo-200`}>
                    <FaEye className="h-2.5 w-2.5" />
                    Previewing
                  </span>
                ) : (
                  type.isNew && <span className={`${chip} bg-gradient-to-r from-indigo-600 to-purple-600 text-white`}>New</span>
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}
