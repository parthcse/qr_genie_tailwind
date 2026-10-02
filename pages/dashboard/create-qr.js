// pages/dashboard/create-qr.js

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardLayout";
import DynamicForm from "../../components/qrFields/DynamicForm";
import { getSchemaForType } from "../../lib/qrSchemas";
import { createQRConfig } from "../../components/DesignedQRCode";
import { downloadDesignedQR } from "../../lib/qrDownload";
import { prepareLogo, MAX_IMAGE_LABEL } from "../../lib/imageUpload";
import { toPng, toJpeg, toSvg, toBlob } from "html-to-image";
import { jsPDF } from "jspdf";

// Server-side authentication check
export async function getServerSideProps(context) {
  const { getUserFromRequest, accountRedirect } = await import('../../lib/auth');
  const user = await getUserFromRequest(context.req);
  // Signed out -> login; email not confirmed yet -> verification page
  const redirect = accountRedirect(user);
  if (redirect) return redirect;
  return {
    props: {},
  };
}

// Dynamically import QRCodeSVG to avoid SSR issues
const QRCodeSVG = dynamic(() => import("qrcode.react").then((mod) => mod.QRCodeSVG), {
  ssr: false,
  loading: () => <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg"></div>
});

// Dynamically import QRCodeStyling for advanced customization
let QRCodeStyling = null;
if (typeof window !== "undefined") {
  import("qr-code-styling").then((mod) => {
    QRCodeStyling = mod.default;
  });
}

// QR Scanning Preloader Component
const QRScanningPreloader = ({ message = "Scanning QR Code..." }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="relative">
        {/* Main Preloader Icon */}
        <div className="flex items-center gap-3 mb-1 animate-pulse">
          {/* Left: Hollow square with dot */}
          <div className="relative">
            <div className="w-14 h-14 border-2 border-slate-700 rounded-sm flex items-center justify-center" style={{ borderWidth: '3px' }}>
              <div className="w-2.5 h-2.5 bg-slate-700 rounded-full animate-ping"></div>
            </div>
          </div>
          {/* Right: Solid filled square */}
          <div className="w-14 h-14 bg-slate-700 rounded-sm"></div>
        </div>
        
        {/* Reflection Effect */}
        <div className="flex items-center gap-3 opacity-25" style={{ transform: 'scaleY(-1)', filter: 'blur(1px)' }}>
          <div className="relative">
            <div className="w-14 h-14 border-2 border-slate-400 rounded-sm flex items-center justify-center" style={{ borderWidth: '3px' }}>
              <div className="w-2.5 h-2.5 bg-slate-400 rounded-full"></div>
            </div>
          </div>
          <div className="w-14 h-14 bg-slate-400 rounded-sm"></div>
        </div>
      </div>
      
      {/* Loading Text */}
      <p className="mt-5 text-sm text-slate-600 font-medium">{message}</p>
    </div>
  );
};
import {
  FaQrcode,
  FaGlobe,
  FaFilePdf,
  FaAddressCard,
  FaLink,
  FaBuilding,
  FaVideo,
  FaImages,
  FaFacebook,
  FaInstagram,
  FaShareAlt,
  FaWhatsapp,
  FaMusic,
  FaUtensils,
  FaMobileAlt,
  FaTicketAlt,
  FaWifi,
  FaLock,
  FaFolder,
  FaQuestionCircle,
  FaChevronDown,

  FaChevronUp,
  FaEye,
  FaEnvelope,
  FaDollarSign,
  FaChartBar,
  FaSearch,
  FaCog,
  FaPhone,
  FaMapMarkerAlt,
  FaTwitter,
  FaLinkedin,
  FaYoutube,
  FaTiktok,
  FaPinterest,
  FaSnapchat,
  FaUpload,
  FaTrash,
  FaImage,
  FaPalette,
  FaDownload,
  FaTimes,
  FaFileImage,
  FaPrint,
  FaEllipsisV,
  FaMicrophone,
  FaPaperclip,
  FaCamera,
  FaCheck,
  FaCheckCircle,
  FaArrowLeft,
  FaArrowRight,
  FaCopy,
  FaPlus,
  FaExclamationTriangle,
  FaInfoCircle,
  FaLightbulb,
} from "react-icons/fa";

// QR Type definitions with icons and field schemas
const qrTypes = [
  {
    id: "website",
    label: "Website",
    description: "Open any web page",
    hint: "Editable link, scan stats, optional password",
    icon: FaGlobe,
    active: true,
    color: "indigo"
  },
  {

    id: "wifi",
    label: "WiFi",
    description: "Join a Wi-Fi network in one scan",
    hint: "No typing passwords",
    icon: FaWifi,
    active: true,
    color: "cyan"
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    description: "Start a WhatsApp chat with you",
    hint: "Optional pre-filled message",
    icon: FaWhatsapp,
    active: true,
    color: "emerald"
  },
  {

    id: "instagram",
    label: "Instagram",
    description: "Open your Instagram profile",
    hint: "Grow your followers",
    icon: FaInstagram,
    active: true,
    color: "pink"
  },
  {

    id: "pdf",
    label: "PDF",
    description: "Show a PDF file",
    icon: FaFilePdf,
    active: false,
    color: "red"
  },
  {
    id: "vcard",
    label: "vCard",
    description: "Share a digital business card",
    icon: FaAddressCard,
    active: false,
    color: "blue"
  },
  {
    id: "links",
    label: "List of Links",
    description: "Share multiple links",
    icon: FaLink,
    active: false,
    color: "purple"
  },
  {
    id: "business",
    label: "Business",
    description: "Share info about your business",
    icon: FaBuilding,
    active: false,
    color: "slate"
  },
  {
    id: "video",
    label: "Video",
    description: "Show a video",
    icon: FaVideo,
    active: false,
    color: "pink"
  },
  {
    id: "images",
    label: "Images",
    description: "Show multiple images",
    icon: FaImages,
    active: false,
    color: "emerald"
  },
  {
    id: "facebook",
    label: "Facebook",
    description: "Share your Facebook page",
    icon: FaFacebook,
    active: false,
    color: "blue"
  },
  {
    id: "social",
    label: "Social Media",
    description: "Share social channels",
    icon: FaShareAlt,

    active: false,
    color: "indigo"
  },
  {
    id: "mp3",
    label: "MP3",
    description: "Share an audio file",
    icon: FaMusic,

    active: false,
    color: "yellow"
  },
  {
    id: "menu",
    label: "Menu",
    description: "Create a restaurant menu",
    icon: FaUtensils,

    active: false,
    color: "orange"
  },
  {
    id: "apps",
    label: "Apps",
    description: "Redirect to an app store",
    icon: FaMobileAlt,

    active: false,
    color: "slate"
  },
  {
    id: "coupon",
    label: "Coupon",
    description: "Share a coupon",
    icon: FaTicketAlt,

    active: false,
    color: "amber"
  },
];

// Icon colours for the released QR types
const TYPE_ACCENTS = {
  website: "bg-sky-50 text-sky-600",
  wifi: "bg-cyan-50 text-cyan-600",
  whatsapp: "bg-emerald-50 text-emerald-600",
  instagram: "bg-pink-50 text-pink-600",
};

// Helper function to generate preview URL based on QR type and form data
const generatePreviewUrl = (qrType, formData) => {
  if (!qrType) return null;

  const baseUrl = typeof window !== "undefined" 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://qr-genie.co";

  switch (qrType) {
    case "website":
      return formData.url || "https://example.com";
    case "pdf":
      // If directShow is enabled, return PDF URL directly
      if (formData.directShow && (formData.pdfUrl || formData.url)) {
        return formData.pdfUrl || formData.url;
      }
      // Otherwise, return PDF URL for preview (will show landing page in preview)
      return formData.pdfUrl || formData.url || "https://example.com/document.pdf";
    case "vcard":
      // For vCard, we'll show a preview URL (actual vCard would be generated server-side)
      return formData.vcard?.firstName 
        ? `${baseUrl}/api/vcard/preview` 
        : `${baseUrl}/api/vcard/preview`;
    case "links":
      return formData.links?.buttons?.[0]?.url || "https://example.com";
    case "business":
      return formData.business?.website || "https://example.com";
    case "video":
      return formData.videoUrl || "https://example.com/video";
    case "whatsapp":
      const countryCode = formData.whatsapp?.countryCode || "+91";
      const phone = formData.whatsapp?.phone || "";
      // Remove any spaces, dashes, or parentheses from phone number
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
      const fullPhone = countryCode + cleanPhone;
      const message = encodeURIComponent(formData.whatsapp?.message || "");
      if (!fullPhone || fullPhone === countryCode) {
        return "https://wa.me/";
      }
      return `https://wa.me/${fullPhone}${message ? `?text=${message}` : ""}`;
    case "facebook":
      return formData.social?.facebook || "https://facebook.com/example";
    case "instagram":
      const instagramUsername = formData.instagram?.username || "";
      // Remove @ if user included it
      const cleanUsername = instagramUsername.replace(/^@/, "").trim();
      if (!cleanUsername) {
        return "https://instagram.com/";
      }
      return `https://instagram.com/${cleanUsername}/`;
    case "wifi":
      // Build WiFi QR code payload in the correct format: WIFI:T:<encryption>;S:<network_name>;P:<password>;H:<hidden_flag>;
      const wifiData = formData.wifi || {};
      const ssid = wifiData.ssid || "";
      const password = wifiData.password || "";
      const security = wifiData.security || "WPA";
      const hidden = wifiData.hidden || false;
      
      // If no SSID, return placeholder
      if (!ssid.trim()) {
        return "WIFI:T:WPA;S:;P:;H:false;";
      }
      
      // Map WPA-EAP to WPA in the QR string (as per spec)
      const encryptionType = security === "WPA-EAP" ? "WPA" : security;
      
      // Build the WiFi string
      let wifiString = `WIFI:T:${encryptionType};S:${ssid};`;
      
      // Add password only if encryption is not "nopass"
      if (encryptionType !== "nopass") {
        wifiString += `P:${password};`;
      }
      
      // Add hidden flag
      wifiString += `H:${hidden ? "true" : "false"};`;
      
      return wifiString;
    default:
      return "https://example.com";
  }
};

// Custom QR Component that uses design config
// Note: createQRConfig is now imported from DesignedQRCode component for consistency

const StyledQRCode = ({ value, designData, size = 200 }) => {
  const qrRef = React.useRef(null);
  const [QRCodeStylingClass, setQRCodeStylingClass] = useState(null);
  const [qrInstance, setQrInstance] = useState(null);

  useEffect(() => {
    // Dynamically import qr-code-styling only on client side
    // qr-code-styling exports a class as default export that must be instantiated with 'new'
    if (typeof window !== "undefined") {
      import("qr-code-styling").then((module) => {
        // The default export is the QRCodeStyling class constructor
        setQRCodeStylingClass(() => module.default);
      }).catch((err) => {
        console.warn("qr-code-styling not available, using fallback:", err);
      });
    }
  }, []);

  useEffect(() => {
    // Cleanup previous QR instance
    if (qrInstance && qrRef.current) {
      qrRef.current.innerHTML = "";
    }

    if (!QRCodeStylingClass || !qrRef.current || !value) {
      return;
    }

    // Use shared config function
    const qrConfig = createQRConfig(size, value, designData);

    try {
      const qrCode = new QRCodeStylingClass(qrConfig);

      // Store instance for cleanup
      setQrInstance(qrCode);

      // Clear previous QR code
      qrRef.current.innerHTML = "";
      
      // Append QR code to DOM
      qrCode.append(qrRef.current);
    } catch (error) {
      console.error("Error creating styled QR code:", error);
    }

    // Cleanup function
    return () => {
      if (qrRef.current) {
        qrRef.current.innerHTML = "";
      }
      setQrInstance(null);
    };
  }, [QRCodeStylingClass, value, designData, size]);

  // Fallback to QRCodeSVG if qr-code-styling is not available
  if (!QRCodeStylingClass) {
    const patternColor = designData?.patternUseGradient
      ? designData.patternColor1 || designData.patternColor || "#000000"
      : designData?.patternColor || designData?.qrColor || "#000000";
    
    // For transparent background, use null or undefined instead of "transparent" string
    // QRCodeSVG should handle null/undefined for transparent backgrounds
    const isTransparentBg = designData?.patternBgTransparent || designData?.bgTransparent;
    const bgColor = isTransparentBg
      ? null
      : designData?.patternBgUseGradient || designData?.useGradientBg
        ? designData.patternBgColor1 || designData.bgColor1 || designData.bgColor || "#ffffff"
        : designData?.patternBgColor || designData?.bgColor || "#ffffff";

    return (
      <QRCodeSVG
        value={value}
        size={size}
        level={designData?.logo ? "H" : "M"}
        bgColor={bgColor}
        fgColor={patternColor}
        imageSettings={designData?.logo ? {
          src: designData.logo,
          height: designData.logoSize || 40,
          width: designData.logoSize || 40,
          excavate: true,
        } : undefined}
      />
    );
  }

  return <div ref={qrRef} className="flex items-center justify-center" />;
};

