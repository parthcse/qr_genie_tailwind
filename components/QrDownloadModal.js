// components/QrDownloadModal.js
// Modal for downloading QR codes with format and size selection
import { useState } from "react";
import { FaTimes, FaDownload, FaFileImage, FaFilePdf, FaPrint } from "react-icons/fa";
import { downloadDesignedQR } from "../lib/qrDownload";

export default function QrDownloadModal({ qrCode, onClose }) {
  const [selectedFormat, setSelectedFormat] = useState("png");
  const [selectedSize, setSelectedSize] = useState("default");
  const [downloading, setDownloading] = useState(false);

  if (!qrCode) return null;

  // Parse design config
  let designData = {};
  try {
    if (qrCode.designConfig) {
      designData = qrCode.designConfig;
    } else if (qrCode.meta) {
      const meta = typeof qrCode.meta === "string" ? JSON.parse(qrCode.meta) : qrCode.meta;
      if (meta && meta.designConfig) {
        designData = meta.designConfig;
      }
    }
  } catch (e) {
    console.error("Error parsing design config:", e);
  }

  // Fallback to basic colors
  if (!designData.patternColor && qrCode.qrColor) {
    designData.patternColor = qrCode.qrColor;
    designData.qrColor = qrCode.qrColor;
  }
  if (!designData.bgColor && qrCode.bgColor) {
    designData.bgColor = qrCode.bgColor;
  }

  // Get QR value (direct link for specific types, short link for others)
  const baseUrl = typeof window !== "undefined" 
    ? (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
    : "";
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const typesWithDirectLink = ["instagram", "whatsapp", "website", "wifi"];
  const qrValue = typesWithDirectLink.includes(qrCode.type?.toLowerCase())
    ? qrCode.targetUrl
    : `${cleanBaseUrl}/r/${qrCode.slug}`;

  const handleDownload = async () => {
    if (downloading) return;
    
    setDownloading(true);
    try {
      const filename = qrCode.name || "qr-code";
      
      // Debug logging
      console.log("QrDownloadModal - Downloading:", {
        qrCodeSlug: qrCode.slug,
        qrValue,
        designData,
        hasFrame: designData?.frameStyle && designData.frameStyle !== "none" && designData?.frameText,
        frameStyle: designData?.frameStyle,
        frameText: designData?.frameText,
        frameColor: designData?.frameColor,
      });
      
      await downloadDesignedQR(qrValue, designData, selectedFormat, selectedSize, filename);
      onClose();
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download QR code. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const formats = [
    { id: "png", label: "PNG", icon: FaFileImage },
    { id: "jpg", label: "JPEG", icon: FaFileImage },
    { id: "svg", label: "SVG", icon: FaFileImage },
    { id: "print", label: "Print", icon: FaPrint },
  ];

  const sizes = [
    { id: "default", label: "Default (1024x1024)" },
    { id: "large", label: "Large (2048x2048)" },
    { id: "xl", label: "XL (4096x4096)" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Select the format to download</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Format</label>
            <div className="grid grid-cols-2 gap-3">
              {formats.map((format) => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.id}
                    type="button"
                    onClick={() => setSelectedFormat(format.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                      selectedFormat === format.id
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{format.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selection (hidden for print) */}
          {selectedFormat !== "print" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">File Size</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {sizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaDownload className="w-4 h-4" />
            {downloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
