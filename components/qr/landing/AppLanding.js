import { FaApple, FaGooglePlay } from "react-icons/fa6";
import { landingTheme } from "@/lib/qr/landingThemes";
import LandingShell, { LandingButton } from "./LandingShell";

function StoreButton({ href, preview, icon: Icon, small, big }) {
  const body = (
    <>
      <Icon className="h-7 w-7 flex-none" aria-hidden="true" />
      <span className="text-left leading-tight">
        <span className="block text-[11px] font-medium opacity-80">{small}</span>
        <span className="block text-lg font-semibold">{big}</span>
      </span>
    </>
  );
  const className = "flex items-center justify-center gap-3 rounded-2xl bg-black px-5 py-3 text-white shadow-lg ring-1 ring-white/10 transition duration-300";
  return preview || !href ? (
    <span className={className}>{body}</span>
  ) : (
    <a href={href} rel="noopener noreferrer nofollow" className={`${className} hover:-translate-y-0.5 hover:shadow-xl`} style={{ color: "#ffffff" }}>
      {body}
    </a>
  );
}

/**
 * "App download" page: the app's icon, name and description with an App Store and a Google Play button. iPhones and
 * Android phones never see it: the scan page sends them straight to their store (lib/qr/qrContent.js, redirect).
 * content: { appName, avatar (the icon), description, ios, android, website, theme }.
 */
export default function AppLanding({ content = {}, preview = false }) {
  const theme = landingTheme(content.theme);
  const initials = (content.appName || "App").slice(0, 1).toUpperCase();
  const noStores = preview && !content.ios && !content.android;
  return (
    <LandingShell themeId={content.theme} preview={preview}>
      <div className="text-center">
        {content.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL saved with the code
          <img src={content.avatar} alt="" className="mx-auto h-24 w-24 rounded-[22%] object-cover shadow-xl" />
        ) : (
          <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-[22%] font-display text-4xl font-bold shadow-xl" style={{ background: theme.button, color: theme.buttonText }} aria-hidden="true">
            {initials}
          </span>
        )}
        <h1 className={`mt-5 break-words font-display text-2xl font-bold tracking-tight ${content.appName ? "" : "opacity-60"}`}>
          {content.appName || (preview ? "Your app" : "")}
        </h1>
        {content.description && (
          <p className="mx-auto mt-2 max-w-sm whitespace-pre-line break-words text-[15px] leading-relaxed" style={{ color: theme.muted }}>
            {content.description}
          </p>
        )}
      </div>

      <div className={`mt-8 space-y-3 ${noStores ? "opacity-60" : ""}`}>
        {(content.ios || noStores) && <StoreButton href={content.ios} preview={preview} icon={FaApple} small="Download on the" big="App Store" />}
        {(content.android || noStores) && <StoreButton href={content.android} preview={preview} icon={FaGooglePlay} small="Get it on" big="Google Play" />}
      </div>

      {content.website && (
        <div className="mt-6">
          <LandingButton href={content.website} preview={preview} themeId={content.theme} title="Visit our website" subtitle={content.website.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "")} />
        </div>
      )}
    </LandingShell>
  );
}
