import { useRef } from "react";

export const CODE_LENGTH = 6;

/**
 * Six one-digit boxes for an emailed code: typing moves on, backspace moves back, arrow keys move, and a pasted or
 * autofilled code (phones offer it from the email) fills them all. onComplete(code) runs once all six are filled.
 * - digits / setDigits: array of six strings, owned by the parent
 * - size: "lg" (verification page) or "sm" (inside a card, e.g. the account page)
 */
export default function CodeInput({ digits, setDigits, disabled, invalid, onComplete, size = "lg" }) {
  const refs = useRef([]);
  const focus = (i) => refs.current[Math.max(0, Math.min(CODE_LENGTH - 1, i))]?.focus();

  const fill = (start, text) => {
    const clean = text.replace(/\D/g, "").slice(0, CODE_LENGTH - start);
    if (!clean) return;
    const next = [...digits];
    clean.split("").forEach((d, k) => (next[start + k] = d));
    setDigits(next);
    if (next.every(Boolean)) onComplete(next.join(""));
    else focus(start + clean.length);
  };

  const box = size === "sm" ? "h-12 text-xl sm:h-14 sm:text-2xl" : "h-14 text-2xl sm:h-16 sm:text-3xl";

  return (
    <div role="group" aria-label="Verification code" className="flex justify-between gap-2 sm:gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={i === 0 ? CODE_LENGTH : 1}
          aria-label={`Digit ${i + 1} of ${CODE_LENGTH}`}
          disabled={disabled}
          value={d}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (v.length > 1) return fill(i, v); // autofill or a fast paste
            const next = [...digits];
            next[i] = v;
            setDigits(next);
            if (v) {
              if (next.every(Boolean)) onComplete(next.join(""));
              else focus(i + 1);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              const next = [...digits];
              next[i - 1] = "";
              setDigits(next);
              focus(i - 1);
              e.preventDefault();
            } else if (e.key === "ArrowLeft") {
              focus(i - 1);
              e.preventDefault();
            } else if (e.key === "ArrowRight") {
              focus(i + 1);
              e.preventDefault();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            fill(i, e.clipboardData.getData("text"));
          }}
          className={`w-full min-w-0 rounded-xl border-2 bg-white text-center font-sans font-bold text-slate-900 shadow-sm outline-none transition duration-200 focus:-translate-y-0.5 focus:ring-4 disabled:opacity-60 motion-reduce:transform-none ${box} ${
            invalid
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : d
                ? "border-indigo-400 focus:border-indigo-500 focus:ring-indigo-100"
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
          }`}
        />
      ))}
    </div>
  );
}

/** Six empty boxes */
export const emptyCode = () => Array(CODE_LENGTH).fill("");
