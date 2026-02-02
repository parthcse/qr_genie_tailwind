// pages/pdf/[slug].js
import prisma from "../../lib/prisma";
import { FaEye } from "react-icons/fa";

export async function getServerSideProps({ params }) {
  const { slug } = params;

  const qr = await prisma.qRCode.findUnique({ where: { slug } });
  if (!qr || qr.type !== "pdf" || !qr.meta) {
    return { notFound: true };
  }

  let meta = {};
  try {
    meta = JSON.parse(qr.meta);
  } catch (e) {
    return { notFound: true };
  }

  return {
    props: {
      pdfUrl: meta.pdfUrl || "",
      title: meta.title || "PDF Document",
      description: meta.description || "",
      company: meta.company || "",
      website: meta.website || "",
      buttonText: meta.buttonText || "View PDF",
      thumbnail: meta.thumbnail || "",
      primaryColor: meta.primaryColor || "#B69EDF",
      secondaryColor: meta.secondaryColor || "#242420",
    },
  };
}

export default function PdfLandingPage({
  pdfUrl,
  title,
  description,
  company,
  website,
  buttonText,
  thumbnail,
  primaryColor,
  secondaryColor,
}) {
  const handleViewPdf = () => {
    window.open(pdfUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile-optimized container */}
      <div className="mx-auto max-w-md min-h-screen bg-white flex flex-col">
        {/* Header with gradient - matches reference */}
        <div
          className="px-6 pt-16 pb-8"
          style={{
            backgroundColor: primaryColor || "#B69EDF",
          }}
        >
          <div className="space-y-3">
            {company && (
              <p className="text-sm font-medium text-white/90">{company}</p>
            )}
            <h1 className="text-2xl font-bold text-white leading-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* Content Area with image and description */}
        <div className="flex-1 px-6 py-6">
          <div className="flex gap-4 items-start">
            {/* Thumbnail/Image on right */}
            <div className="flex-shrink-0 w-32 h-32">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={title}
                  className="w-full h-full object-cover rounded-lg shadow-md"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center shadow-md">
                  <svg
                    className="w-12 h-12 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Description text on left */}
            {description && (
              <div className="flex-1 space-y-2">
                {description.split("\n").map((line, idx) => (
                  <p key={idx} className="text-sm text-slate-600 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Website link if provided */}
          {website && (
            <div className="mt-4">
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            </div>
          )}
        </div>

        {/* Fixed bottom button - matches reference */}
        <div className="sticky bottom-0 px-6 pb-6 pt-4 bg-white border-t border-slate-100">
          <button
            onClick={handleViewPdf}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all"
            style={{
              backgroundColor: secondaryColor || "#242420",
            }}
          >
            <FaEye className="w-5 h-5" />
            <span>{buttonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
