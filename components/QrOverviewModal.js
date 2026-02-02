// components/QrOverviewModal.js
import { useEffect, useRef, useState } from "react";
import { FaTimes, FaDownload, FaInfoCircle, FaExternalLinkAlt, FaGlobe, FaWifi, FaAddressCard, FaMusic, FaFilePdf, FaLink, FaBuilding, FaVideo, FaImages, FaFacebook, FaInstagram, FaShareAlt, FaWhatsapp, FaUtensils, FaMobileAlt, FaTicketAlt, FaQrcode } from "react-icons/fa";
import Link from "next/link";
import DesignedQRCode, { createQRConfig } from "./DesignedQRCode";
import { downloadDesignedQR } from "../lib/qrDownload";

// QR Type icon mapping
const getTypeIcon = (type) => {
  const iconMap = {
    website: FaGlobe,
    wifi: FaWifi,
    whatsapp: FaWhatsapp,
    instagram: FaInstagram,
    pdf: FaFilePdf,
    vcard: FaAddressCard,
    links: FaLink,
    business: FaBuilding,
    video: FaVideo,
    images: FaImages,
    facebook: FaFacebook,
    social: FaShareAlt,
    mp3: FaMusic,
    menu: FaUtensils,
    apps: FaMobileAlt,
    coupon: FaTicketAlt,
  };
  return iconMap[type?.toLowerCase()] || FaQrcode;
};

export default function QrOverviewModal({ qrCode, onClose }) {
  const qrRef = useRef(null);
  const [downloadFormat, setDownloadFormat] = useState("png");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  
  if (!qrCode) return null;

  // Parse design config from meta or use defaults
  let designData = {};
  try {
    // Try to get designConfig from direct property first (from API)
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

  // Fallback to basic colors if no design config
  if (!designData.patternColor && qrCode.qrColor) {
    designData.patternColor = qrCode.qrColor;
    designData.qrColor = qrCode.qrColor;
  }
  if (!designData.bgColor && qrCode.bgColor) {
    designData.bgColor = qrCode.bgColor;
  }
  
  // Get base URL - use consistent base URL (environment variable if available)
  const baseUrl = typeof window !== "undefined" 
    ? (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
    : (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "");
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");

  // For Instagram, WhatsApp, Website, and WiFi: use direct targetUrl
  // For other types: use short link for analytics tracking
  const typesWithDirectLink = ["instagram", "whatsapp", "website", "wifi"];
  const qrValue = typesWithDirectLink.includes(qrCode.type?.toLowerCase())
    ? qrCode.targetUrl  // Use direct link for these types
    : `${cleanBaseUrl}/r/${qrCode.slug}`; // Use short link for other types
  
  // Download handler - uses shared download utility for consistency
  const handleDownload = async (format = "png") => {
    try {
      const filename = qrCode.name || "qr-code";
      await downloadDesignedQR(qrValue, designData, format, "default", filename);
      setShowDownloadModal(false);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download QR code. Please try again.");
    }
  };

  // Format dates
  const createdDate = new Date(qrCode.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const modifiedDate = new Date(qrCode.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Get destination URL (for display purposes)
  const destinationUrl = qrCode.type === "wifi" 
    ? "Wi-Fi Network" 
    : qrCode.targetUrl || `${cleanBaseUrl}/r/${qrCode.slug}`;
  
  const shortLink = `${cleanBaseUrl}/r/${qrCode.slug}`;

  // Get type icon
  const TypeIcon = getTypeIcon(qrCode.type);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-xl font-semibold text-gray-900">QR Code Overview</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* QR Code Display */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <DesignedQRCode
                value={qrValue}
                designData={designData}
                size={300}
                showFrame={true}
              />
            </div>

            {/* QR Code Details */}
            <div className="flex-1 min-w-0">
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Name</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {qrCode.name || `QR Code #${qrCode.id}`}
                  </p>
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Type</label>
                  <div className="flex items-center gap-2 mt-1">
                    <TypeIcon className="w-5 h-5 text-gray-600" />
                    <p className="text-sm text-gray-900">
                      {qrCode.type || "Website"}
                    </p>
                  </div>
                </div>

                {/* Destination */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Destination</label>
                  <div className="mt-1">
                    {qrCode.type === "wifi" ? (
                      <p className="text-sm text-gray-900">{destinationUrl}</p>
                    ) : (
                      <div className="space-y-1">
                        <a
                          href={destinationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 break-all"
                        >
                          {destinationUrl}
                          <FaExternalLinkAlt className="w-3 h-3 flex-shrink-0" />
                        </a>
                        {/* Hide short link for website, wifi, instagram, whatsapp */}
                        {!["website", "wifi", "instagram", "whatsapp"].includes(qrCode.type?.toLowerCase()) && (
                          <p className="text-xs text-gray-500">Short link: {shortLink}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Folder */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Folder</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {qrCode.folder?.name || "No folder"}
                  </p>
                </div>

                {/* Created Date */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Created</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {createdDate}
                  </p>
                </div>

                {/* Modified Date */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Last Modified</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {modifiedDate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Link
            href={`/dashboard/analytics?qr=${qrCode.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FaInfoCircle className="w-4 h-4" />
            View Details
          </Link>
          <button
            type="button"
            onClick={() => setShowDownloadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaDownload className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {/* Download Format Selection Modal */}
      {showDownloadModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDownloadModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Download Format</h3>
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDownloadFormat("png");
                    handleDownload("png");
                  }}
                  className="px-4 py-3 border-2 border-gray-200 hover:border-gray-300 rounded-lg font-medium text-gray-700 transition-colors"
                >
                  PNG
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDownloadFormat("jpg");
                    handleDownload("jpg");
                  }}
                  className="px-4 py-3 border-2 border-gray-200 hover:border-gray-300 rounded-lg font-medium text-gray-700 transition-colors"
                >
                  JPG
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDownloadFormat("jpeg");
                    handleDownload("jpeg");
                  }}
                  className="px-4 py-3 border-2 border-gray-200 hover:border-gray-300 rounded-lg font-medium text-gray-700 transition-colors"
                >
                  JPEG
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDownloadFormat("pdf");
                    handleDownload("pdf");
                  }}
                  className="px-4 py-3 border-2 border-gray-200 hover:border-gray-300 rounded-lg font-medium text-gray-700 transition-colors"
                >
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
