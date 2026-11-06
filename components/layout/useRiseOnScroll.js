import { useEffect } from "react";

const ITEMS = ".rise, .rise-group > *";
// However many items arrive together, the last one starts within this many turns (--i in styles/globals.css)
const MAX_TURN = 6;

/**
 * The entrance itself is plain CSS, so it plays with the first paint and without JavaScript. This only keeps items below
 * the fold waiting (.rise-wait) so they rise when they scroll into view, in turn when several arrive together. Runs on
 * every page, so keep it small. Anything it misses simply shows, and without it nothing stays hidden.
 */
export default function useRiseOnScroll() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const arrive = new IntersectionObserver((entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, turn) => {
          arrive.unobserve(entry.target);
          entry.target.style.setProperty("--i", Math.min(turn, MAX_TURN));
          entry.target.classList.remove("rise-wait");
        });
    });

    const hold = (item) => {
      if (item.getBoundingClientRect().top <= window.innerHeight) return;
      item.classList.add("rise-wait");
      arrive.observe(item);
    };
    const itemsIn = (node) => (node.nodeType === 1 ? [...(node.matches(ITEMS) ? [node] : []), ...node.querySelectorAll(ITEMS)] : []);

    document.querySelectorAll(ITEMS).forEach(hold);
    // Page changes and data arriving. Runs before the browser paints, so nothing below the fold is seen before it waits.
    const added = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => itemsIn(node).forEach(hold));
        record.removedNodes.forEach((node) => itemsIn(node).forEach((item) => arrive.unobserve(item)));
      });
    });
    added.observe(document.body, { childList: true, subtree: true });

    return () => {
      added.disconnect();
      arrive.disconnect();
    };
  }, []);
}
