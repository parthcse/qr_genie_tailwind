import { CURRENCY_NAMES } from "../lib/price";

const LABELS = { INR: "₹ INR", USD: "$ USD" };

/** INR / USD switch for prices; renders nothing unless there are at least two currencies */
export default function CurrencySwitch({ currencies, value, onChange, className = "" }) {
  if (!currencies || currencies.length < 2) return null;
  return (
    <div role="radiogroup" aria-label="Currency" className={`inline-grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 ${className}`}>
      {currencies.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          title={`Pay in ${CURRENCY_NAMES[c] || c}`}
          onClick={() => onChange(c)}
          className={`rounded-lg px-3.5 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
            value === c ? "bg-white font-semibold text-indigo-700 shadow-sm" : "font-medium text-gray-600 hover:text-gray-900"
          }`}
        >
          {LABELS[c] || c}
        </button>
      ))}
    </div>
  );
}
