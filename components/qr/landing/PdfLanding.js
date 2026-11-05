import { FaDownload, FaFilePdf } from "react-icons/fa6";
import { landingTheme } from "@/lib/qr/landingThemes";
import { fileDownloadUrl, fileUrl, formatFileSize } from "@/lib/qr/fileRules";
import LandingShell, { LandingButton, Part } from "./LandingShell";

// A drawn page, when there's no cover picture
function PaperSheet() {
  return (
    <span className="mx-auto block aspect-[3/4] w-full max-w-[11rem] rotate-[-2deg] rounded-xl bg-white p-4 shadow-2xl shadow-black/25" aria-hidden="true">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
        <FaFilePdf className="h-4 w-4" />
      </span>
      <span className="mt-4 block h-2 w-4/5 rounded-full bg-slate-300" />
      <span className="mt-3 block h-1.5 w-full rounded-full bg-slate-200" />
      <span className="mt-1.5 block h-1.5 w-full rounded-full bg-slate-200" />
      <span className="mt-1.5 block h-1.5 w-3/4 rounded-full bg-slate-200" />
      <span className="mt-4 block h-12 rounded-md bg-slate-100" />
      <span className="mt-3 block h-1.5 w-full rounded-full bg-slate-200" />
      <span className="mt-1.5 block h-1.5 w-2/3 rounded-full bg-slate-200" />
    </span>
  );
}

/**
 * "PDF" page: a cover (or a drawn page), the title and description, buttons to open and save the file, and an optional
 * button. Phones open a PDF far better in their own viewer than inside a page, so the page offers that rather than
 * embedding it. content: { file: { id, name, size }, title, cover, description, buttonText, buttonUrl, theme }.
 */
export default function PdfLanding({ content = {}, preview = false }) {
  const theme = landingTheme(content.theme);
  const file = content.file || {};
  const fileIcon = (Icon) => (
    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-black/5">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
  );

  return (
    <LandingShell themeId={content.theme} preview={preview}>
      <Part content={content} fields="cover">
        {content.cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL saved with the code
          <img src={content.cover} alt="" className="mx-auto w-full max-w-[13rem] rounded-xl object-cover shadow-2xl shadow-black/25" />
        ) : (
          <PaperSheet />
        )}
      </Part>

      <div className="mt-7 text-center">
        <Part content={content} fields="title">
          <h1 className="break-words font-display text-2xl font-bold tracking-tight">{content.title}</h1>
        </Part>
        {content.description && (
          <Part content={content} fields="description">
            <p className="mx-auto mt-2 max-w-sm whitespace-pre-line break-words text-[15px] leading-relaxed" style={{ color: theme.muted }}>
              {content.description}
            </p>
          </Part>
        )}
      </div>

      <Part content={content} fields="file" className="mt-7">
        <div className="space-y-3">
          <LandingButton
            href={file.id ? fileUrl(file.id) : null}
            preview={preview}
            themeId={content.theme}
            icon={fileIcon(FaFilePdf)}
            title="Open the PDF"
            subtitle={[file.name, file.size ? formatFileSize(file.size) : ""].filter(Boolean).join(" · ")}
          />
          <LandingButton href={file.id ? fileDownloadUrl(file.id) : null} preview={preview} themeId={content.theme} icon={fileIcon(FaDownload)} title="Save to my phone" />
        </div>
      </Part>

      {content.buttonUrl && (
        <Part content={content} fields={["buttonUrl", "buttonText"]} className="mt-3">
          <LandingButton href={content.buttonUrl} preview={preview} themeId={content.theme} title={content.buttonText || "Learn more"} />
        </Part>
      )}
    </LandingShell>
  );
}
