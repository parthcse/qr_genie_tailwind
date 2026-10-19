import { QRCodeSVG } from "qrcode.react";
import { FaCheck, FaLock, FaPaperPlane, FaWifi } from "react-icons/fa";
import { SITE_URL } from "@/lib/site";

// Banner colours for the website screen
const BANNERS = {
  indigo: "from-indigo-500 to-purple-500",
  amber: "from-amber-500 to-orange-500",
  emerald: "from-emerald-500 to-teal-500",
  sky: "from-sky-500 to-indigo-500",
};

/**
 * What a scanner sees for each QR type, drawn inside a phone frame (decorative). screen: optional texts so each
 * page can show its own example; without it the home page's café examples are used.
 * - website: { url, eyebrow, title, button, banner: "indigo" | "amber" | "emerald" | "sky" }
 * - wifi: { network }
 * - whatsapp: { name, initials, greeting, message }
 * - instagram: { handle, name, bio }
 */
export function TypeScreen({ type, screen = {} }) {
  if (type === "wifi") {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 px-4">
        <div className="w-full rounded-2xl bg-white p-4 text-center shadow-lg">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
            <FaWifi className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-900">Join &ldquo;{screen.network || "Cafe Guest"}&rdquo;?</p>
          <p className="mt-1 text-[11px] text-slate-500">WPA network · password included</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold">
            <span className="rounded-lg bg-slate-100 py-2 text-slate-600">Cancel</span>
            <span className="rounded-lg bg-cyan-700 py-2 text-white">Join</span>
          </div>
        </div>
        <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600">
          <FaCheck className="h-2.5 w-2.5 text-emerald-600" /> No password typing
        </p>
      </div>
    );
  }

  if (type === "whatsapp") {
    return (
      <div className="flex h-full flex-col bg-[#efeae2]">
        <div className="flex items-center gap-2.5 bg-[#075e54] px-3 pb-3 pt-8 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">{screen.initials || "YB"}</span>
          <div>
            <p className="text-xs font-semibold">{screen.name || "Your Business"}</p>
            <p className="text-[10px] text-white/80">online</p>
          </div>
        </div>
        <div className="flex-1 space-y-2 p-3">
          <div className="w-fit max-w-[85%] rounded-lg rounded-tl-none bg-white px-3 py-2 text-[11px] leading-snug text-slate-700 shadow-sm">
            {screen.greeting || "Hi! Thanks for scanning. How can we help?"}
          </div>
        </div>
        <div className="flex items-center gap-2 p-2">
          <div className="min-w-0 flex-1 rounded-full bg-white px-3 py-2 text-[11px] text-slate-700 shadow-sm">
            {screen.message || "Hi, I'd like to order a large pizza"}
          </div>
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#25d366] text-white">
            <FaPaperPlane className="h-3 w-3" />
          </span>
        </div>
      </div>
    );
  }

  if (type === "instagram") {
    return (
      <div className="flex h-full flex-col bg-white px-4 pb-4 pt-8">
        <p className="text-xs font-bold text-slate-900">{screen.handle || "yourbrand"}</p>
        <div className="mt-4 flex items-center gap-4">
          <span className="flex-none rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[3px]">
            <span className="block h-14 w-14 rounded-full border-2 border-white bg-gradient-to-br from-rose-100 to-purple-200" />
          </span>
          <div className="grid flex-1 grid-cols-3 text-center">
            {[["128", "posts"], ["4.2k", "followers"], ["312", "following"]].map(([n, l]) => (
              <div key={l}>
                <p className="text-xs font-bold text-slate-900">{n}</p>
                <p className="text-[9px] text-slate-500">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[11px] font-semibold text-slate-900">{screen.name || "Your Brand"}</p>
        <p className="text-[10px] text-slate-500">{screen.bio || "Handmade candles · Pune"}</p>
        <div className="mt-3 rounded-lg bg-[#0095f6] py-1.5 text-center text-[11px] font-semibold text-white">Follow</div>
        <div className="mt-4 grid grid-cols-3 gap-0.5">
          {["from-amber-200 to-rose-300", "from-purple-200 to-indigo-300", "from-rose-200 to-pink-300", "from-indigo-200 to-sky-300", "from-orange-200 to-amber-300", "from-pink-200 to-purple-300"].map((g) => (
            <span key={g} className={`aspect-square bg-gradient-to-br ${g}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="px-3 pb-2.5 pt-8">
        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] text-slate-600">
          <FaLock className="h-2 w-2 text-slate-400" />
          {screen.url || "yourcafe.com/menu"}
        </div>
      </div>
      <div className={`bg-gradient-to-br ${BANNERS[screen.banner] || BANNERS.indigo} px-4 py-5 text-white`}>
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/80">{screen.eyebrow || "Spring menu"}</p>
        <p className="mt-1 font-display text-lg font-bold leading-tight">{screen.title || "Fresh dishes, new every week"}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {["from-amber-200 to-orange-300", "from-emerald-200 to-teal-300"].map((g) => (
          <div key={g}>
            <span className={`block aspect-[4/3] rounded-lg bg-gradient-to-br ${g}`} />
            <span className="mt-1.5 block h-1.5 w-3/4 rounded-full bg-slate-200" />
            <span className="mt-1 block h-1.5 w-1/2 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="space-y-1.5 px-3">
        <span className="block h-1.5 w-full rounded-full bg-slate-100" />
        <span className="block h-1.5 w-5/6 rounded-full bg-slate-100" />
      </div>
      <div className="mt-auto p-3">
        <div className="rounded-xl bg-slate-900 py-2 text-center text-[11px] font-semibold text-white">{screen.button || "Book a table"}</div>
      </div>
    </div>
  );
}

/**
 * A phone showing the result of a scan, with a "Scan me" code beside it (decorative). children: extra floating
 * cards, positioned by the caller.
 */
export function PhonePreview({ type, screen, qrColor, className = "max-w-[13rem] sm:max-w-[16rem] lg:max-w-[17rem]", children }) {
  return (
    <div className={`relative mx-auto w-full ${className}`} aria-hidden="true">
      <div className="rounded-[2.5rem] bg-slate-900 p-2 shadow-2xl shadow-indigo-900/25 ring-1 ring-slate-900/10">
        <div className="relative aspect-[9/18] overflow-hidden rounded-[2rem] bg-white">
          <span className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
          <TypeScreen type={type} screen={screen} />
        </div>
      </div>
      <div className="absolute -left-10 bottom-12 hidden rounded-2xl bg-white p-3 shadow-xl shadow-indigo-900/10 ring-1 ring-slate-900/5 sm:block lg:-left-16">
        <QRCodeSVG value={SITE_URL} size={88} level="M" fgColor={qrColor} bgColor="#ffffff" />
        <p className="mt-2 text-center text-[11px] font-semibold text-slate-700">Scan me</p>
      </div>
      {children}
    </div>
  );
}