// Mobile Preview Component
const MobilePreview = ({ qrType, formData, designData, previewMode = "destination", qrCodeUrl, qrPreviewRef }) => {
  // State to store image previews for uploaded files
  const [imagePreviews, setImagePreviews] = useState({});
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  
  // Convert File objects to data URLs for preview - Profile Image
  useEffect(() => {
    if (qrType === "links" && formData?.links?.profileImage) {
      if (formData.links.profileImage instanceof File) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImagePreview(reader.result);
        };
        reader.readAsDataURL(formData.links.profileImage);
      } else if (typeof formData.links.profileImage === "string" && formData.links.profileImage.startsWith("data:image")) {
        setProfileImagePreview(formData.links.profileImage);
      } else {
        setProfileImagePreview(null);
      }
    } else {
      setProfileImagePreview(null);
    }
  }, [qrType, formData?.links?.profileImage]);
  
  // Convert File objects to data URLs for preview - Button Icons
  useEffect(() => {
    if (qrType === "links" && formData?.links?.buttons) {
      const newPreviews = {};
      formData.links.buttons.forEach((button, index) => {
        if (button.icon instanceof File) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreviews(prev => ({
              ...prev,
              [`button-${index}`]: reader.result
            }));
          };
          reader.readAsDataURL(button.icon);
        } else if (typeof button.icon === "string" && button.icon.startsWith("data:image")) {
          newPreviews[`button-${index}`] = button.icon;
        }
      });
      if (Object.keys(newPreviews).length > 0) {
        setImagePreviews(prev => ({ ...prev, ...newPreviews }));
      }
    }
  }, [qrType, formData?.links?.buttons]);

  const renderPreview = () => {
    if (previewMode === "qr") {
      // Show real QR code with blueprint/design
      if (qrCodeUrl) {
        // Determine colors based on design data
        const patternColor = designData?.patternUseGradient
          ? designData.patternColor1 || designData.patternColor || "#000000"
          : designData?.patternColor || designData?.qrColor || "#000000";
        
        // Base background color
        const baseBgColor = designData?.patternBgColor || designData?.bgColor || "#ffffff";
        
        const bgColor = designData?.patternBgTransparent || designData?.bgTransparent
          ? "transparent"
          : designData?.patternBgUseGradient || designData?.useGradientBg
            ? (designData.patternBgColor1 || designData.bgColor1 || baseBgColor)
            : baseBgColor;
        
        // When gradient is enabled, ensure both colors are set (use base color as fallback)
        const bgGradient = (designData?.patternBgUseGradient || designData?.useGradientBg) && !(designData?.patternBgTransparent || designData?.bgTransparent)
          ? `linear-gradient(135deg, ${designData.patternBgColor1 || designData.bgColor1 || baseBgColor}, ${designData.patternBgColor2 || designData.bgColor2 || baseBgColor})`
          : null;

        // Frame wrapper styles
        const getFrameStyles = () => {
          if (designData?.frameStyle === "none") return {};
          
          // Frame Color always controls border color only (no gradient support)
          const frameBorderColor = designData?.frameColor || "#000000";
          
          // Frame Background controls the background inside the frame
          const frameBg = designData?.frameBgTransparent
            ? "transparent"
            : designData?.frameBgUseGradient
              ? `linear-gradient(135deg, ${designData.frameBgColor1 || "#ffffff"}, ${designData.frameBgColor2 || "#ffffff"})`
              : designData?.frameBgColor || "#ffffff";
          
          return {
            border: `4px solid ${frameBorderColor}`,
            background: frameBg,
            backgroundImage: designData?.frameBgUseGradient ? frameBg : undefined,
            padding: designData?.frameStyle !== "none" ? "16px" : "0",
            borderRadius: designData?.frameStyle === "bubble" ? "24px" : 
                         designData?.frameStyle === "badge" ? "12px" :
                         designData?.frameStyle === "tag" ? "8px 8px 8px 0" : "8px",
          };
        };

        return (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-50 to-slate-100 p-6" data-qr-preview>
            {/* QR Code Display with Frame */}
            <div className="relative">
              <div
                ref={qrPreviewRef}
                className="flex flex-col items-center justify-center shadow-xl relative"
                style={getFrameStyles()}
              >
                {/* Frame Text (if applicable) */}
                {designData?.frameStyle !== "none" && designData?.frameText && (
                  <div className="mb-2">
                    <span 
                      className="text-sm font-semibold px-3 py-1 rounded block"
                      style={{
                        color: designData?.frameTextColor || designData?.frameColor || "#000000",
                        background: designData?.frameBgTransparent ? "transparent" : 
                                    designData?.frameBgUseGradient ? 
                                      `linear-gradient(135deg, ${designData.frameBgColor1 || "#ffffff"}, ${designData.frameBgColor2 || "#ffffff"})` :
                                      designData?.frameBgColor || "#ffffff",
                      }}
                    >
                      {designData.frameText}
                    </span>
                  </div>
                )}
                
                {/* QR Code */}
                <div
                  className="rounded-lg flex items-center justify-center p-4"
                  style={{
                    background: bgGradient || bgColor,
                  }}
                >
                  <StyledQRCode
                    value={qrCodeUrl}
                    designData={designData}
                    size={200}
                  />
                </div>
              </div>
            </div>
            
            {/* Scan Hint */}
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500">Scan to test your QR code</p>
            </div>
          </div>
        );
      } else {
        // Show branded placeholder when no QR code is available
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
            <div className="text-center max-w-xs">
              {/* QR Genie Logo/Brand */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  {/* QR Code Icon Style Logo */}
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <div className="grid grid-cols-3 gap-1 p-2">
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                      <div className="w-3 h-3 bg-indigo-700 rounded-sm"></div>
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                    </div>
                  </div>
                  {/* Sparkle effect */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>
              </div>
              
              {/* Brand Name */}
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                QR Genie
              </h3>
              
              {/* Tagline */}
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Create beautiful, dynamic QR codes in seconds
              </p>
              
              {/* Feature Highlights */}
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  <span>Customize colors & styles</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Add logos & frames</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                  <span>Track scans & analytics</span>
                </div>
              </div>
              
              {/* CTA Hint */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-400 italic">
                  Complete the form to see your QR code preview
                </p>
              </div>
            </div>
          </div>
        );
      }
    }

    // Destination preview based on type
    const previewUrl = generatePreviewUrl(qrType, formData);
    
    switch (qrType) {
      case "website":
        // Get website data from formData
        const websiteUrl = formData.url || "";
        const websiteName = formData.name || "";
        const passwordEnabled = formData.passwordEnabled || false;
        
        // Extract domain from URL
        const extractDomain = (url) => {
          if (!url) return "your-website.com";
          try {
            // Remove protocol
            let domain = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
            // Remove path and query params
            domain = domain.split("/")[0].split("?")[0];
            // Remove trailing slash
            domain = domain.replace(/\/$/, "");
            return domain || "your-website.com";
          } catch (e) {
            return "your-website.com";
          }
        };
        
        const domain = extractDomain(websiteUrl);
        const displayUrl = websiteUrl || "https://your-website.com";
        
        // Main title: use name if provided, otherwise use domain, fallback to "Your website title"
        const mainTitle = websiteName || domain || "Your website title";
        
        return (
          <div className="h-full pt-2 pb-1 bg-white flex flex-col">
            {/* Safari Toolbar */}
            <div className="bg-white  border-b border-gray-200 flex-shrink-0">
              {/* Safari Navigation Bar */}
              <div className="px-3 py-2 flex items-center gap-2">
                {/* Back Button (disabled/grayed) */}
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" disabled>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Forward Button (disabled/grayed) */}
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" disabled>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Safari Address Bar */}
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-full px-4 py-2 flex items-center gap-2 border border-gray-200">
                    {/* Lock Icon or Globe Icon */}
                    {passwordEnabled ? (
                      <FaLock className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                    ) : (
                      <svg className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                    
                    {/* URL Text */}
                    <span className="text-xs text-gray-700 font-medium truncate flex-1">
                      {domain}
                    </span>
                    
                    {/* Refresh/Stop Icon */}
                    <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                </div>
                
                {/* Share Button */}
                <button className="w-8 h-8 flex items-center justify-center rounded-full">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                
                {/* Tabs Button */}
                <button className="w-8 h-8 flex items-center justify-center rounded-full">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Website Content Area (a password screen first when protection is on) */}
            {passwordEnabled ? (
              <div className="flex flex-1 flex-col items-center justify-center overflow-auto bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
                  <FaLock className="h-6 w-6" />
                </div>
                <p className="text-base font-bold text-gray-900">This QR code is protected</p>
                <p className="mt-1 text-xs text-gray-500">Enter the password you were given to continue.</p>
                <div className="mt-5 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-left text-sm leading-10 tracking-widest text-gray-400">
                  {formData.password ? "•".repeat(Math.min(formData.password.length, 16)) : "Password"}
                </div>
                <div className="mt-2 h-10 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-semibold leading-10 text-white">
                  Continue
                </div>
                <p className="mt-4 text-[11px] text-gray-400">Then they're sent to {domain}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto bg-white">
                <div className="px-6 py-8 max-w-sm mx-auto">
                  {/* Main Title */}
                  <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                      {mainTitle}
                    </h1>
                  </div>

                  {/* Description Placeholder */}
                  <div className="mb-6 space-y-3">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Welcome to our website. Discover amazing content and stay connected with us.
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Explore our services and learn more about what we offer.
                    </p>
                  </div>

                  {/* Sample Content Blocks */}
                  <div className="mt-8 space-y-4">
                    <div className="h-32 bg-gray-100 rounded-lg"></div>
                    <div className="h-24 bg-gray-50 rounded-lg"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Safari Bottom Navigation Bar */}
            <div className="bg-white border-t border-gray-200 flex-shrink-0 relative">
              <div className="px-3 py-2 flex items-center justify-between" style={{ 
                minHeight: '34px',
                paddingBottom: 'max(6px, calc(env(safe-area-inset-bottom, 0px) + 6px))'
              }}>
                {/* Back Button */}
                <button className="w-10 h-10 flex items-center justify-center rounded-full">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Forward Button */}
                <button className="w-10 h-10 flex items-center justify-center rounded-full">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Share Button */}
                <button className="w-10 h-10 flex items-center justify-center rounded-full">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                
                {/* Bookmarks Button */}
                <button className="w-10 h-10 flex items-center justify-center rounded-full">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
                
                {/* Tabs Button */}
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-600 rounded"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
      case "pdf":

        // Check if directShow is enabled
        const directShow = formData.directShow || false;
        const pdfUrl = formData.pdfUrl || formData.url || "";
        
        // If directShow is true, show PDF viewer directly
        if (directShow) {
          if (pdfUrl) {
            return (
              <div className="h-full bg-slate-100 flex flex-col">
                {/* PDF Viewer */}
                <div className="flex-1 overflow-hidden">
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full border-0"
                    title="PDF Preview"
                    style={{ minHeight: '100%' }}
                  />
                </div>
                
                {/* Safari Browser Bottom Navigation Bar */}
                <div className="bg-slate-50 border-t border-slate-200 flex-shrink-0 relative">
                  <div className="px-3 py-2 flex items-center gap-1.5" style={{ 
                    minHeight: '34px',
                    paddingBottom: 'max(6px, calc(env(safe-area-inset-bottom, 0px) + 6px))'
                  }}>
                    <FaGlobe className="text-[10px] text-slate-500 flex-shrink-0" />
                    <span className="text-[10px] text-slate-600 font-normal truncate flex-1 leading-tight">
                      {pdfUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") || "PDF Document"}
                    </span>
                  </div>
                </div>
              </div>
            );
          } else {
            // Show placeholder when directShow is enabled but no PDF URL
            return (
              <div className="h-full bg-slate-100 flex flex-col">
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <FaFilePdf className="mx-auto text-4xl text-slate-400 mb-3" />
                    <p className="text-sm text-slate-600 mb-1">PDF will be shown directly</p>
                    <p className="text-xs text-slate-500">Please provide a PDF URL</p>
                  </div>
                </div>
                
                {/* Safari Browser Bottom Navigation Bar */}
                <div className="bg-slate-50 border-t border-slate-200 flex-shrink-0 relative">
                  <div className="px-3 py-2 flex items-center gap-1.5" style={{ 
                    minHeight: '34px',
                    paddingBottom: 'max(6px, calc(env(safe-area-inset-bottom, 0px) + 6px))'
                  }}>
                    <FaGlobe className="text-[10px] text-slate-500 flex-shrink-0" />
                    <span className="text-[10px] text-slate-600 font-normal truncate flex-1 leading-tight">
                      PDF Document
                    </span>
                  </div>
                </div>
              </div>
            );
          }
        }
        
        // Otherwise, show the website preview with landing page design
        // Get colors from formData with fallbacks
        const primaryColor = formData.primaryColor || "#FF7B25";
        const secondaryColor = formData.secondaryColor || "#7EC09F";
        const titleFont = formData.titleFont || "GT Walsheim Pro";
        const bodyFont = formData.bodyFont || "GT Walsheim Pro";
        
        return (
          <div className="h-full bg-white flex flex-col">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-auto">
              {/* Company Branding Section - Orange Header Background */}
              <div 
                className="px-4 pt-5 pb-4 text-center"
                style={{ 
                  backgroundColor: primaryColor,
                  fontFamily: titleFont
                }}
              >
                <p 
                  className="text-[10px] font-semibold text-white mb-1.5 tracking-tight opacity-90"
                  style={{ fontFamily: bodyFont }}
                >
                  {formData.company || "North American Accountants, Inc."}
                </p>
                <h1 
                  className="text-2xl font-bold text-white mb-2 leading-tight px-2"
                  style={{ fontFamily: titleFont }}
                >
                  {formData.title || "Bookkeeping Experts"}
                </h1>
                <p 
                  className="text-xs text-white px-2 leading-relaxed max-w-sm mx-auto opacity-95"
                  style={{ fontFamily: bodyFont }}
                >
                  {formData.description || "Learn about how we can help with all your business accounting needs."}
                </p>
              </div>

              {/* Main Content Section */}
              <div className="bg-white px-4 pb-6" style={{ fontFamily: bodyFont }}>
                {/* Data Visualization Section - Secondary Color Background */}
                <div 
                  className="rounded-lg p-4 mb-4 border"
                  style={{ 
                    backgroundColor: `${secondaryColor}20`,
                    borderColor: `${secondaryColor}40`
                  }}
                >
                  <div className="relative">
                    {/* Top Row Icons */}
                    <div className="flex justify-between items-center mb-4 px-1">
                      {/* Red Outlined Circle */}
                      <div className="w-11 h-11 rounded-full border-2 border-red-500 flex items-center justify-center bg-white">
                        <div className="w-6 h-6 rounded-full border-2 border-red-500"></div>
                      </div>
                      {/* Red Square with Envelope */}
                      <div className="w-11 h-11 bg-white border-2 border-red-400 rounded flex items-center justify-center">
                        <FaEnvelope className="text-red-500 text-base" />
                      </div>
                      {/* Secondary Color Circle with Dollar Sign */}
                      <div 
                        className="w-11 h-11 rounded-full flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        <FaDollarSign className="text-white text-lg" />
                      </div>
                    </div>

                    {/* Middle Section - Bar Chart and Magnifying Glass */}
                    <div className="flex items-end justify-center gap-3 mb-4">
                      {/* Bar Chart */}
                      <div className="flex items-end gap-1.5 h-14">
                        <div 
                          className="w-3 rounded-t" 
                          style={{ height: '45%', backgroundColor: secondaryColor }}
                        ></div>
                        <div 
                          className="w-3 rounded-t" 
                          style={{ height: '65%', backgroundColor: secondaryColor }}
                        ></div>
                        <div 
                          className="w-3 rounded-t" 
                          style={{ height: '30%', backgroundColor: secondaryColor }}
                        ></div>
                      </div>
                      {/* Magnifying Glass with Plus */}
                      <div 
                        className="relative w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${secondaryColor}30` }}
                      >
                        <FaSearch className="text-sm" style={{ color: secondaryColor }} />
                        <span 
                          className="absolute -top-0.5 -right-0.5 text-xs font-bold leading-none"
                          style={{ color: secondaryColor }}
                        >
                          +
                        </span>
                      </div>
                    </div>

                    {/* Bottom Icons - Gear and Folder */}
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                        <FaCog className="text-gray-600 text-xs" />
                      </div>
                      <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                        <FaFolder className="text-gray-600 text-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* View PDF Button */}
                <div className="flex justify-center">
                  <button 
                    className="btn-shine inline-flex items-center gap-2 text-white px-6 py-3 rounded-full text-sm font-medium shadow-md active:opacity-90 transition-opacity"
                    style={{ 
                      backgroundColor: primaryColor,
                      fontFamily: bodyFont
                    }}
                  >
                    <FaEye className="text-sm" />
                    <span>{formData.buttonText || "View PDF"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Safari Browser Bottom Navigation Bar */}
            <div className="bg-slate-50 border-t border-slate-200 flex-shrink-0 relative">
              <div className="px-3 py-2 flex items-center gap-1.5" style={{ 
                minHeight: '34px',
                paddingBottom: 'max(6px, calc(env(safe-area-inset-bottom, 0px) + 6px))'
              }}>
                <FaGlobe className="text-[10px] text-slate-500 flex-shrink-0" />
                <span className="text-[10px] text-slate-600 font-normal truncate flex-1 leading-tight">
                  {formData.website || "www.nagi.com"}
                </span>
              </div>
            </div>
          </div>
        );
      case "vcard":

        const vcardData = formData.vcard || {};
        const fullName = vcardData.firstName && vcardData.lastName 
          ? `${vcardData.firstName} ${vcardData.lastName}`
          : vcardData.firstName || "David Elson";
        const jobTitle = vcardData.jobTitle || "Lead Graphic Designer";
        const company = vcardData.company || "Creative Design Inc.";
        const description = `This is ${vcardData.firstName || "David"}, designer at ${company}. We offer outstanding graphic design services at reasonable rates.`;
        // Dummy person image - using a placeholder service
        const dummyImage = "https://i.pravatar.cc/150?img=12";
        
        return (
          <div className="h-full bg-white flex flex-col">
            {/* Content Area - Fills entire space */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Dark Blue Header Section with Gradient - Extra top padding for Dynamic Island */}
              <div className="bg-gradient-to-b from-blue-700 via-blue-600 to-blue-600 pt-12 pb-7 px-4 text-center flex-shrink-0">
                {/* Profile Picture */}
                <div className="mb-2.5">
                  {vcardData.profileImage ? (
                    <img 
                      src={vcardData.profileImage} 
                      alt={fullName}
                      className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <img 
                      src={dummyImage}
                      alt={fullName}
                      className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg object-cover"
                    />
                  )}
                </div>
                
                {/* Name */}
                <h1 className="text-xl font-bold text-white mb-1 leading-tight">
                  {fullName}
                </h1>
                
                {/* Job Title */}
                <p className="text-xs text-gray-200">
                  {jobTitle}
                </p>
              </div>

              {/* Contact Icons Section - Light Blue Background */}
              <div className="bg-indigo-50 px-4 py-3 flex-shrink-0">
                <div className="flex justify-center items-center gap-5">
                  {/* Phone Icon */}
                  <div className="w-11 h-11 rounded-full border-2 border-indigo-400 bg-white flex items-center justify-center shadow-sm">
                    <FaPhone className="text-indigo-600 text-base" />
                  </div>
                  
                  {/* Email Icon */}
                  <div className="w-11 h-11 rounded-full border-2 border-indigo-400 bg-white flex items-center justify-center shadow-sm">
                    <FaEnvelope className="text-indigo-600 text-base" />
                  </div>
                  
                  {/* Location Icon */}
                  <div className="w-11 h-11 rounded-full border-2 border-blue-400 bg-white flex items-center justify-center shadow-sm">
                    <FaMapMarkerAlt className="text-blue-600 text-base" />
                  </div>
                </div>
              </div>

              {/* Description Text Section - Fills remaining space */}
              <div className="bg-white px-4 py-6 flex-1 flex items-center justify-center min-h-0">
                <p className="text-xs text-gray-700 leading-relaxed text-center max-w-xs">
                  {description}
                </p>
              </div>
            </div>

            {/* Safari Browser Bottom Navigation Bar */}
            <div className="bg-slate-50 border-t border-slate-200 flex-shrink-0 relative">
              <div className="px-3 py-2 flex items-center gap-1.5" style={{ 
                minHeight: '34px',
                paddingBottom: 'max(6px, calc(env(safe-area-inset-bottom, 0px) + 6px))'
              }}>
                <FaGlobe className="text-[10px] text-slate-500 flex-shrink-0" />
                <span className="text-[10px] text-slate-600 font-normal truncate flex-1 leading-tight">
                  {vcardData.website || "www.example.com"}
                </span>
              </div>
            </div>
          </div>
        );
      case "links":
        const linksData = formData.links || {};
        const profileName = linksData.name || "Julia Anderson";
        const profileDescription = linksData.description || "Connect with me on social media to get my latest fitness advice and fun content!";
        
        // Use preview if available, otherwise use provided URL or default
        const profileImageUrl = profileImagePreview || linksData.profileImage || "https://i.pravatar.cc/150?img=68";
        
        const linkButtons = linksData.buttons || [];
        const socialLinks = formData.socialNetworks?.socialLinks || [];
        
        // Combine regular links and social links for display
        const allLinks = [
          ...linkButtons.map(btn => ({ ...btn, type: 'link' })),
          ...socialLinks.map(social => ({
            title: social.text || social.userId || social.url || '',
            url: social.url || (social.userId ? `https://${social.icon}.com/${social.userId}` : ''),
            icon: social.icon,
            type: 'social'
          }))
        ];
        
        // Icon mapping for common services
        const getIconForLink = (icon, title, url, buttonIndex, linkType) => {
          // For social networks, use the icon ID directly
          if (linkType === 'social' && icon) {
            return icon;
          }
          // Check if icon is a File object or data URL
          if (icon instanceof File || (typeof icon === "string" && icon.startsWith("data:image"))) {
            return "custom-image";
          }
          
          // Check if we have a preview for this button
          if (imagePreviews[`button-${buttonIndex}`]) {
            return "custom-image";
          }
          
          // Fallback to URL-based detection
          const urlLower = url?.toLowerCase() || "";
          const titleLower = title?.toLowerCase() || "";
          
          if (urlLower.includes("youtube") || titleLower.includes("youtube")) {
            return "youtube";
          } else if (urlLower.includes("tiktok") || titleLower.includes("tiktok")) {
            return "tiktok";
          } else if (urlLower.includes("instagram") || titleLower.includes("instagram")) {
            return "instagram";
          } else if (urlLower.includes("facebook") || titleLower.includes("facebook")) {
            return "facebook";
          } else if (urlLower.includes("twitter") || titleLower.includes("twitter")) {
            return "twitter";
          } else if (urlLower.includes("linkedin") || titleLower.includes("linkedin")) {
            return "linkedin";
          }
          return "link";
        };
        
        // Helper to get image source for button icon
        const getButtonImageSrc = (icon, buttonIndex) => {
          if (icon instanceof File) {
            return imagePreviews[`button-${buttonIndex}`] || null;
          } else if (typeof icon === "string" && icon.startsWith("data:image")) {
            return icon;
          } else if (imagePreviews[`button-${buttonIndex}`]) {
            return imagePreviews[`button-${buttonIndex}`];
          }
          return null;
        };
        
        return (
          <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-auto px-4 py-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Profile Picture and Name Section */}
                <div className="pt-8 pb-6 px-6 text-center">
                  {/* Profile Picture */}
                  <div className="mb-4">
                    {profileImageUrl && (
                      <img 
                        src={profileImageUrl}
                        alt={profileName}
                        className="w-24 h-24 rounded-full mx-auto border-4 border-gray-100 shadow-md object-cover"
                        onError={(e) => {
                          e.target.src = "https://i.pravatar.cc/150?img=68";
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Name */}
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {profileName}
                  </h1>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">
                    {profileDescription}
                  </p>
                </div>
                
                {/* Links List */}
                <div className="px-4 pb-6 space-y-3">
                  {allLinks.filter(btn => btn.title && (btn.url || btn.userId)).length > 0 ? (
                    allLinks
                      .filter(btn => btn.title && (btn.url || btn.userId))
                      .map((button, index) => {
                        const iconType = getIconForLink(button.icon, button.title, button.url, index, button.type);
                        const buttonImageSrc = getButtonImageSrc(button.icon, index);
                        
                        // Get icon component for social networks
                        const getSocialIcon = (iconId) => {
                          const iconMap = {
                            'globe': FaGlobe,
                            'dribbble': FaLink,
                            'facebook': FaFacebook,
                            'instagram': FaInstagram,
                            'twitter': FaTwitter,
                            'linkedin': FaLinkedin,
                            'youtube': FaYoutube,
                            'tiktok': FaTiktok,
                            'pinterest': FaPinterest,
                            'snapchat': FaSnapchat,
                            'whatsapp': FaWhatsapp,
                            'telegram': FaLink,
                            'spotify': FaLink,
                            'github': FaLink,
                            'google': FaLink,
                            'reddit': FaLink,
                            'skype': FaLink,
                            'tumblr': FaLink,
                            'vimeo': FaLink,
                            'vk': FaLink,
                            'link': FaLink,
                          };
                          return iconMap[iconId] || FaLink;
                        };
                        
                        return (
                          <button
                            key={index}
                            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-indigo-300 hover:shadow-md transition-all duration-200 active:bg-gray-50"
                          >
                            {/* Icon/Thumbnail */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                              {button.type === 'social' && iconType ? (
                                (() => {
                                  const SocialIcon = getSocialIcon(iconType);
                                  return <SocialIcon className="w-5 h-5 text-gray-700" />;
                                })()
                              ) : iconType === "custom-image" && buttonImageSrc ? (
                                <img 
                                  src={buttonImageSrc}
                                  alt={button.title || "Link icon"}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback if image fails to load
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : iconType === "youtube" ? (
                                <div className="w-full h-full bg-red-500 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                  </svg>
                                </div>
                              ) : iconType === "tiktok" ? (
                                <div className="w-full h-full bg-black flex items-center justify-center">
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                                  </svg>
                                </div>
                              ) : iconType === "instagram" ? (
                                <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center">
                                  <FaInstagram className="w-5 h-5 text-white" />
                                </div>
                              ) : iconType === "facebook" ? (
                                <div className="w-full h-full bg-indigo-600 flex items-center justify-center">
                                  <FaFacebook className="w-5 h-5 text-white" />
                                </div>
                              ) : iconType === "twitter" ? (
                                <div className="w-full h-full bg-indigo-400 flex items-center justify-center">
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                  </svg>
                                </div>
                              ) : iconType === "linkedin" ? (
                                <div className="w-full h-full bg-indigo-700 flex items-center justify-center">
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                  </svg>
                                </div>
                              ) : iconType === "link" ? (
                                <FaLink className="w-5 h-5 text-gray-400" />
                              ) : (
                                <FaLink className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            
                            {/* Link Title */}
                            <div className="flex-1 text-left">
                              <span className="text-sm font-semibold text-gray-900">
                                {button.title}
                              </span>
                            </div>
                            
                            {/* Arrow Icon */}
                            <div className="flex-shrink-0">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>
                        );
                      })
                  ) : (
                    <div className="text-center py-8">
                      <FaLink className="text-4xl text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No links added yet</p>
                      <p className="text-xs text-gray-400 mt-1">Add links in the form to see them here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Safari Browser Bottom Navigation Bar */}
            <div className="bg-slate-50 border-t border-slate-200 flex-shrink-0 relative">
              <div className="px-3 py-2 flex items-center gap-1.5" style={{ 
                minHeight: '34px',
                paddingBottom: 'max(6px, calc(env(safe-area-inset-bottom, 0px) + 6px))'
              }}>
                <FaGlobe className="text-[10px] text-slate-500 flex-shrink-0" />
                <span className="text-[10px] text-slate-600 font-normal truncate flex-1 leading-tight">
                  {linksData.name ? `${linksData.name.toLowerCase().replace(/\s+/g, '')}.com` : "links.example.com"}
                </span>
              </div>
            </div>
          </div>
        );
      case "wifi":
        const wifiData = formData.wifi || {};
        const ssid = wifiData.ssid || "";
        const displaySsid = ssid || "Wi-Fi Network";
        
        return (
          <div className="h-full pt-2 pb-1 bg-white flex flex-col">

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-auto px-6 py-8 flex items-center justify-center">
              <div className="w-full max-w-sm">
                {/* WiFi Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                    <FaWifi className="text-4xl text-indigo-600" />
                  </div>
                </div>
                
                {/* Question Text */}
                <div className="text-center mb-8">
                  <p className="text-lg font-medium text-gray-900">
                    Join the "{displaySsid}" Wi-fi network?
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    className="btn-shine w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Connect
                  </button>
                  <button
                    className="btn-shine btn-shine-soft w-full bg-white border-2 border-indigo-600 text-indigo-600 font-semibold py-3 px-6 rounded-xl hover:bg-indigo-50 transition-all duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
            
            {/* Safari Browser Bottom Navigation Bar */}
            <div className="bg-slate-50 border-t border-slate-200 flex-shrink-0 relative">
              <div className="px-3 py-2 flex items-center gap-1.5" style={{ 
                minHeight: '34px',
                paddingBottom: 'max(6px, calc(env(safe-area-inset-bottom, 0px) + 6px))'
              }}>
                <FaWifi className="text-[10px] text-slate-500 flex-shrink-0" />
                <span className="text-[10px] text-slate-600 font-normal truncate flex-1 leading-tight">
                  {displaySsid}
                </span>
              </div>
            </div>
          </div>
        );
      case "whatsapp":
        const whatsappData = formData.whatsapp || {};
        const countryCode = whatsappData.countryCode || "+91";
        const phoneNumber = whatsappData.phone || "";
        const whatsappMessage = whatsappData.message || "";
        
        // Format phone number for display - remove country code and format as "2116 546 546"
        let displayPhone = phoneNumber || "";
        // Remove spaces, dashes, parentheses
        displayPhone = displayPhone.replace(/[\s\-\(\)]/g, "");
        // Format as "XXXX XXX XXX" if we have enough digits
        if (displayPhone.length >= 7) {
          displayPhone = displayPhone.replace(/(\d{4})(\d{3})(\d+)/, "$1 $2 $3");
        }
        const fullPhoneDisplay = displayPhone || "Phone Number";
        
        return (
          <div className="h-full pt-2 pb-1 bg-white flex flex-col">

            {/* WhatsApp Header */}
            <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3 flex-shrink-0">
              {/* Back Arrow */}
              <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              
              {/* Profile Icon */}
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              
              {/* Contact Number */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{fullPhoneDisplay}</p>
              </div>
              
              {/* Action Icons */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <FaVideo className="w-5 h-5 text-white cursor-pointer" />
                <FaPhone className="w-5 h-5 text-white cursor-pointer" />
                <FaEllipsisV className="w-5 h-5 text-white cursor-pointer" />
              </div>
            </div>

            {/* Chat Body */}
            <div 
              className="flex-1 overflow-auto relative"
              style={{
                background: "#ECE5DD",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='a' patternUnits='userSpaceOnUse' width='100' height='100' patternTransform='scale(0.5) rotate(0)'%3E%3Crect x='0' y='0' width='100' height='100' fill='hsla(0,0%25,100%25,0)'/%3E%3Cpath d='M11.6 21a1 1 0 0 1-.987-.84 9 9 0 0 1 4.34-10.38 1 1 0 1 1 .894 1.79 7 7 0 0 0-3.23 8.06A1 1 0 0 1 11.6 21zm-9.2 0a1 1 0 0 1-.987-.84 7 7 0 0 0-3.23-8.06 1 1 0 1 1 .894-1.79 9 9 0 0 1 4.34 10.38 1 1 0 0 1-.987.47zm18.4 0a1 1 0 0 1-.987-.47 9 9 0 0 1 4.34-10.38 1 1 0 1 1 .894 1.79 7 7 0 0 0-3.23 8.06 1 1 0 0 1-.987.84zM50 11.6a1 1 0 0 1-.47.987 9 9 0 0 1-10.38-4.34 1 1 0 1 1 1.79-.894 7 7 0 0 0 8.06 3.23 1 1 0 0 1 .47.987zm-50 0a1 1 0 0 1 .47.987 7 7 0 0 0 8.06-3.23 1 1 0 1 1 1.79.894 9 9 0 0 1-10.38 4.34 1 1 0 0 1-.47-.987zm50 27a1 1 0 0 1-.47.987 9 9 0 0 1-10.38-4.34 1 1 0 1 1 1.79-.894 7 7 0 0 0 8.06 3.23 1 1 0 0 1 .47.987zm-50 0a1 1 0 0 1 .47.987 7 7 0 0 0 8.06-3.23 1 1 0 1 1 1.79.894 9 9 0 0 1-10.38 4.34 1 1 0 0 1-.47-.987z' stroke-width='0.5' stroke='hsla(0,0%25,0%25,0.05)' fill='none'/%3E%3C/pattern%3E%3C/defs%3E%3Crect fill='url(%23a)' width='100%25' height='100%25'/%3E%3C/svg%3E")`,
                backgroundSize: '200px 200px',
              }}
            >
              {/* Message Bubble */}
              {whatsappMessage ? (
                <div className="px-4 py-3 flex justify-end">
                  <div className="max-w-[75%] relative">
                    <div className="bg-[#DCF8C6] rounded-lg px-3 py-2 shadow-sm relative">
                      <p className="text-sm text-gray-900 break-words leading-relaxed">{whatsappMessage}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] text-gray-500">9:41</span>
                        {/* Double checkmarks (read receipt) */}
                        <svg className="w-3.5 h-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                        </svg>
                      </div>
                    </div>
                    {/* Message tail (pointing to right) */}
                    <div className="absolute right-[-4px] bottom-0 w-0 h-0 border-l-[6px] border-l-[#DCF8C6] border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent"></div>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 flex justify-end">
                  <div className="max-w-[75%] relative">
                    <div className="bg-[#DCF8C6] rounded-lg px-3 py-2 shadow-sm relative">
                      <p className="text-sm text-gray-500 italic">Type a message.</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] text-gray-500">9:41</span>
                        {/* Double checkmarks */}
                        <svg className="w-3.5 h-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                        </svg>
                      </div>
                    </div>
                    {/* Message tail */}
                    <div className="absolute right-[-4px] bottom-0 w-0 h-0 border-l-[6px] border-l-[#DCF8C6] border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input Area */}
            <div className="bg-[#F0F0F0] px-2 py-2 flex items-center gap-2 flex-shrink-0">
              {/* Emoji Icon */}
              <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </button>
              
              {/* Text Input */}
              <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center gap-2 min-h-[36px]">
                <span className="text-xs text-gray-500 flex-1">Message</span>
                <div className="flex items-center gap-3">
                  <FaPaperclip className="w-4 h-4 text-gray-500" />
                  <FaCamera className="w-4 h-4 text-gray-500" />
                </div>
              </div>
              
              {/* Microphone Button */}
              <button className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0 hover:bg-[#20BA5A] transition-colors">
                <FaMicrophone className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Gesture Bar */}
            <div className="bg-[#F0F0F0] flex justify-center py-1">
              <div className="w-32 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        );
      case "instagram":
        const instagramData = formData.instagram || {};
        const instagramUsername = instagramData.username || "";
        // Remove @ if user included it
        const cleanInstagramUsername = instagramUsername.replace(/^@/, "").trim() || "username";
        const displayUsername = `@${cleanInstagramUsername}`;
        
        return (
          <div className="h-full px-4 pt-2 pb-1 bg-white flex flex-col">

            {/* Instagram Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                {/* Instagram Logo */}
                <div className="w-8 h-8 flex items-center justify-center">
                  <FaInstagram className="w-6 h-6 text-pink-600" />
                </div>
                <span className="text-lg font-semibold text-gray-900">Instagram</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Heart icon */}
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {/* Message icon */}
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>

            {/* Instagram Profile Content */}
            <div className="flex-1 overflow-auto bg-white">
              <div className="px-4 py-4">
                {/* Profile Header */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Profile Picture */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0 border-2 border-gray-300">
                    <span className="text-2xl font-bold text-white">
                      {cleanInstagramUsername.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex-1 flex items-center justify-around pt-2">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-900">0</div>
                      <div className="text-xs text-gray-500">posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-900">0</div>
                      <div className="text-xs text-gray-500">followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-900">0</div>
                      <div className="text-xs text-gray-500">following</div>
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div className="mb-3">
                  <h1 className="text-sm font-semibold text-gray-900">{displayUsername}</h1>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                  <button className="btn-shine flex-1 bg-[#0095F6] text-white text-sm font-semibold py-2 px-4 rounded-lg">
                    Follow
                  </button>
                  <button className="btn-shine btn-shine-soft flex-1 bg-white border border-gray-300 text-gray-900 text-sm font-semibold py-2 px-4 rounded-lg">
                    Message
                  </button>
                  <button className="w-10 h-9 flex items-center justify-center border border-gray-300 rounded-lg">
                    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>

                {/* Bio Section */}
                <div className="mb-4">
                  <p className="text-sm text-gray-900 mb-1">Welcome to Instagram</p>
                  <p className="text-xs text-gray-500">@{cleanInstagramUsername}</p>
                </div>

                {/* Posts Grid Placeholder */}
                <div className="grid grid-cols-3 gap-1 mt-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <FaImage className="w-6 h-6 text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Navigation Bar */}
            <div className="bg-white border-t border-gray-200 flex items-center justify-around py-2 flex-shrink-0">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <div className="w-10 h-10 rounded-lg border-2 border-gray-900 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-900 rounded"></div>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <div className="w-6 h-6 rounded-full bg-gray-300"></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
            <div className="text-center max-w-xs">
              {/* QR Genie Logo/Brand */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  {/* QR Code Icon Style Logo */}
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <div className="grid grid-cols-3 gap-1 p-2">
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                      <div className="w-3 h-3 bg-indigo-700 rounded-sm"></div>
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                    </div>
                  </div>
                  {/* Sparkle effect */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>
              </div>
              
              {/* Brand Name */}
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                QR Genie
              </h3>
              
              {/* Tagline */}
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Create beautiful, dynamic QR codes in seconds
              </p>
              
              {/* Feature Highlights */}
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  <span>Customize colors & styles</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Add logos & frames</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                  <span>Track scans & analytics</span>
                </div>
              </div>
              
              {/* CTA Hint */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-400 italic">
                  Select a QR type to get started
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative mx-auto" style={{ width: "320px", height: "640px" }}>

      {/* Modern iPhone Style - Dark Purplish-Gray Frame */}
      <div className="absolute inset-0 rounded-[3rem] p-1 shadow-2xl" style={{ 
        background: 'linear-gradient(to bottom, #4a5568, #2d3748, #1a202c)'
      }}>
        {/* Volume Buttons (Left Side) */}
        <div className="absolute left-0 top-32 w-1 h-12 rounded-l-full" style={{ background: 'linear-gradient(to bottom, #4a5568, #2d3748)' }}></div>
        <div className="absolute left-0 top-48 w-1 h-12 rounded-l-full" style={{ background: 'linear-gradient(to bottom, #4a5568, #2d3748)' }}></div>
        
        {/* Power Button (Right Side) */}
        <div className="absolute right-0 top-36 w-1 h-16 rounded-r-full" style={{ background: 'linear-gradient(to bottom, #4a5568, #2d3748)' }}></div>
        {/* Thin uniform black bezels with rounded corners */}
        <div className="h-full bg-black rounded-[2.8rem] overflow-hidden relative">
          {/* Screen with thin bezels */}
          <div className="h-full bg-white rounded-[2.6rem] overflow-hidden relative m-0.5">
            {/* Dynamic Island (Pill-shaped) */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
              <div className="w-28 h-7 bg-black rounded-full flex items-center justify-center shadow-lg">
                <div className="flex items-center gap-2 px-3">
                  <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                  <div className="w-0.5 h-3 bg-slate-500 rounded-full"></div>
                </div>
              </div>
            </div>
            
            {/* Status Bar */}
            <div className="h-8 pt-2 bg-white flex items-center relative z-10">
              <div className="flex items-center justify-between text-slate-900 text-xs font-semibold w-full px-6">
                <span className="font-bold">9:41</span>
                <div className="flex items-center gap-2">
                  {/* Signal bars */}
                  <div className="flex items-end gap-0.5">
                    <div className="w-1 h-1 bg-slate-900 rounded-sm"></div>
                    <div className="w-1 h-1.5 bg-slate-900 rounded-sm"></div>
                    <div className="w-1 h-2 bg-slate-900 rounded-sm"></div>
                    <div className="w-1 h-2.5 bg-slate-900 rounded-sm"></div>
                  </div>
                  {/* Wi-Fi icon */}
                  <div className="w-4 h-3 relative">
                    <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-slate-900 rounded-sm"></div>
                    <div className="absolute bottom-0.5 left-0.5 w-2 h-0.5 bg-slate-900 rounded-sm"></div>
                    <div className="absolute bottom-1 left-1 w-1 h-0.5 bg-slate-900 rounded-sm"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Screen Content */}
            <div className="h-[calc(100%-2rem)] overflow-auto">
              {renderPreview()}
            </div>
            
            {/* Home Indicator (modern iPhone style) */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
              <div className="w-32 h-1 bg-slate-900 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// Step Indicator Component - Responsive
const StepIndicator = ({ currentStep, onStepClick, allDone = false }) => {
  const steps = [
    { id: 1, label: "Choose a type", shortLabel: "Type" },
    { id: 2, label: "Add content", shortLabel: "Content" },
    { id: 3, label: "Style it", shortLabel: "Design" },
  ];

  return (
    <ol className="grid grid-cols-3 gap-1.5 rounded-2xl border border-gray-100 bg-gray-50/80 p-1.5" aria-label="Steps">
      {steps.map((step) => {
        const done = currentStep > step.id || allDone;
        const active = currentStep === step.id && !allDone;
        const canClick = !!onStepClick && done && !allDone;
        return (
          <li key={step.id} className="min-w-0">
            <button
              type="button"
              onClick={() => canClick && onStepClick(step.id)}
              disabled={!canClick}
              aria-current={active ? "step" : undefined}
              className={`flex w-full min-w-0 items-center gap-2 rounded-xl px-2 py-2 text-left transition sm:gap-2.5 sm:px-3 sm:py-2.5 ${
                active ? "bg-white shadow-sm ring-1 ring-indigo-100" : canClick ? "hover:bg-white/70" : "cursor-default"
              }`}
            >
              <span
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30"
                      : "bg-white text-gray-400 ring-1 ring-gray-200"
                }`}
              >
                {done ? <FaCheck className="h-3 w-3" /> : step.id}
              </span>
              <span className="min-w-0">
                <span className="hidden text-[11px] font-medium uppercase tracking-wide text-gray-400 sm:block">Step {step.id}</span>
                <span className={`block truncate text-xs font-semibold sm:text-sm ${active || done ? "text-gray-900" : "text-gray-500"}`}>
                  <span className="hidden md:inline">{step.label}</span>
                  <span className="md:hidden">{step.shortLabel}</span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
};

// Starting values of the content form (also used by "Create another")
const INITIAL_FORM_DATA = {
  linkType: "DYNAMIC", // "STATIC" = encode URL only, no tracking; "DYNAMIC" = /r/slug + tracking + pause/resume
  // Website
  url: "",
  name: "",
  password: "",

  passwordEnabled: false,
  folder: "",
  // PDF
  pdfUrl: "",
  pdfFile: null,
  directShow: false,
  title: "",
  company: "",
  description: "",
  website: "",
  buttonText: "View PDF",
  thumbnail: null,
  primaryColor: "#527AC9",
  secondaryColor: "#7EC09F",
  titleFont: "GT Walsheim Pro",
  bodyFont: "GT Walsheim Pro",
  // vCard
  vcard: {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    company: "",
    jobTitle: "",
    website: "",
  },
  // List of Links
  links: {
    profileImage: null,
    name: "",
    description: "",
    buttons: [{ title: "", url: "", icon: "" }],
  },
  // Business
  business: {
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    website: "",
  },
  // Video
  videoUrl: "",
  // Images
  images: [],
  // Social Media
  social: {
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
  },
  // WhatsApp
  whatsapp: {

    countryCode: "+91",
    phone: "",
    message: "",
  },
  // Instagram
  instagram: {
    username: "",
  },
  // MP3
  mp3Url: "",
  // Menu
  menu: {
    restaurantName: "",
    items: [],
  },
  // Apps
  apps: {
    ios: "",
    android: "",
  },
  // Coupon
  coupon: {
    title: "",
    description: "",
    code: "",
    expiry: "",
  },
  // WiFi
  wifi: {
    ssid: "",
    password: "",
    security: "WPA",

    hidden: false,
  },
};

// Starting values of the design step
const INITIAL_DESIGN_DATA = {
  // Frame options
  frameStyle: "none", // none, label, tag, bubble, badge
  frameText: "Scan me!",
  frameTextColor: "#000000", // Color for frame text (single color, no gradient)
  frameColor: "#000000", // Border color only (no gradient support)
  frameBgColor: "#ffffff",
  frameBgTransparent: false,
  frameBgUseGradient: false,
  frameBgColor1: "#ffffff",
  frameBgColor2: "#ffffff",
  
  // QR Pattern options
  patternStyle: "classic", // classic, dots, rounded, pixels, grid
  patternColor: "#000000",
  patternUseGradient: false,
  patternGradientType: "vertical", // vertical, horizontal, diagonal, inverse-diagonal, radial
  patternColor1: "#000000",
  patternColor2: "#000000",
  patternBgColor: "#ffffff",
  patternBgTransparent: false,
  patternBgUseGradient: false,
  patternBgGradientType: "linear", // linear, radial
  patternBgColor1: "#ffffff",
  patternBgColor2: "#ffffff",
  
  // Corner customization
  cornerFrameStyle: "square", // square, rounded, circle, extra-rounded
  cornerDotStyle: "square", // square, rounded, circle, extra-rounded
  cornerFrameColor: "#000000",
  cornerDotColor: "#000000",
  
  // Logo options
  logo: null,
  logoSize: 40,
  
  // Legacy support (for backward compatibility)
  qrColor: "#000000",
  bgColor: "#ffffff",
  useGradientPattern: false,
  bgTransparent: false,
  useGradientBg: false,
  bgColor1: "#ffffff",
  bgColor2: "#ffffff",

};

export default function CreateQrPage() {

  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [hoveredType, setHoveredType] = useState(null);
  const [previewMode, setPreviewMode] = useState("destination"); // "destination" | "qr"

  // ?type=wifi (used by the landing page) starts at step 2 with that type picked; unknown or
  // unreleased types are ignored
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) return;
    const requested = qrTypes.find((type) => type.active && type.id === router.query.type);
    if (requested) {
      setSelectedType(requested.id);
      setStep(2);
    }
  }, [router.isReady, router.query.type]);

  // Form data - unified state
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // Folders state
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setSubscriptionStatus(data.subscriptionStatus || { status: "NONE", daysLeft: null });
        }
      } catch (e) {
        setSubscriptionStatus({ status: "NONE", daysLeft: null });
      }
    };
    fetchMe();
  }, []);

  const canCreate = subscriptionStatus && (subscriptionStatus.status === "TRIAL_ACTIVE" || subscriptionStatus.status === "SUBSCRIPTION_ACTIVE");

  // Design data - comprehensive design options
  const [designData, setDesignData] = useState(INITIAL_DESIGN_DATA);

  // Wrapper to update design data and trigger preview refresh
  const updateDesignData = (newData) => {
    setDesignData(newData);
    setPreviewKey(prev => prev + 1);
  };

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errorJSX, setErrorJSX] = useState(null);
  const [success, setSuccess] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("png");
  const [downloadSize, setDownloadSize] = useState("default");
  const qrPreviewRef = useRef(null);

  // Fetch folders on mount
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await fetch("/api/folders");
        if (response.ok) {
          const data = await response.json();
          setFolders(data.folders || []);
        }
      } catch (err) {
        console.error("Failed to fetch folders:", err);
      }
    };
    fetchFolders();
  }, []);

  // Handle folder creation callback
  const handleFolderCreated = (newFolder) => {
    setFolders(prev => [...prev, newFolder]);
  };

  // Generate QR code URL for preview (real-time updates)
  const qrCodeUrl = useMemo(() => {
    const baseUrl = typeof window !== "undefined" 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://qr-genie.co";
    
    const previewTargetUrl = generatePreviewUrl(selectedType || hoveredType, formData);
    
    if (!previewTargetUrl || !(selectedType || hoveredType)) return null;
    
    // For preview, we'll encode the target URL directly so users can see what the QR will link to
    // In production, the QR code will encode: ${baseUrl}/r/${slug} which redirects to targetUrl
    // For preview purposes, we show the target URL so users can test scanning
    return previewTargetUrl;
  }, [selectedType, hoveredType, formData]);
  // Validation
  const canContinueFromStep1 = !!selectedType;
  const canContinueFromStep2 = () => {
    if (!selectedType) return false;
    const schema = getSchemaForType(selectedType);


    // For nested types, prefix field paths
    const nestedTypes = ["vcard", "links", "business", "whatsapp", "instagram", "menu", "apps", "coupon", "wifi"];
    const getFieldPath = (fieldId) => {
      if (nestedTypes.includes(selectedType)) {
        return `${selectedType}.${fieldId}`;
      }
      return fieldId;
    };

    // Check required fields from schema
    for (const section of schema.sections || []) {
      for (const field of section.fields || []) {
        if (field.required) {

          const fieldPath = getFieldPath(field.id);
          const value = getNestedValue(formData, fieldPath);
          if (!value || (typeof value === "string" && !value.trim())) {
            return false;
          }
        }
      }
    }

    // Type-specific validation
    switch (selectedType) {
      case "website":
        if (formData.passwordEnabled && (formData.password || "").length < 4) return false;
        return !!formData.url;
      case "pdf":
        return !!(formData.pdfUrl || formData.pdfFile);
      case "vcard":
        return !!(formData.vcard?.firstName && formData.vcard?.phone);
      case "links":

        return !!(formData.links?.name && formData.links?.buttons?.some(b => b.title && b.url));
      case "wifi":
        const wifiData = formData.wifi || {};
        const wifiSsid = wifiData.ssid || "";
        const wifiSecurity = wifiData.security || "WPA";
        const wifiPassword = wifiData.password || "";
        
        // SSID is always required
        if (!wifiSsid.trim()) {
          return false;
        }
        
        // Password is required for WPA, WEP, and WPA-EAP (not for nopass)
        if (wifiSecurity !== "nopass" && !wifiPassword.trim()) {
          return false;
        }
        
        return true;
      case "whatsapp":
        return !!(formData.whatsapp?.countryCode && formData.whatsapp?.phone);
      case "instagram":
        return !!formData.instagram?.username;
      default:
        return true;
    }
  };

  // Helper to get nested values
  const getNestedValue = (obj, path) => {
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
      if (current == null) return undefined;
      current = current[key];
    }
    return current;
  };


  // Get required fields message for QR type
  const getRequiredFieldsMessage = (qrType) => {
    if (!qrType) return "Please select a QR code type first";
    
    const schema = getSchemaForType(qrType);
    const requiredFields = [];
    
    // Collect required fields from schema
    for (const section of schema.sections || []) {
      for (const field of section.fields || []) {
        if (field.required) {
          requiredFields.push(field.label || field.id);
        }
      }
    }
    
    // Type-specific messages
    switch (qrType) {
      case "website":
        if (formData.url && formData.passwordEnabled && (formData.password || "").length < 4) {
          return "Add a password of at least 4 characters, or turn password protection off.";
        }
        return "Add the website address to continue.";
      case "pdf":
        return "Please fill data like PDF URL or upload PDF file*";
      case "vcard":
        return "Please fill data like First Name* and Phone*";
      case "links":
        return "Please fill data like Title* and at least one Link Button with Title* and URL*";
      case "business":
        return "Please fill data like Business Name*";
      case "video":
        return "Please fill data like Video URL*";
      case "images":
        return "Please upload at least one image*";
      case "whatsapp":
        return "Choose the country and add the phone number to continue.";
      case "mp3":
        return "Please fill data like MP3 URL*";
      case "menu":
        return "Please fill data like Restaurant Name* and Menu Items*";
      case "wifi":
        const wifiDataCheck = formData.wifi || {};
        const securityCheck = wifiDataCheck.security || "WPA";
        if (securityCheck !== "nopass") {
          return "Add the network name and password to continue.";
        }
        return "Add the network name to continue.";
      case "apps":
        return "Please fill data like iOS or Android App URL*";
      case "coupon":
        return "Please fill data like Coupon Title* and Code*";
      case "facebook":
        return "Please fill data like Facebook URL*";
      case "instagram":
        return "Add the Instagram username to continue.";
      case "social":
        return "Please fill data like at least one Social Media URL*";
      default:
        if (requiredFields.length > 0) {
          return `Please fill required fields: ${requiredFields.join(", ")}`;
        }
        return "Please fill the required data";
    }
  };

  // Check if QR code can be generated
  const canGenerateQR = canContinueFromStep2();

  // Auto-switch to destination mode if QR data becomes invalid
  useEffect(() => {
    if (previewMode === "qr" && !canGenerateQR) {
      setPreviewMode("destination");
    }
  }, [previewMode, canGenerateQR]);

  const goNext = () => {
    if (step === 1 && !canContinueFromStep1) return;
    if (step === 2 && !canContinueFromStep2()) return;
    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  // Creates the code. Only the "Create QR code" button on step 3 calls this.
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (step < 3 || saving) return;
    if (!canContinueFromStep2()) {
      setStep(2);
      return;
    }

    setSaving(true);
    setError("");
    setErrorJSX(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/create-dynamic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({
          qrType: selectedType,
          ...formData, // Send all form data
          // WiFi codes are always static; a password only applies to website codes
          linkType: selectedType === "wifi" ? "STATIC" : formData.linkType || "DYNAMIC",
          passwordEnabled: selectedType === "website" && !!formData.passwordEnabled,
          // Use pattern colors for QR, fallback to legacy qrColor
          qrColor: designData.patternColor || designData.qrColor || "#000000",
          // Use pattern background colors, fallback to legacy bgColor
          bgColor: designData.patternBgTransparent || designData.bgTransparent
            ? "transparent"
            : (designData.patternBgColor || designData.bgColor || "#ffffff"),
          design: designData, // Send full design object
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Check if it's a QR limit error
        if (res.status === 403 && data.limit !== undefined) {
          setErrorJSX(
            <div className="space-y-3 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <p className="font-semibold text-red-800">{data.error}</p>
              {data.current >= data.limit && (
                <Link
                  href="/dashboard/billing"
                  className="btn-shine inline-flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                >
                  Upgrade to Basic Package
                </Link>
              )}
            </div>
          );
          setError(""); // Clear string error
        } else {
          setError(data.error || "Could not create QR code.");
          setErrorJSX(null); // Clear JSX error
        }
      } else {
        setSuccess({
          id: data.id,
          slug: data.slug,
          linkType: data.linkType,
          staticContent: data.staticContent,
          isProtected: !!data.protected,
        });
        setPreviewMode("qr");
        setStep(3);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Render Step 1 - QR Type Selection
  const renderStep1 = () => {
    const available = qrTypes.filter((type) => type.active !== false);
    const upcoming = qrTypes.filter((type) => type.active === false);

    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900">What should your QR code do?</h2>
        <p className="mt-1 text-sm text-gray-500">Pick a type. You'll add the details in the next step.</p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {available.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedType(type.id);
                  setTimeout(() => setStep(2), 250);
                }}
                onMouseEnter={() => setHoveredType(type.id)}
                onMouseLeave={() => setHoveredType(null)}
                className={`group relative flex flex-col rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:p-5 ${
                  isSelected
                    ? "border-indigo-300 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                    : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5"
                }`}
              >
                <span className="flex items-start justify-between">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${TYPE_ACCENTS[type.id] || "bg-indigo-50 text-indigo-600"}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {isSelected ? (
                    <FaCheckCircle className="h-5 w-5 text-indigo-600" />
                  ) : (
                    <FaArrowRight className="mt-1 h-3.5 w-3.5 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                  )}
                </span>
                <span className="mt-3 font-semibold text-gray-900">{type.label}</span>
                <span className="mt-0.5 text-sm text-gray-500">{type.description}</span>
                {type.hint && <span className="mt-2 text-xs text-gray-400">{type.hint}</span>}
              </button>
            );
          })}
        </div>

        {upcoming.length > 0 && (
          <div className="mt-8 border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Coming soon</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {upcoming.map((type) => {
                const Icon = type.icon;
                return (
                  <span
                    key={type.id}
                    className="inline-flex items-center gap-2 rounded-full border border-dashed border-gray-200 bg-gray-50/60 px-3 py-1.5 text-xs font-medium text-gray-400"
                  >
                    <Icon className="h-3 w-3" />
                    {type.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Step 2 - Dynamic Content Form
  const renderStep2 = () => {
    if (!selectedType) return null;

    const schema = getSchemaForType(selectedType);
    const typeInfo = qrTypes.find((type) => type.id === selectedType);
    const TypeIcon = typeInfo?.icon || FaQrcode;
    const isWifi = selectedType === "wifi";
    const passwordOn = selectedType === "website" && !!formData.passwordEnabled;
    const linkType = isWifi ? "STATIC" : formData.linkType || "DYNAMIC";

    const updateFormData = (newData) => {
      // A password only works on a dynamic code
      setFormData(newData.passwordEnabled && newData.linkType === "STATIC" ? { ...newData, linkType: "DYNAMIC" } : newData);
      setPreviewKey((prev) => prev + 1);
    };

    const linkOptions = [
      {
        id: "DYNAMIC",
        title: "Dynamic",
        badge: "Recommended",
        icon: FaChartBar,
        text:
          selectedType === "website"
            ? "Change where it points any time, see its scans, pause it or add a password."
            : "Change where it points any time, see its scans and pause it.",
      },
      {
        id: "STATIC",
        title: "Static",
        icon: FaQrcode,
        text: "The content is printed into the code itself. It can't be changed or tracked later.",
        disabled: passwordOn,
      },
    ];

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl ${TYPE_ACCENTS[selectedType] || "bg-indigo-50 text-indigo-600"}`}>
              <TypeIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add your {typeInfo?.label || "QR code"} details</h2>
              <p className="text-sm text-gray-500">Fields marked * are required.</p>
            </div>
          </div>
          <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700">
            Change type
          </button>
        </div>

        {isWifi ? (
          <div className="flex gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
            <FaInfoCircle className="mt-0.5 h-4 w-4 flex-none text-cyan-600" />
            <p className="text-sm leading-relaxed text-cyan-900">
              <span className="font-semibold">Wi-Fi codes are static.</span> Phones join the network straight from the camera, with no app or
              web page in between. Scans aren't counted, and if the network name or password changes you'll need a new code.
            </p>
          </div>
        ) : (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-700">How should this code work?</legend>
            <div className="grid gap-3 2xl:grid-cols-2">
              {linkOptions.map((option) => {
                const checked = linkType === option.id;
                const Icon = option.icon;
                return (
                  <label
                    key={option.id}
                    className={`relative flex gap-3 rounded-2xl border p-4 transition focus-within:ring-2 focus-within:ring-indigo-500/40 ${
                      option.disabled
                        ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-60"
                        : checked
                          ? "cursor-pointer border-indigo-300 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                          : "cursor-pointer border-gray-200 bg-white hover:border-indigo-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="linkType"
                      value={option.id}
                      checked={checked}
                      disabled={option.disabled}
                      onChange={() => updateFormData({ ...formData, linkType: option.id })}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${
                        checked ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 pr-5">
                      <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                        {option.title}
                        {option.badge && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            {option.badge}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                        {option.disabled ? "Not available with a password: protection needs a dynamic code." : option.text}
                      </span>
                    </span>
                    {checked && <FaCheckCircle className="absolute right-3 top-3 h-4 w-4 text-indigo-600" />}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <DynamicForm
          schema={schema}
          formData={formData}
          updateFormData={updateFormData}
          type={selectedType}
          folders={folders}
          onFolderCreated={handleFolderCreated}
        />
      </div>
    );
  };

  // Handle logo upload: the logo is saved with the QR code, so it's shrunk to 150 KB at most
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again after an error
    if (!file) return;

    setError("");
    const result = await prepareLogo(file);
    if (result.error) {
      setError(result.error);
      return;
    }
    updateDesignData({ ...designData, logo: result.dataUrl });
  };
  
  // Remove logo
  const handleRemoveLogo = () => {
    updateDesignData({ ...designData, logo: null });
  };

  // Download QR code handler - captures preview DOM node directly for pixel-perfect output
  const handleDownloadQR = async () => {
    if (!qrCodeUrl || !qrPreviewRef.current) {
      setError("QR code preview not available. Please wait for the preview to load.");
      return;
    }

    const sizeMap = {
      default: 1024,
      "512x512": 512,
      "1024x1024": 1024,
      "2048x2048": 2048,
      "4096x4096": 4096,
    };

    const targetSize = sizeMap[downloadSize] || 1024;
    const format = downloadFormat === "print" ? "png" : downloadFormat;
    const filename = success?.slug ? `qr-genie-${success.slug}` : "qr-code";

    try {
      setSaving(true);
      setError("");

      // Get the preview container element
      const element = qrPreviewRef.current;
      if (!element) {
        throw new Error("QR preview element not found");
      }

      // Wait a bit to ensure all styles and images are fully loaded
      await new Promise(resolve => setTimeout(resolve, 100));

      // Ensure element is visible and in viewport
      const rect = element.getBoundingClientRect();
      const naturalWidth = rect.width;
      const naturalHeight = rect.height;

      if (naturalWidth === 0 || naturalHeight === 0) {
        throw new Error("QR preview element has zero dimensions. Please ensure the preview is visible.");
      }

      // Scroll element into view if needed
      if (rect.top < 0 || rect.left < 0 || rect.bottom > window.innerHeight || rect.right > window.innerWidth) {
        element.scrollIntoView({ behavior: "instant", block: "center", inline: "center" });
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Calculate scale factor to reach target size while maintaining aspect ratio
      // We'll capture at natural size with high pixelRatio, then scale if needed
      const aspectRatio = naturalWidth / naturalHeight;
      const scaleFactor = targetSize / Math.max(naturalWidth, naturalHeight);
      
      // Use high pixel ratio for retina quality (minimum 2x, up to 3x)
      const pixelRatio = Math.min(Math.max(window.devicePixelRatio || 2, 2), 3);
      
      // Check if pattern background should be transparent
      const isTransparentBg = designData?.patternBgTransparent || designData?.bgTransparent;
      
      // Base options for html-to-image
      // Capture at natural size with high pixelRatio for quality
      const baseOptions = {
        quality: 1.0,
        pixelRatio: pixelRatio * scaleFactor, // Scale up to target size
        filter: (node) => {
          // Exclude the "Scan to test" text if present
          const text = node.textContent || "";
          if (text.includes("Scan to test") || text.includes("Scan to test your QR code")) {
            return false;
          }
          return true;
        },
        // Use canvas to ensure gradients and transparency are preserved
        useCORS: true,
        allowTaint: false,
      };

      let dataUrl;

      // Handle different formats
      if (format === "svg") {
        // SVG format - preserves vector graphics and transparency
        const svgOptions = {
          ...baseOptions,
          backgroundColor: isTransparentBg ? null : (designData?.patternBgColor || designData?.bgColor || "#ffffff"),
        };
        dataUrl = await toSvg(element, svgOptions);
      } else if (format === "pdf") {
        // PDF format - capture as high-quality PNG first, then convert to PDF
        const pngOptions = {
          ...baseOptions,
          backgroundColor: null, // Always use transparent for PDF to preserve gradients
        };
        dataUrl = await toPng(element, pngOptions);
        
        // Get actual image dimensions from the captured data
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = dataUrl;
        });
        
        const actualWidth = img.width;
        const actualHeight = img.height;
        
        // Convert to mm for jsPDF (96 DPI standard)
        const pdfWidth = (actualWidth / 96) * 25.4;
        const pdfHeight = (actualHeight / 96) * 25.4;
        
        const pdf = new jsPDF({
          orientation: actualWidth > actualHeight ? "landscape" : "portrait",
          unit: "mm",
          format: [pdfWidth, pdfHeight],
          compress: true,
        });

        // Add image to PDF - use full dimensions with high quality
        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "SLOW");
        
        // Download PDF
        pdf.save(`${filename}.pdf`);
        setShowDownloadModal(false);
        setSaving(false);
        return;
      } else if (format === "jpg" || format === "jpeg") {
        // JPEG format - requires solid background (white if transparent)
        const jpegOptions = {
          ...baseOptions,
          backgroundColor: isTransparentBg ? "#ffffff" : (designData?.patternBgColor || designData?.bgColor || "#ffffff"),
        };
        dataUrl = await toJpeg(element, jpegOptions);
      } else {
        // PNG format - supports transparency
        const pngOptions = {
          ...baseOptions,
          backgroundColor: isTransparentBg ? null : (designData?.patternBgColor || designData?.bgColor || null),
        };
        dataUrl = await toPng(element, pngOptions);
      }

      // Print: open the image in a new tab and print it from here (inline scripts are blocked by the site's security policy)
      if (downloadFormat === "print") {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          setError("Allow pop-ups for this site to print the QR code.");
          return;
        }
        printWindow.document.write(
          `<!DOCTYPE html><html><head><title>Print QR code</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${dataUrl}" alt="QR code" style="width:60mm;height:auto"></body></html>`
        );
        printWindow.document.close();
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 300);
        setShowDownloadModal(false);
        return;
      }

      // Download the file
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${filename}.${format === "jpeg" ? "jpg" : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowDownloadModal(false);
    } catch (error) {
      console.error("Download error:", error);
      setError("Failed to download QR code. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Color picker component with optional gradient support
  const ColorPicker = ({ label, color, color1, color2, useGradient, onColorChange, onGradientToggle, onColor1Change, onColor2Change, showTransparent = false, transparent = false, onTransparentToggle }) => {
    // Check if gradient is supported (gradient props are provided)
    const supportsGradient = onGradientToggle && onColor1Change && onColor2Change;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-700">{label}</label>
          <div className="flex items-center gap-2">
            {showTransparent && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transparent}
                  onChange={(e) => onTransparentToggle(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-600">Transparent</span>
              </label>
            )}
            {supportsGradient && !transparent && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useGradient || false}
                  onChange={(e) => onGradientToggle(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-600">Gradient</span>
              </label>
            )}
          </div>
        </div>
        {transparent ? (
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">Transparent background</div>
        ) : (supportsGradient && useGradient) ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color1 || "#000000"}
                onChange={(e) => onColor1Change(e.target.value)}
                className="h-9 w-9 flex-none cursor-pointer rounded-lg border border-gray-200 bg-white p-0.5"
              />
              <input
                type="text"
                value={color1 || "#000000"}
                onChange={(e) => onColor1Change(e.target.value)}
                className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 font-mono text-xs uppercase text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color2 || "#000000"}
                onChange={(e) => onColor2Change(e.target.value)}
                className="h-9 w-9 flex-none cursor-pointer rounded-lg border border-gray-200 bg-white p-0.5"
              />
              <input
                type="text"
                value={color2 || "#000000"}
                onChange={(e) => onColor2Change(e.target.value)}
                className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 font-mono text-xs uppercase text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color || "#000000"}
              onChange={(e) => onColorChange(e.target.value)}
              className="h-9 w-9 flex-none cursor-pointer rounded-lg border border-gray-200 bg-white p-0.5"
            />
            <input
              type="text"
              value={color || "#000000"}
              onChange={(e) => onColorChange(e.target.value)}
              className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 font-mono text-xs uppercase text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        )}
      </div>
    );
  };

  // Render Step 3 - Design
  const renderStep3 = () => (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Style your QR code</h2>
        <p className="mt-1 text-sm text-gray-500">Colors, shapes, a frame and your logo. The preview updates as you go.</p>
      </div>

      {/* Frame Options */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900"><FaImage className="h-3.5 w-3.5 text-indigo-500" />Frame</h3>
        
        {/* Frame Style Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-gray-700">Style</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {[
              { id: "none", label: "No frame", icon: "□" },
              { id: "label", label: "Label", icon: "━" },
              { id: "tag", label: "Tag", icon: "◤" },
              { id: "bubble", label: "Bubble", icon: "○" },
              { id: "badge", label: "Badge", icon: "◉" },
            ].map((frame) => (
              <button
                key={frame.id}
                type="button"
                onClick={() => updateDesignData({ ...designData, frameStyle: frame.id })}
                className={`
                  flex h-16 sm:h-20 flex-col items-center justify-center rounded-xl border text-[10px] sm:text-xs transition
                  ${designData.frameStyle === frame.id
                    ? "border-indigo-300 bg-indigo-50/60 text-indigo-700 ring-2 ring-indigo-500/20"
                    : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200"
                  }
                `}
                title={frame.label}
              >
                <div className="mb-1 text-lg">{frame.icon}</div>
                <span className="text-[10px] capitalize">{frame.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Frame Text (if frame is not "none") */}
        {designData.frameStyle !== "none" && (
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-gray-700">Text on the frame</label>
            <input
              type="text"
              value={designData.frameText || "Scan me!"}
              onChange={(e) => updateDesignData({ ...designData, frameText: e.target.value })}
              placeholder="Scan me!"
              className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        )}

        {/* Frame Colors */}
        {designData.frameStyle !== "none" && (
          <div className="space-y-4">
            <ColorPicker
              label="Frame color"
              color={designData.frameColor}
              onColorChange={(val) => updateDesignData({ ...designData, frameColor: val })}
            />
            <ColorPicker
              label="Frame background"
              color={designData.frameBgColor}
              color1={designData.frameBgColor1}
              color2={designData.frameBgColor2}
              useGradient={designData.frameBgUseGradient}
              transparent={designData.frameBgTransparent}
              showTransparent={true}
              onColorChange={(val) => updateDesignData({ ...designData, frameBgColor: val })}
              onGradientToggle={(val) => updateDesignData({ ...designData, frameBgUseGradient: val })}
              onColor1Change={(val) => updateDesignData({ ...designData, frameBgColor1: val })}
              onColor2Change={(val) => updateDesignData({ ...designData, frameBgColor2: val })}
              onTransparentToggle={(val) => updateDesignData({ ...designData, frameBgTransparent: val })}
            />
            <ColorPicker
              label="Text color"
              color={designData.frameTextColor || designData.frameColor}
              onColorChange={(val) => updateDesignData({ ...designData, frameTextColor: val })}
            />
          </div>
        )}
      </div>

      {/* QR Pattern Options */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900"><FaQrcode className="h-3.5 w-3.5 text-indigo-500" />Pattern</h3>
        
        {/* Pattern Style Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-gray-700">Style</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {["classic", "dots", "rounded", "pixels", "grid"].map((pattern) => (
              <button
                key={pattern}
                type="button"
                onClick={() => updateDesignData({ ...designData, patternStyle: pattern })}
                className={`
                  flex h-16 sm:h-20 flex-col items-center justify-center rounded-xl border text-[10px] sm:text-xs transition
                  ${designData.patternStyle === pattern
                    ? "border-indigo-300 bg-indigo-50/60 text-indigo-700 ring-2 ring-indigo-500/20"
                    : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200"
                  }
                `}
              >
                <div className={`mb-1 h-6 w-6 rounded ${
                  pattern === "dots" ? "bg-slate-900 rounded-full" :
                  pattern === "rounded" ? "bg-slate-900 rounded-md" :
                  pattern === "pixels" ? "bg-slate-900" :
                  pattern === "grid" ? "bg-slate-900 border border-slate-400" :
                  "bg-slate-900"
                }`}></div>
                <span className="capitalize text-[10px]">{pattern}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pattern Colors */}
        <div className="space-y-4">
          <ColorPicker
            label="Pattern color"
            color={designData.patternColor || designData.qrColor}
            onColorChange={(val) => updateDesignData({ ...designData, patternColor: val, qrColor: val })}
          />
          <ColorPicker
            label="Background"
            color={designData.patternBgColor || designData.bgColor}
            color1={designData.patternBgColor1}
            color2={designData.patternBgColor2}
            useGradient={designData.patternBgUseGradient}
            transparent={designData.patternBgTransparent}
            showTransparent={true}
            onColorChange={(val) => updateDesignData({ ...designData, patternBgColor: val, bgColor: val })}
            onGradientToggle={(val) => {
              const baseColor = designData.patternBgColor || designData.bgColor || "#ffffff";
              updateDesignData({ 
                ...designData, 
                patternBgUseGradient: val,
                // Initialize gradient colors from base color if not already set
                patternBgColor1: designData.patternBgColor1 || baseColor,
                patternBgColor2: designData.patternBgColor2 || baseColor,
              });
            }}
            onColor1Change={(val) => updateDesignData({ ...designData, patternBgColor1: val })}
            onColor2Change={(val) => updateDesignData({ ...designData, patternBgColor2: val })}
            onTransparentToggle={(val) => updateDesignData({ ...designData, patternBgTransparent: val, bgTransparent: val })}
          />
        </div>

        {/* Helper Note */}
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50/70 p-3 text-xs text-amber-800">
          <FaLightbulb className="mt-0.5 h-3 w-3 flex-none" />
          A dark pattern on a light background scans best. Low-contrast colors may not scan on every phone.
        </p>
      </div>

      {/* Corner Customization */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900"><FaPalette className="h-3.5 w-3.5 text-indigo-500" />Corners</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Corner Frame Style */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">Outer corners</label>
            <div className="grid grid-cols-4 gap-2 sm:gap-2">
              {["square", "rounded", "circle", "extra-rounded"].map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateDesignData({ ...designData, cornerFrameStyle: style })}
                  className={`
                    flex h-12 flex-col items-center justify-center rounded-xl border text-xs transition
                    ${designData.cornerFrameStyle === style
                      ? "border-indigo-300 bg-indigo-50/60 text-indigo-700 ring-2 ring-indigo-500/20"
                      : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200"
                    }
                  `}
                  title={style}
                >
                  <div className={`h-4 w-4 border-2 border-slate-700 ${
                    style === "square" ? "rounded-none" :
                    style === "rounded" ? "rounded-sm" :
                    style === "circle" ? "rounded-full" :
                    "rounded-md"
                  }`}></div>
                </button>
              ))}
            </div>
            <div className="mt-2">
              <ColorPicker
                label="Corner color"
                color={designData.cornerFrameColor}
                onColorChange={(val) => updateDesignData({ ...designData, cornerFrameColor: val })}
              />
            </div>
          </div>

          {/* Corner Dot Style */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">Inner dots</label>
            <div className="grid grid-cols-4 gap-2 sm:gap-2">
              {["square", "rounded", "circle", "extra-rounded"].map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateDesignData({ ...designData, cornerDotStyle: style })}
                  className={`
                    flex h-12 flex-col items-center justify-center rounded-xl border text-xs transition
                    ${designData.cornerDotStyle === style
                      ? "border-indigo-300 bg-indigo-50/60 text-indigo-700 ring-2 ring-indigo-500/20"
                      : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200"
                    }
                  `}
                  title={style}
                >
                  <div className={`h-4 w-4 bg-slate-700 ${
                    style === "square" ? "rounded-none" :
                    style === "rounded" ? "rounded-sm" :
                    style === "circle" ? "rounded-full" :
                    "rounded-md"
                  }`}></div>
                </button>
              ))}
            </div>
            <div className="mt-2">
              <ColorPicker
                label="Dot color"
                color={designData.cornerDotColor}
                onColorChange={(val) => updateDesignData({ ...designData, cornerDotColor: val })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logo Options */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900"><FaUpload className="h-3.5 w-3.5 text-indigo-500" />Logo</h3>
        
        {designData.logo ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={designData.logo}
                  alt="Logo preview"
                  className="h-20 w-20 rounded-xl border border-gray-200 bg-white object-contain p-2"
                />
              </div>
              <div className="flex-1">
                <p className="mb-1 text-sm font-medium text-gray-800">Logo added</p>
                <p className="text-xs text-gray-500">It sits in the middle of your QR code.</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="rounded-xl bg-red-50 p-2.5 text-red-600 transition hover:bg-red-100"
                title="Remove logo"
              >
                <FaTrash className="text-sm" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-6 transition hover:border-indigo-300 hover:bg-indigo-50/40">
              <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm"><FaUpload className="h-4 w-4" /></span>
              <span className="text-sm font-medium text-gray-800">Upload your logo</span>
              <span className="mt-1 text-xs text-gray-500">PNG, JPG, WebP or SVG. Big images are shrunk to {MAX_IMAGE_LABEL}.</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );


  const [copiedLink, setCopiedLink] = useState(false);

  // What the finished code contains: the short link for dynamic codes, the content itself for static ones
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const finalQrValue = success ? (success.linkType === "STATIC" ? success.staticContent : `${origin}/r/${success.slug}`) : null;
  const finalShortLink = success && success.linkType !== "STATIC" ? `${origin}/r/${success.slug}` : null;

  const openDownload = () => {
    setPreviewMode("qr");
    setShowDownloadModal(true);
  };

  const copyShortLink = async () => {
    if (!finalShortLink) return;
    try {
      await navigator.clipboard.writeText(finalShortLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      /* the link is visible to copy by hand */
    }
  };

  // Start over with a blank form
  const resetAll = () => {
    setFormData(INITIAL_FORM_DATA);
    setDesignData(INITIAL_DESIGN_DATA);
    setSelectedType(null);
    setHoveredType(null);
    setSuccess(null);
    setError("");
    setErrorJSX(null);
    setPreviewMode("destination");
    setPreviewKey((k) => k + 1);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (subscriptionStatus !== null && !canCreate) {
    const trialEnded = subscriptionStatus.status === "TRIAL_EXPIRED";
    return (
      <DashboardLayout title="Create a QR code" description="">
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center sm:p-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <FaExclamationTriangle className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-lg font-semibold text-amber-900">{trialEnded ? "Your free trial has ended" : "Your subscription has ended"}</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-amber-800">
            {trialEnded
              ? "Subscribe to the Basic plan to create new QR codes and switch your existing ones back on."
              : "Renew the Basic plan to create new QR codes and switch your existing ones back on."}
          </p>
          <Link
            href="/dashboard/billing"
            className="btn-shine mt-6 inline-flex items-center justify-center rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold !text-white shadow-sm transition hover:bg-amber-700"
          >
            View plans
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const nextDisabled = (step === 1 && !canContinueFromStep1) || (step === 2 && !canContinueFromStep2());
  const qrPreviewAvailable = !!success || canGenerateQR;
  const isWifi = selectedType === "wifi";
  const willBeDynamic = !isWifi && (formData.linkType || "DYNAMIC") === "DYNAMIC";

  return (
    <DashboardLayout title="Create a QR code" description="Choose a type, add your content and make it yours.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left: steps */}
        <div className="min-w-0 space-y-5">
          <StepIndicator currentStep={step} allDone={!!success} onStepClick={(s) => setStep(s)} />

          {success ? (
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-indigo-50 p-6 text-center shadow-sm sm:p-10">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                <FaCheck className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-2xl font-bold text-gray-900">Your QR code is ready</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600">
                {success.linkType === "STATIC"
                  ? isWifi
                    ? "Print it where guests can see it: their phone joins the network as soon as they scan it."
                    : "It holds your content directly, so it keeps working even without QR Genie."
                  : "Download it and print it. You can change where it points, pause it or check its scans at any time."}
              </p>

              {finalShortLink && (
                <div className="mx-auto mt-5 flex max-w-sm items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5 pl-3.5 shadow-sm">
                  <span className="min-w-0 flex-1 truncate text-left text-sm text-gray-700">{finalShortLink.replace(/^https?:\/\//, "")}</span>
                  <button
                    type="button"
                    onClick={copyShortLink}
                    className="btn-shine btn-shine-soft inline-flex h-8 flex-none items-center gap-1.5 rounded-lg bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    {copiedLink ? <FaCheck className="h-3 w-3" /> : <FaCopy className="h-3 w-3" />}
                    {copiedLink ? "Copied" : "Copy"}
                  </button>
                </div>
              )}

              {success.isProtected && (
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-600/20">
                  <FaLock className="h-3 w-3" />
                  Password protected
                </p>
              )}

              <div className="mt-7 flex flex-col flex-wrap justify-center gap-2 whitespace-nowrap sm:flex-row">
                <button
                  type="button"
                  onClick={openDownload}
                  className="btn-shine inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-purple-700"
                >
                  <FaDownload className="h-3.5 w-3.5" />
                  Download
                </button>
                {success.id && (
                  <Link
                    href={`/dashboard/qrs/${success.id}`}
                    className="btn-shine btn-shine-soft inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-medium !text-gray-700 shadow-sm transition hover:border-indigo-300 hover:!text-indigo-700"
                  >
                    View details
                  </Link>
                )}
                <button
                  type="button"
                  onClick={resetAll}
                  className="btn-shine btn-shine-soft inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  <FaPlus className="h-3 w-3" />
                  Create another
                </button>
              </div>
              <Link href="/dashboard" className="mt-5 inline-block text-sm font-medium !text-gray-500 hover:!text-indigo-600">
                Go to My QR codes
              </Link>
            </div>
          ) : (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                // Enter in a field only moves forward; the code is created by the Create QR code button alone
                e.preventDefault();
                if (step < 3) goNext();
              }}
            >
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}

                {errorJSX && <div className="mt-5">{errorJSX}</div>}
                {error && !errorJSX && (
                  <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                    <FaExclamationTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
                    {error}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className={`btn-shine btn-shine-soft inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 ${
                    step === 1 ? "invisible" : ""
                  }`}
                >
                  <FaArrowLeft className="h-3 w-3" />
                  Back
                </button>

                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3">
                  {step === 2 && nextDisabled && <p className="text-right text-xs text-gray-500">{getRequiredFieldsMessage(selectedType)}</p>}
                  {/* Separate keys: React must not turn the clicked Next button into the Create button mid-click */}
                  {step < 3 ? (
                    <button
                      key="next"
                      type="button"
                      onClick={goNext}
                      disabled={nextDisabled}
                      className="btn-shine inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                    >
                      {step === 1 ? "Continue" : "Next: style it"}
                      <FaArrowRight className="h-3 w-3" />
                    </button>
                  ) : (
                    <button
                      key="create"
                      type="button"
                      onClick={handleSubmit}
                      disabled={saving || !canContinueFromStep2()}
                      className="btn-shine inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? "Creating…" : "Create QR code"}
                      {!saving && <FaCheck className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Right: live preview */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-[6.5rem] lg:self-start">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">Live preview</h3>
                <p className="truncate text-xs text-gray-500">
                  {previewMode === "qr" ? (success ? "Your finished QR code" : "How your code will look") : "What people see after scanning"}
                </p>
              </div>
              <div role="tablist" aria-label="Preview" className="inline-flex flex-none rounded-lg bg-gray-100 p-0.5">
                <button
                  type="button"
                  role="tab"
                  aria-selected={previewMode === "destination"}
                  onClick={() => setPreviewMode("destination")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    previewMode === "destination" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Page
                </button>
                <span title={qrPreviewAvailable ? undefined : selectedType ? getRequiredFieldsMessage(selectedType) : "Choose a QR type first"}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewMode === "qr"}
                    disabled={!qrPreviewAvailable}
                    onClick={() => setPreviewMode("qr")}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      previewMode === "qr" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    QR code
                  </button>
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <MobilePreview
                key={`preview-${selectedType}-${previewKey}`}
                qrType={hoveredType || selectedType}
                formData={formData}
                designData={designData}
                previewMode={previewMode}
                qrCodeUrl={finalQrValue || qrCodeUrl}
                qrPreviewRef={qrPreviewRef}
              />
            </div>

            {previewMode === "qr" && !success && willBeDynamic && selectedType && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-indigo-50/70 p-3 text-xs leading-relaxed text-indigo-800">
                <FaInfoCircle className="mt-0.5 h-3 w-3 flex-none" />
                Preview only. Your finished code will hold its own short link, created when you click Create QR code.
              </p>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-white text-amber-500 shadow-sm">
              <FaLightbulb className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs leading-relaxed text-gray-600">
              <span className="font-semibold text-gray-800">Tip:</span> print codes at least 2 cm wide and test them with a phone before a big
              print run.
            </p>
          </div>
        </aside>
      </div>

      {/* Download dialog */}
      {showDownloadModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Download QR code"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-gray-900/40 p-4 backdrop-blur-sm sm:items-center"
          onMouseDown={(e) => e.target === e.currentTarget && setShowDownloadModal(false)}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FaDownload className="h-4 w-4" />
              </span>
              <h3 className="flex-1 text-base font-semibold text-gray-900">Download your QR code</h3>
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                aria-label="Close"
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 px-5 py-5">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Format</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "png", label: "PNG", note: "Web & print", icon: FaFileImage },
                    { id: "svg", label: "SVG", note: "Any size", icon: FaFileImage },
                    { id: "pdf", label: "PDF", note: "Documents", icon: FaFilePdf },
                    { id: "jpg", label: "JPEG", note: "Photos", icon: FaFileImage },
                    { id: "print", label: "Print", note: "Printer", icon: FaPrint },
                  ].map((format) => {
                    const Icon = format.icon;
                    const selected = downloadFormat === format.id;
                    return (
                      <button
                        key={format.id}
                        type="button"
                        onClick={() => setDownloadFormat(format.id)}
                        aria-pressed={selected}
                        className={`flex flex-col items-center justify-center rounded-xl border p-3 transition ${
                          selected ? "border-indigo-300 bg-indigo-50/60 text-indigo-700 ring-2 ring-indigo-500/20" : "border-gray-200 text-gray-600 hover:border-indigo-200"
                        }`}
                      >
                        <Icon className="mb-1.5 h-5 w-5" />
                        <span className="text-xs font-semibold">{format.label}</span>
                        <span className="text-[10px] text-gray-400">{format.note}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {downloadFormat !== "svg" && downloadFormat !== "print" && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "512x512", label: "Small", note: "512 px" },
                      { id: "default", label: "Standard", note: "1024 px" },
                      { id: "2048x2048", label: "Large", note: "2048 px" },
                      { id: "4096x4096", label: "Poster", note: "4096 px" },
                    ].map((size) => {
                      const selected = downloadSize === size.id || (size.id === "default" && downloadSize === "1024x1024");
                      return (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => setDownloadSize(size.id)}
                          aria-pressed={selected}
                          className={`rounded-xl border px-3 py-2 text-left transition ${
                            selected ? "border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-500/20" : "border-gray-200 hover:border-indigo-200"
                          }`}
                        >
                          <span className={`block text-xs font-semibold ${selected ? "text-indigo-700" : "text-gray-700"}`}>{size.label}</span>
                          <span className="block text-[10px] text-gray-400">{size.note}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="btn-shine btn-shine-soft rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadQR}
                disabled={saving}
                className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
              >
                {downloadFormat === "print" ? <FaPrint className="h-3.5 w-3.5" /> : <FaDownload className="h-3.5 w-3.5" />}
                {downloadFormat === "print" ? "Print" : "Download"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}