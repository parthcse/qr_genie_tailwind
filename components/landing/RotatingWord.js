import { useEffect, useRef, useState } from "react";

// How long each word stays before the next one comes in
const HOLD_MS = 3000;

// The brand gradient (indigo-600, violet-600, purple-600) as one colour per letter: letters that move on their own can't
// share one gradient, because a clipped background doesn't reach through a moving child
const STOPS = [
  [79, 70, 229],
  [124, 58, 237],
  [147, 51, 234],
];
function letterColor(index, count) {
  const at = count > 1 ? (index / (count - 1)) * (STOPS.length - 1) : 0;
  const from = Math.min(Math.floor(at), STOPS.length - 2);
  const part = at - from;
  const [r, g, b] = STOPS[from].map((value, i) => Math.round(value + (STOPS[from + 1][i] - value) * part));
  return `rgb(${r} ${g} ${b})`;
}

function Letters({ word, leaving = false }) {
  const letters = [...word];
  return (
    <span className={leaving ? "word-swap-out" : "word-swap-in"}>
      {letters.map((letter, index) => (
        <span key={index} className="word-swap-letter" data-letter={letter} style={{ "--n": index, color: letterColor(index, letters.length) }} />
      ))}
    </span>
  );
}

/**
 * A word in a heading that changes to the others in turn, its letters sliding up one after another (the home page hero).
 * words[0] is the real text: it's in the HTML and stays in the heading the whole time, so search engines and screen readers
 * only ever read that one, and the heading never moves because its width holds the space. So it must be the longest word.
 * The moving letters are drawn from an attribute (styles/globals.css), which keeps them out of the page's text. They stop
 * for reduced motion, and wait while the word is scrolled away or the tab is in the background.
 */
export default function RotatingWord({ words }) {
  const box = useRef(null);
  // 0 until the first change: only then do the moving letters take over from the real word
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let onScreen = true;
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });
    observer.observe(box.current);
    const timer = setInterval(() => {
      if (onScreen && !document.hidden) setStep((current) => current + 1);
    }, HOLD_MS);
    return () => {
      clearInterval(timer);
      observer.disconnect();
    };
  }, []);

  return (
    // Below lg the heading is centred, so it has its own line: beside other text a shorter word would leave a gap
    <span ref={box} className="relative mx-auto block w-fit whitespace-nowrap lg:mx-0 lg:inline-block">
      <span className={`bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text pb-1 text-transparent ${step > 0 ? "opacity-0" : ""}`}>{words[0]}</span>
      {step > 0 && (
        <span className="word-swap" aria-hidden="true">
          <Letters key={`out-${step}`} word={words[(step - 1) % words.length]} leaving />
          <Letters key={`in-${step}`} word={words[step % words.length]} />
        </span>
      )}
    </span>
  );
}
