import { useState } from "react";
import { FaPlay, FaVimeoV, FaYoutube } from "react-icons/fa6";
import { landingTheme } from "@/lib/qr/landingThemes";
import { parseVideoUrl, videoEmbedUrl } from "@/lib/qr/qrContent";
import LandingShell, { LandingButton, Part } from "./LandingShell";

// The dummy video in the create page's preview until a link is added: a soft drawn scene with a progress bar
function SampleVideoScene() {
  return (
    <span className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500" aria-hidden="true">
      <span className="absolute right-10 top-5 h-10 w-10 rounded-full bg-white/40" />
      <svg className="absolute inset-x-0 bottom-0 h-3/5 w-full" viewBox="0 0 320 110" preserveAspectRatio="none">
        <path d="M0 80 80 25l50 40 60-45 130 70v20H0Z" fill="#fff" fillOpacity=".2" />
        <path d="M0 100 90 55l80 40 60-30 90 35v10H0Z" fill="#fff" fillOpacity=".3" />
      </svg>
      <span className="absolute inset-x-3 bottom-2.5 flex items-center gap-2 text-[10px] font-medium text-white/90">
        <span>0:42</span>
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
          <span className="block h-full w-1/3 rounded-full bg-white" />
        </span>
        <span>2:15</span>
      </span>
    </span>
  );
}

/**
 * "Video" page: a title, the video and an optional description and button. Until the visitor taps play it's only a
 * play card, so nothing is loaded from YouTube or Vimeo (no third-party cookies or requests) before they choose to watch.
 * content: { title, description, video: { provider, videoId, hash, url }, buttonText, buttonUrl, theme }; in the
 * create page's preview the pasted link is in videoUrl, with a YouTube video's picture on the card so its owner can
 * see the link is right, and a dummy video until there's a link.
 */
export default function VideoLanding({ content = {}, preview = false }) {
  const theme = landingTheme(content.theme);
  const [playing, setPlaying] = useState(false);
  const video = content.video || parseVideoUrl(content.videoUrl);
  const provider = video?.provider === "vimeo" ? { name: "Vimeo", icon: FaVimeoV } : { name: "YouTube", icon: FaYoutube };
  const ProviderIcon = provider.icon;
  const sample = !!content.__sample?.videoUrl;

  return (
    <LandingShell themeId={content.theme} preview={preview}>
      {content.title && (
        <Part content={content} fields="title">
          <h1 className="break-words text-center font-display text-2xl font-bold tracking-tight">{content.title}</h1>
        </Part>
      )}

      <Part content={content} fields="videoUrl" className="mt-6">
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/30 ring-1 ring-white/10">
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
              onClick={() => video && setPlaying(true)}
              className="group relative flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white"
              aria-label={`Play the video${content.title ? `: ${content.title}` : ""}`}
            >
              {sample && <SampleVideoScene />}
              {preview && video?.provider === "youtube" && (
                // eslint-disable-next-line @next/next/no-img-element -- only in the owner's own preview, never on the scan page
                <img src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl transition duration-300 group-hover:scale-110">
                <FaPlay className="ml-1 h-6 w-6" aria-hidden="true" />
              </span>
              {!sample && (
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
                  <ProviderIcon className="h-3 w-3" aria-hidden="true" />
                  {video ? `Plays from ${provider.name}` : "Paste a YouTube or Vimeo link"}
                </span>
              )}
              {sample && <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur">Sample video</span>}
            </button>
          )}
        </div>
      </Part>

      {content.description && (
        <Part content={content} fields="description">
          <p className="mt-5 whitespace-pre-line break-words text-center text-[15px] leading-relaxed" style={{ color: theme.muted }}>
            {content.description}
          </p>
        </Part>
      )}
      {content.buttonUrl && (
        <Part content={content} fields={["buttonUrl", "buttonText"]} className="mt-6">
          <LandingButton href={content.buttonUrl} preview={preview} themeId={content.theme} title={content.buttonText || "Learn more"} />
        </Part>
      )}
    </LandingShell>
  );
}
