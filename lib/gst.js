// Indian GST helpers for tax invoices (lib/invoices.js): the tax inside a GST-inclusive price, which GST applies
// (CGST + SGST, IGST, or none for exports under LUT), state codes, GSTIN checks, invoice numbers, amounts in words.
// No imports, so it can be loaded and tested on its own. Amounts are in the smallest unit (paise / cents).

export const GST_RATE_PERCENT = 18;
export const INVOICE_PREFIX = "QG";

// GST state codes: the first two digits of a GSTIN, and the code printed with the place of supply
export const STATES = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
};
export const OUTSIDE_INDIA_CODE = "96";

// Other ways people write a state (compared after lower-casing and dropping everything but letters)
const STATE_ALIASES = {
  jk: "01", jandk: "01", jammukashmir: "01", hp: "02", pb: "03", ch: "04", uk: "05", uttaranchal: "05", hr: "06",
  dl: "07", newdelhi: "07", nctofdelhi: "07", delhinct: "07", rj: "08", up: "09", br: "10", sk: "11",
  ar: "12", nl: "13", mn: "14", mz: "15", tr: "16", ml: "17", as: "18", wb: "19", jh: "20", od: "21",
  orissa: "21", cg: "22", chattisgarh: "22", mp: "23", gj: "24", dnh: "26", dd: "26", daman: "26",
  diu: "26", damananddiu: "26", dadraandnagarhaveli: "26", dadranagarhaveli: "26", mh: "27", ka: "29",
  ga: "30", kl: "32", tn: "33", py: "34", pondicherry: "34", an: "35", andaman: "35",
  andamanandnicobar: "35", ts: "36", tg: "36", ap: "37", la: "38",
};

const squash = (text) => String(text || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");
const STATE_BY_NAME = Object.fromEntries(Object.entries(STATES).map(([code, name]) => [squash(name), code]));

/** "Gujarat", "GJ", "gujarat " or "24" → "24"; null when it isn't recognised */
export function findStateCode(text) {
  const raw = String(text || "").trim();
  if (/^\d{2}$/.test(raw)) return STATES[raw] ? raw : null;
  const key = squash(raw);
  return STATE_BY_NAME[key] || STATE_ALIASES[key] || null;
}

export const stateLabel = (code) =>
  code === OUTSIDE_INDIA_CODE ? `Outside India (${code})` : STATES[code] ? `${STATES[code]} (${code})` : null;

// GSTIN: state code, PAN, entity number, "Z", check character
const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const normalizeGstin = (value) => String(value || "").toUpperCase().replace(/[\s-]/g, "");

/** The 15th character of a GSTIN, worked out from the first 14 */
export function gstinCheckChar(first14) {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = GSTIN_CHARS.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GSTIN_CHARS[(36 - (sum % 36)) % 36];
}

export function isValidGstin(value) {
  const gstin = normalizeGstin(value);
  return GSTIN_PATTERN.test(gstin) && !!STATES[gstin.slice(0, 2)] && gstinCheckChar(gstin) === gstin[14];
}

/**
 * Which GST applies. Payments in rupees are supplies within India: CGST + SGST when the customer is in the
 * seller's state (or their state isn't known, when the seller's location counts), IGST when they're in another
 * state. Payments in another currency are exports: no GST under a Letter of Undertaking (LUT), otherwise IGST.
 */
export function decideSupply({ currency, sellerStateCode, customerStateCode, exportUnderLut }) {
  if (currency !== "INR") {
    return { supplyType: exportUnderLut ? "EXPORT_LUT" : "EXPORT_WITH_IGST", placeOfSupplyCode: OUTSIDE_INDIA_CODE };
  }
  const place = customerStateCode || sellerStateCode;
  return { supplyType: place === sellerStateCode ? "INTRA_STATE" : "INTER_STATE", placeOfSupplyCode: place };
}

/** Splits a GST-inclusive total into the taxable value and the tax: ₹499 → ₹422.88 + CGST ₹38.06 + SGST ₹38.06 */
export function splitInclusiveTotal(total, supplyType) {
  if (supplyType === "EXPORT_LUT") return { taxableValue: total, cgst: 0, sgst: 0, igst: 0 };
  const taxableValue = Math.round((total * 100) / (100 + GST_RATE_PERCENT));
  const tax = total - taxableValue;
  if (supplyType === "INTRA_STATE") {
    const cgst = Math.round(tax / 2);
    return { taxableValue, cgst, sgst: tax - cgst, igst: 0 };
  }
  return { taxableValue, cgst: 0, sgst: 0, igst: tax };
}

const istParts = (date) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "numeric" })
      .formatToParts(date)
      .map((p) => [p.type, Number(p.value)])
  );

/** Indian financial year (1 April to 31 March, India time) of a date: "2026-27" */
export function financialYear(date) {
  const { year, month } = istParts(date);
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** "QG/2026-27/0001": unique within the financial year and at most 16 characters, as GST rules require */
export const invoiceNumber = (fy, sequence) => `${INVOICE_PREFIX}/${fy}/${String(sequence).padStart(4, "0")}`;

/** "₹422.88", "$5.00": always two decimals, as on an invoice */
export const formatInvoiceAmount = (amount, currency) =>
  new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount / 100);

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const below100 = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
const below1000 = (n) =>
  [n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred` : "", n % 100 ? below100(n % 100) : ""].filter(Boolean).join(" ");

// Lakh and crore for rupees, thousand / million / billion otherwise
function wordsIndian(n) {
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 1e7);
  const parts = [
    crore ? `${wordsIndian(crore)} Crore` : "",
    Math.floor(n / 1e5) % 100 ? `${below100(Math.floor(n / 1e5) % 100)} Lakh` : "",
    Math.floor(n / 1e3) % 100 ? `${below100(Math.floor(n / 1e3) % 100)} Thousand` : "",
    below1000(n % 1000),
  ];
  return parts.filter(Boolean).join(" ");
}

function wordsInternational(n) {
  if (n === 0) return "Zero";
  const groups = [[1e9, "Billion"], [1e6, "Million"], [1e3, "Thousand"]];
  const parts = groups.map(([size, name]) => (Math.floor(n / size) % 1000 ? `${below1000(Math.floor(n / size) % 1000)} ${name}` : ""));
  return [...parts, below1000(n % 1000)].filter(Boolean).join(" ");
}

/** "Rupees Four Hundred Ninety-Nine Only", "US Dollars Four and Twenty-Four Cents Only" */
export function amountInWords(amount, currency) {
  const whole = Math.floor(amount / 100);
  const fraction = amount % 100;
  if (currency === "INR") return `Rupees ${wordsIndian(whole)}${fraction ? ` and ${below100(fraction)} Paise` : ""} Only`;
  const name = currency === "USD" ? "US Dollars" : currency;
  return `${name} ${wordsInternational(whole)}${fraction ? ` and ${below100(fraction)} Cents` : ""} Only`;
}
