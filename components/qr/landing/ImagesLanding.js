import { useEffect, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaXmark } from "react-icons/fa6";
import { landingTheme } from "@/lib/qr/landingThemes";
import { fileUrl } from "@/lib/qr/fileRules";
import LandingShell, { LandingButton, Part } from "./LandingShell";

// An uploaded photo's address; the preview's example photos carry their own picture
const photoSrc = (photo) => photo.src || fileUrl(photo.id);

/** Full-screen photos to swipe through (sideways scrolling that snaps), with arrows for mouse and keyboard */
function PhotoViewer({ photos, start, title, onClose }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(start);

  const goTo = (target) => {
    const track = trackRef.current;
    if (track) track.scrollTo({ left: target * track.clientWidth });
  };

  useEffect(() => {
    // Open on the photo that was tapped, without a slide
    if (trackRef.current) trackRef.current.scrollLeft = start * trackRef.current.clientWidth;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [start]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goTo(Math.min(photos.length - 1, index + 1));
      if (e.key === "ArrowLeft") goTo(Math.max(0, index - 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, photos.length, onClose]);

  const arrow = "absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 disabled:opacity-0 sm:flex";

  return (
    <div role="dialog" aria-modal="true" aria-label={title || "Photos"} className="fixed inset-0 z-50 bg-black">
      <div
        ref={trackRef}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
        className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
      >
        {photos.map((photo, i) => (
          <div key={photo.id || i} className="flex h-full w-full flex-none snap-center items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- the page owner's uploaded photo */}
            <img src={photoSrc(photo)} alt={`Photo ${i + 1} of ${photos.length}`} loading={Math.abs(i - start) < 2 ? "eager" : "lazy"} className="max-h-full max-w-full rounded-lg object-contain" />
          </div>
        ))}
      </div>
      <p className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium tabular-nums text-white backdrop-blur">
        {index + 1} / {photos.length}
      </p>
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30">
        <FaXmark className="h-5 w-5" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous photo" className={`${arrow} left-3`}>
        <FaChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => goTo(index + 1)} disabled={index === photos.length - 1} aria-label="Next photo" className={`${arrow} right-3`}>
        <FaChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * "Images" page: a title and description, the photos (the first one large) that open full screen when tapped, and an
 * optional button. content: { title, description, images: [{ id, name, size }], buttonText, buttonUrl, theme }.
 */
export default function ImagesLanding({ content = {}, preview = false }) {
  const theme = landingTheme(content.theme);
  const photos = content.images || [];
  const [open, setOpen] = useState(null);

  return (
    <LandingShell themeId={content.theme} preview={preview}>
      {content.title && (
        <Part content={content} fields="title">
          <h1 className="break-words text-center font-display text-2xl font-bold tracking-tight">{content.title}</h1>
        </Part>
      )}
      {content.description && (
        <Part content={content} fields="description">
          <p className="mx-auto mt-2 max-w-sm whitespace-pre-line break-words text-center text-[15px] leading-relaxed" style={{ color: theme.muted }}>
            {content.description}
          </p>
        </Part>
      )}

      <Part content={content} fields="images" className="mt-6">
        <ul className="grid grid-cols-2 gap-2.5">
          {photos.map((photo, i) => {
            const image = (
              // eslint-disable-next-line @next/next/no-img-element -- the page owner's uploaded photo
              <img src={photoSrc(photo)} alt={`Photo ${i + 1}`} loading={i < 3 ? "eager" : "lazy"} className="h-full w-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transform-none" />
            );
            return (
              <li key={photo.id || i} className={i === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"}>
                {preview ? (
                  <span className="group block h-full w-full overflow-hidden rounded-2xl shadow-lg shadow-black/10">{image}</span>
                ) : (
                  <button type="button" onClick={() => setOpen(i)} aria-label={`Open photo ${i + 1} of ${photos.length}`} className="group block h-full w-full cursor-pointer overflow-hidden rounded-2xl shadow-lg shadow-black/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60">
                    {image}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Part>

      {content.buttonUrl && (
        <Part content={content} fields={["buttonUrl", "buttonText"]} className="mt-6">
          <LandingButton href={content.buttonUrl} preview={preview} themeId={content.theme} title={content.buttonText || "Learn more"} />
        </Part>
      )}

      {open !== null && <PhotoViewer photos={photos} start={open} title={content.title} onClose={() => setOpen(null)} />}
    </LandingShell>
  );
}
