import { useState } from "react";
import { FaPlay, FaVimeoV, FaYoutube } from "react-icons/fa6";
import { landingTheme } from "@/lib/qr/landingThemes";
import { parseVideoUrl, videoEmbedUrl } from "@/lib/qr/qrContent";
import LandingShell, { LandingButton } from "./LandingShell";

/**
 * "Video" page: a title, the video and an optional description and button. Until the visitor taps play it's only a
 * play card, so nothing is loaded from YouTube or Vimeo (no third-party cookies or requests) before they choose to watch.
 * content: { title, description, video: { provider, videoId, hash, url }, buttonText, buttonUrl, theme }; in the
 * create page's preview the pasted link is in videoUrl.
 */
export default function VideoLanding({ content = {}, preview = false }) {
  const theme = landingTheme(content.theme);
  const [playing, setPlaying] = useState(false);
  const video = content.video || parseVideoUrl(content.videoUrl);
  const provider = video?.provider === "vimeo" ? { name: "Vimeo", icon: FaVimeoV } : { name: "YouTube", icon: FaYoutube };
  const ProviderIcon = provider.icon;

  return (
    <LandingShell themeId={content.theme} preview={preview}>
      <h1 className={`break-words text-center font-display text-2xl font-bold tracking-tight ${content.title ? "" : "opacity-60"}`}>
        {content.title || (preview ? "Your video" : "")}
      </h1>

      <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/30 ring-1 ring-white/10">
        {playing && video ? (
          <iframe
            src={videoEmbedUrl(video)}
            title={content.title || "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => !preview && video && setPlaying(true)}
            className="group relative flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white"
            aria-label={`Play the video${content.title ? `: ${content.title}` : ""}`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl transition duration-300 group-hover:scale-110">
              <FaPlay className="ml-1 h-6 w-6" aria-hidden="true" />
            </span>
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur">
              <ProviderIcon className="h-3 w-3" aria-hidden="true" />
              {video ? `Plays from ${provider.name}` : "Paste a YouTube or Vimeo link"}
            </span>
          </button>
        )}
      </div>

      {content.description && (
        <p className="mt-5 whitespace-pre-line break-words text-center text-[15px] leading-relaxed" style={{ color: theme.muted }}>
          {content.description}
        </p>
      )}
      {content.buttonUrl && (
        <div className="mt-6">
          <LandingButton href={content.buttonUrl} preview={preview} themeId={content.theme} title={content.buttonText || "Learn more"} />
        </div>
      )}
    </LandingShell>
  );
}
