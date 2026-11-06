import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "motion/react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

/**
 * Parts shared by the dashboard pages. The glass look itself is CSS (styles/globals.css): `glass`, `glass-strong`,
 * `glass-hover`, `dash-skeleton`, and `rise` for entrances. Motion components here need the <LazyMotion> in DashboardLayout.
 */

// Country codes (from the scan's IP) as names, e.g. "IN" -> "India"
let regionNames = null;
export function countryName(code) {
  if (!code || code === "Unknown" || code.length !== 2) return code || "Unknown";
  try {
    regionNames = regionNames || new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
}

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Dropdowns and modals go on <body>: glass (a backdrop blur) would trap fixed overlays and clip menus */
export function Portal({ children }) {
  return typeof document === "undefined" ? null : createPortal(children, document.body);
}

/** True once the element has been on screen. Stays true, so a reveal plays only the first time. */
export function useInViewOnce(ref) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen) return undefined;
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSeen(true);
      },
      { threshold: 0.1 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, seen]);
  return seen;
}

const easeOut = (t) => 1 - (1 - t) ** 3;
const plainNumber = (n) => n.toLocaleString("en-US");

/**
 * A number that counts up to its value the first time it's seen. Afterwards a changed value glides from the old number;
 * ordinary re-renders with the same value do nothing. format(n) handles commas, currency, percentages and so on;
 * decimals says how many places to keep while counting.
 */
export function CountUp({ value, format = plainNumber, decimals = 0, duration = 1100, className = "" }) {
  const target = Number(value) || 0;
  const ref = useRef(null);
  const seen = useInViewOnce(ref);
  const [shown, setShown] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    if (!seen) return undefined;
    const from = current.current;
    if (from === target) {
      setShown(target);
      return undefined;
    }
    if (prefersReducedMotion()) {
      current.current = target;
      setShown(target);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const round = (n) => Number(n.toFixed(decimals));
    const tick = (now) => {
      // A frame's timestamp can be from just before `start`, which would make the number negative for a moment
      const progress = Math.max(0, Math.min(1, (now - start) / duration));
      const next = progress === 1 ? target : round(from + (target - from) * easeOut(progress));
      current.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seen, target, decimals, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {format(shown)}
    </span>
  );
}

/** A bar that grows from the left the first time it's seen. percent: 0 to 100. */
export function AnimatedBar({ percent, className = "bg-indigo-500", trackClassName = "h-1.5 bg-indigo-950/[0.06]" }) {
  const ref = useRef(null);
  const seen = useInViewOnce(ref);
  return (
    <div ref={ref} className={`overflow-hidden rounded-full ${trackClassName}`}>
      <div
        className={`h-full origin-left rounded-full transition-transform duration-1000 ease-out motion-reduce:transition-none ${className}`}
        style={{ transform: `scaleX(${seen ? Math.min(100, percent) / 100 : 0})` }}
      />
    </div>
  );
}

/** Horizontal bars with counts and shares */
export function BarList({ items, total, formatName = (v) => v, color = "bg-indigo-500", empty = "No data yet" }) {
  if (!items?.length) return <p className="py-6 text-center text-sm text-gray-500">{empty}</p>;
  const max = Math.max(...items.map((item) => item.count));
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.name}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-gray-700">{formatName(item.name)}</span>
            <span className="flex-none tabular-nums text-gray-600">
              <span className="font-semibold text-gray-900">{plainNumber(item.count)}</span>
              {total > 0 && <span className="ml-1.5 text-xs">{Math.round((item.count / total) * 100)}%</span>}
            </span>
          </div>
          <AnimatedBar percent={Math.max(3, (item.count / max) * 100)} className={color} />
        </li>
      ))}
    </ul>
  );
}

const PILL_SPRING = { type: "spring", stiffness: 420, damping: 36, mass: 0.8 };

/**
 * Tabs or filter options with a white pill that slides to the chosen one. Left and right arrow keys move between them.
 * options: [{ value, label, count?, disabled?, title? }]
 */
export function SegmentedControl({ label, options, value, onChange, size = "md", className = "" }) {
  const groupId = useId();
  const refs = useRef({});
  const move = (event, index) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const enabled = options.filter((option) => !option.disabled);
    const position = enabled.findIndex((option) => option.value === options[index].value);
    const next = enabled[(position + step + enabled.length) % enabled.length];
    onChange(next.value);
    refs.current[next.value]?.focus();
  };
  const sizing = size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm";
  return (
    <div role="tablist" aria-label={label} className={`dash-segment ${className}`}>
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={(element) => {
              refs.current[option.value] = element;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={option.disabled}
            title={option.title}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => move(event, index)}
            className={`relative flex-1 whitespace-nowrap rounded-[0.625rem] ${sizing} transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none ${
              active ? "font-semibold text-indigo-700" : "font-medium text-gray-600 hover:text-gray-900"
            }`}
          >
            {active && <m.span layoutId={`segment-${groupId}`} className="dash-segment-pill" transition={PILL_SPRING} />}
            <span className="relative inline-flex items-center justify-center gap-1.5">
              {option.label}
              {option.count !== undefined && (
                <span className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-indigo-50 text-indigo-700" : "bg-indigo-950/[0.06] text-gray-600"}`}>
                  {option.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Short messages after an action. const { toast, showToast } = useToast(); then <ToastHost toast={toast} /> */
export function useToast(duration = 2800) {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, tone = "success") => setToast({ message, tone, id: Date.now() }), []);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), duration);
    return () => clearTimeout(timer);
  }, [toast, duration]);
  return { toast, showToast };
}

export function ToastHost({ toast }) {
  // Always in the page so a message can animate out; drawn only in the browser, because the server has no <body> to portal to
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <Portal>
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4" role="status" aria-live="polite">
        <AnimatePresence>
          {toast && (
            <m.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="glass-strong flex max-w-md items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 shadow-xl"
            >
              {toast.tone === "error" ? (
                <FaExclamationCircle className="h-4 w-4 flex-none text-red-600" />
              ) : (
                <FaCheckCircle className="h-4 w-4 flex-none text-emerald-600" />
              )}
              <span className="break-words">{toast.message}</span>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </Portal>
  );
}
