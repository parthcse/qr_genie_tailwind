import { useRef, useState } from "react";
import { FaDownload, FaMusic, FaPause, FaPlay } from "react-icons/fa6";
import { landingTheme } from "@/lib/qr/landingThemes";
import { fileDownloadUrl, fileUrl } from "@/lib/qr/fileRules";
import LandingShell, { LandingButton, Part } from "./LandingShell";

const clock = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

/** Play button, a bar to seek and the times. Without a file (the preview's example) it's drawn, part way through. */
function Player({ src, title, themeId }) {
  const theme = landingTheme(themeId);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(src ? 0 : 84);
  const [duration, setDuration] = useState(src ? 0 : 225);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  };
  const seek = (value) => {
    if (audioRef.current) audioRef.current.currentTime = value;
    setTime(value);
  };

  return (
    <div className="rounded-2xl px-4 py-4 shadow-lg shadow-black/10" style={{ background: theme.button, color: theme.buttonText, border: `1px solid ${theme.buttonBorder}` }}>
      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />
      )}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={toggle}
          disabled={!src}
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
          className="flex h-12 w-12 flex-none items-center justify-center rounded-full shadow-md transition duration-200 enabled:cursor-pointer enabled:hover:scale-105 motion-reduce:transform-none"
          // The icon takes the button colour, unless that's see-through (Midnight)
          style={{ background: theme.buttonText, color: theme.button.startsWith("#") ? theme.button : "#0f172a" }}
        >
          {playing ? <FaPause className="h-4 w-4" aria-hidden="true" /> : <FaPlay className="ml-0.5 h-4 w-4" aria-hidden="true" />}
        </button>
        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(time, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            disabled={!src || !duration}
            aria-label="Position"
            className="block h-1.5 w-full cursor-pointer disabled:cursor-default"
            style={{ accentColor: theme.buttonText }}
          />
          <div className="mt-1.5 flex justify-between text-xs font-medium tabular-nums opacity-70">
            <span>{clock(time)}</span>
            <span>{clock(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * "MP3" page: a cover picture, title and artist, a player, and an optional description, download link and button.
 * content: { file: { id, name, size }, title, artist, cover, description, allowDownload, buttonText, buttonUrl, theme }.
 */
export default function AudioLanding({ content = {}, preview = false }) {
  const theme = landingTheme(content.theme);
  const src = content.file?.id ? fileUrl(content.file.id) : null;

  return (
    <LandingShell themeId={content.theme} preview={preview}>
      <Part content={content} fields="cover">
        {content.cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL saved with the code
          <img src={content.cover} alt="" className="mx-auto aspect-square w-full max-w-[15rem] rounded-3xl object-cover shadow-2xl shadow-black/25" />
        ) : (
          <span className="mx-auto flex aspect-square w-full max-w-[15rem] items-center justify-center rounded-3xl shadow-2xl shadow-black/25" style={{ background: theme.button, color: theme.buttonText, border: `1px solid ${theme.buttonBorder}` }} aria-hidden="true">
            <FaMusic className="h-16 w-16 opacity-50" />
          </span>
        )}
      </Part>

      <div className="mt-6 text-center">
        <Part content={content} fields="title">
          <h1 className="break-words font-display text-2xl font-bold tracking-tight">{content.title}</h1>
        </Part>
        {content.artist && (
          <Part content={content} fields="artist">
            <p className="mt-1 break-words text-sm font-semibold" style={{ color: theme.muted }}>
              {content.artist}
            </p>
          </Part>
        )}
      </div>

      <Part content={content} fields="file" className="mt-6">
        <Player key={src || "sample"} src={src} title={content.title || "the audio"} themeId={content.theme} />
      </Part>

      {content.description && (
        <Part content={content} fields="description">
          <p className="mt-5 whitespace-pre-line break-words text-center text-[15px] leading-relaxed" style={{ color: theme.muted }}>
            {content.description}
          </p>
        </Part>
      )}
      {content.allowDownload && (
        <Part content={content} fields="allowDownload" className="mt-5">
          <LandingButton
            href={src ? fileDownloadUrl(content.file.id) : null}
            preview={preview}
            themeId={content.theme}
            icon={
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-black/5">
                <FaDownload className="h-4 w-4" aria-hidden="true" />
              </span>
            }
            title="Download"
            subtitle={content.file?.name}
          />
        </Part>
      )}
      {content.buttonUrl && (
        <Part content={content} fields={["buttonUrl", "buttonText"]} className={content.allowDownload ? "mt-3" : "mt-5"}>
          <LandingButton href={content.buttonUrl} preview={preview} themeId={content.theme} title={content.buttonText || "Learn more"} />
        </Part>
      )}
    </LandingShell>
  );
}
