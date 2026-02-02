// pages/dashboard/create-qr.js

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import DashboardLayout from "../../components/DashboardLayout";
import DynamicForm from "../../components/qrFields/DynamicForm";
import { getSchemaForType } from "../../lib/qrSchemas";
import { createQRConfig } from "../../components/DesignedQRCode";
import { downloadDesignedQR } from "../../lib/qrDownload";

// Server-side authentication check
export async function getServerSideProps(context) {
  const { getUserFromRequest } = await import('../../lib/auth');
  const user = await getUserFromRequest(context.req);
  if (!user) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
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
} from "react-icons/fa";

// QR Type definitions with icons and field schemas
const qrTypes = [
  {
    id: "website",
    label: "Website",
    description: "Link to any website URL",
    icon: FaGlobe,
    active: true,
    color: "indigo"
  },
  {

    id: "wifi",
    label: "WiFi",
    description: "Connect to a WiFi network",
    icon: FaWifi,
    active: true,
    color: "cyan"
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    description: "Get WhatsApp messages",
    icon: FaWhatsapp,
    active: true,
    color: "emerald"
  },
  {

    id: "instagram",
    label: "Instagram",
    description: "Share your Instagram",
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
    
    const bgColor = designData?.patternBgTransparent || designData?.bgTransparent
      ? "transparent"
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
const MobilePreview = ({ qrType, formData, designData, previewMode = "destination", qrCodeUrl }) => {
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
        
        const bgColor = designData?.patternBgTransparent || designData?.bgTransparent
          ? "transparent"
          : designData?.patternBgUseGradient || designData?.useGradientBg
            ? designData.patternBgColor1 || designData.bgColor1 || designData.bgColor || "#ffffff"
            : designData?.patternBgColor || designData?.bgColor || "#ffffff";
        
        const bgGradient = (designData?.patternBgUseGradient || designData?.useGradientBg) && !(designData?.patternBgTransparent || designData?.bgTransparent)
          ? `linear-gradient(135deg, ${designData.patternBgColor1 || designData.bgColor1 || "#ffffff"}, ${designData.patternBgColor2 || designData.bgColor2 || "#ffffff"})`
          : null;

        // Frame wrapper styles
        const getFrameStyles = () => {
          if (designData?.frameStyle === "none") return {};
          
          const frameColor = designData?.frameUseGradient
            ? `linear-gradient(135deg, ${designData.frameColor1 || "#000000"}, ${designData.frameColor2 || "#000000"})`
            : designData?.frameColor || "#000000";
          
          const frameBg = designData?.frameBgTransparent
            ? "transparent"
            : designData?.frameBgUseGradient
              ? `linear-gradient(135deg, ${designData.frameBgColor1 || "#ffffff"}, ${designData.frameBgColor2 || "#ffffff"})`
              : designData?.frameBgColor || "#ffffff";
          
          return {
            border: `4px solid ${designData?.frameUseGradient ? "transparent" : frameColor}`,
            background: designData?.frameUseGradient ? frameColor : frameBg,
            backgroundImage: designData?.frameUseGradient ? frameColor : undefined,
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
                className="flex flex-col items-center justify-center shadow-xl relative"
                style={getFrameStyles()}
              >
                {/* Frame Text (if applicable) */}
                {designData?.frameStyle !== "none" && designData?.frameText && (
                  <div className="mb-2">
                    <span 
                      className="text-sm font-semibold px-3 py-1 rounded block"
                      style={{
                        color: designData?.frameUseGradient ? "#ffffff" : 
                               designData?.frameColor || "#000000",
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
        // Show preloader when QR code is being generated
        return <QRScanningPreloader />;
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

            {/* Website Content Area */}
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
                
                {/* Protected indicator */}
                {passwordEnabled && (
                  <div className="mb-6 flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
                    <FaLock className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs text-indigo-700 font-medium">This website is password protected</span>
                  </div>
                )}
                
                {/* Sample Content Blocks */}
                <div className="mt-8 space-y-4">
                  <div className="h-32 bg-gray-100 rounded-lg"></div>
                  <div className="h-24 bg-gray-50 rounded-lg"></div>
                </div>
              </div>
            </div>

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
                    className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-full text-sm font-medium shadow-md active:opacity-90 transition-opacity"
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
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Connect
                  </button>
                  <button
                    className="w-full bg-white border-2 border-indigo-600 text-indigo-600 font-semibold py-3 px-6 rounded-xl hover:bg-indigo-50 transition-all duration-200"
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
                  <button className="flex-1 bg-[#0095F6] text-white text-sm font-semibold py-2 px-4 rounded-lg">
                    Follow
                  </button>
                  <button className="flex-1 bg-white border border-gray-300 text-gray-900 text-sm font-semibold py-2 px-4 rounded-lg">
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
          <div className="h-full bg-white p-4 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <FaQrcode className="text-4xl mx-auto mb-2" />
              <p className="text-sm">Preview</p>
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
const StepIndicator = ({ currentStep, onStepClick }) => {
  const steps = [
    { id: 1, label: "Type of QR code", shortLabel: "Type" },
    { id: 2, label: "Content", shortLabel: "Content" },
    { id: 3, label: "QR design", shortLabel: "Design" },
  ];

  return (
    <div className="mb-4 sm:mb-6 w-full overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0">
      <div className="flex items-center gap-2 sm:gap-4 min-w-max sm:min-w-0">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => onStepClick && onStepClick(step.id)}
              className={`
                flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 text-xs sm:text-sm font-medium transition-all flex-shrink-0
                ${currentStep === step.id
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                  : currentStep > step.id
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 bg-white text-slate-500 hover:border-slate-400"
                }
              `}
            >
              {currentStep > step.id ? "✓" : step.id}
            </button>
            <span
              className={`
                text-xs sm:text-sm font-medium whitespace-nowrap
                ${currentStep === step.id || currentStep > step.id
                  ? "text-slate-900"
                  : "text-slate-500"
                }
              `}
            >
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{step.shortLabel}</span>
            </span>
            {idx < steps.length - 1 && (
              <div
                className={`
                  h-0.5 w-6 sm:w-12 transition-all flex-shrink-0
                  ${currentStep > step.id ? "bg-emerald-500" : "bg-slate-200"}
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function CreateQrPage() {

  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [hoveredType, setHoveredType] = useState(null);
  const [previewMode, setPreviewMode] = useState("destination"); // "destination" | "qr"

  // Form data - unified state
  const [formData, setFormData] = useState({
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
  });

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
  const [designData, setDesignData] = useState({
    // Frame options
    frameStyle: "none", // none, label, tag, bubble, badge
    frameText: "Scan me!",
    frameColor: "#000000",
    frameUseGradient: false,
    frameColor1: "#000000",
    frameColor2: "#000000",
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

  });

  // Wrapper to update design data and trigger preview refresh
  const updateDesignData = (newData) => {
    setDesignData(newData);
    setPreviewKey(prev => prev + 1);
  };

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("png");
  const [downloadSize, setDownloadSize] = useState("default");

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
        return "Please fill data like Website URL*";
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
        return "Please fill data like Country* and Phone Number*";
      case "mp3":
        return "Please fill data like MP3 URL*";
      case "menu":
        return "Please fill data like Restaurant Name* and Menu Items*";
      case "wifi":
        const wifiDataCheck = formData.wifi || {};
        const securityCheck = wifiDataCheck.security || "WPA";
        if (securityCheck !== "nopass") {
          return "Please fill data like Network name* and Network password*";
        }
        return "Please fill data like Network name*";
      case "apps":
        return "Please fill data like iOS or Android App URL*";
      case "coupon":
        return "Please fill data like Coupon Title* and Code*";
      case "facebook":
        return "Please fill data like Facebook URL*";
      case "instagram":
        return "Please fill data like Username*";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canContinueFromStep2()) {
      setStep(2);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(null);

    try {
      const res = await fetch("/api/create-dynamic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({
          qrType: selectedType,
          ...formData, // Send all form data
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
        setError(data.error || "Could not create QR code.");
      } else {
        setSuccess({
          slug: data.slug,
          shortUrl: data.dynamicUrl || `/r/${data.slug}`,
        });
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
  const renderStep1 = () => (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        Select a type of QR code
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {qrTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          const isHovered = hoveredType === type.id;

          const isActive = type.active !== false;
          return (
            <button
              key={type.id}
              type="button"

              onClick={() => {
                if (isActive) {
                  setSelectedType(type.id);
                  // Auto-navigate to step 2 after selection
                  setTimeout(() => setStep(2), 300);
                }
              }}
              onMouseEnter={() => {
                if (isActive) {
                  setHoveredType(type.id);
                }
              }}
              onMouseLeave={() => setHoveredType(null)}
              disabled={!isActive}
              className={`
                group relative flex flex-col items-center justify-center rounded-lg sm:rounded-xl border-2 p-3 sm:p-4 transition-all
                ${!isActive
                  ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                  : isSelected
                    ? "border-indigo-600 bg-indigo-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }
              `}
            >
              <div
                className={`
                  mb-2 flex h-12 w-12 items-center justify-center rounded-lg transition-colors

                  ${!isActive
                    ? "bg-slate-100 text-slate-400"
                    : isSelected
                      ? "bg-indigo-600 text-white"
                      : `bg-slate-100 text-slate-600 group-hover:bg-slate-200`
                  }
                `}
              >
                <Icon className="text-xl" />
              </div>
              <span
                className={`
                  text-sm font-medium

                  ${!isActive
                    ? "text-slate-400"
                    : isSelected
                      ? "text-indigo-700"
                      : "text-slate-700"
                  }
                `}
              >
                {type.label}
              </span>

              <span className={`mt-1 text-xs ${!isActive ? "text-slate-400" : "text-slate-500"}`}>
                {type.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render Step 2 - Dynamic Content Form
  const renderStep2 = () => {
    if (!selectedType) return null;

    const schema = getSchemaForType(selectedType);

    const updateFormData = (newData) => {
      setFormData(newData);

      // Force preview update
      setPreviewKey(prev => prev + 1);
    };

    return (
      <DynamicForm
        schema={schema}
        formData={formData}
        updateFormData={updateFormData}

        type={selectedType}
        folders={folders}
        onFolderCreated={handleFolderCreated}
      />
    );
  };


  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (1 MB max)
    if (file.size > 1024 * 1024) {
      setError("Logo file size must be less than 1 MB");
      return;
    }
    
    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    
    // Convert to data URL for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      updateDesignData({ ...designData, logo: reader.result });
    };
    reader.readAsDataURL(file);
  };
  
  // Remove logo
  const handleRemoveLogo = () => {
    updateDesignData({ ...designData, logo: null });
  };

  // Download QR code handler - uses shared download utility for consistency
  const handleDownloadQR = async () => {
    if (!qrCodeUrl) return;

    // Map downloadSize to shared utility format
    const sizeMap = {
      default: "default",
      "512x512": 512,
      "1024x1024": "default",
      "2048x2048": "large",
      "4096x4096": "xl",
    };

    const size = sizeMap[downloadSize] || "default";
    
    // Map "eps" format to "svg" (closest format)
    const format = downloadFormat === "eps" ? "svg" : downloadFormat;

    try {
      await downloadDesignedQR(qrCodeUrl, designData, format, size, "qr-code");
      setShowDownloadModal(false);
    } catch (error) {
      console.error("Download error:", error);
      setError("Failed to download QR code. Please try again.");
    }
  };

  // Color picker component with optional gradient support
  const ColorPicker = ({ label, color, color1, color2, useGradient, onColorChange, onGradientToggle, onColor1Change, onColor2Change, showTransparent = false, transparent = false, onTransparentToggle }) => {
    // Check if gradient is supported (gradient props are provided)
    const supportsGradient = onGradientToggle && onColor1Change && onColor2Change;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-700">{label}</label>
          <div className="flex items-center gap-2">
            {showTransparent && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transparent}
                  onChange={(e) => onTransparentToggle(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-600">Transparent</span>
              </label>
            )}
            {supportsGradient && !transparent && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useGradient || false}
                  onChange={(e) => onGradientToggle(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-600">Gradient</span>
              </label>
            )}
          </div>
        </div>
        {transparent ? (
          <div className="text-xs text-slate-500 italic">Background is transparent</div>
        ) : (supportsGradient && useGradient) ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color1 || "#000000"}
                onChange={(e) => onColor1Change(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-slate-300"
              />
              <input
                type="text"
                value={color1 || "#000000"}
                onChange={(e) => onColor1Change(e.target.value)}
                className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color2 || "#000000"}
                onChange={(e) => onColor2Change(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-slate-300"
              />
              <input
                type="text"
                value={color2 || "#000000"}
                onChange={(e) => onColor2Change(e.target.value)}
                className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color || "#000000"}
              onChange={(e) => onColorChange(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border border-slate-300"
            />
            <input
              type="text"
              value={color || "#000000"}
              onChange={(e) => onColorChange(e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1">3. Design the QR</h2>
        <p className="text-xs sm:text-sm text-slate-600">Customize the appearance of your QR code</p>
      </div>

      {/* Frame Options */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="mb-3 sm:mb-4 text-sm font-semibold text-slate-900">Frame</h3>
        
        {/* Frame Style Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-slate-700">Frame Style</label>
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
                  flex h-16 sm:h-20 flex-col items-center justify-center rounded-lg border-2 text-[10px] sm:text-xs transition-all
                  ${designData.frameStyle === frame.id
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
            <label className="mb-2 block text-xs font-medium text-slate-700">Frame Text</label>
            <input
              type="text"
              value={designData.frameText || "Scan me!"}
              onChange={(e) => updateDesignData({ ...designData, frameText: e.target.value })}
              placeholder="Scan me!"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Frame Colors */}
        {designData.frameStyle !== "none" && (
          <div className="space-y-4">
            <ColorPicker
              label="Frame Color"
              color={designData.frameColor}
              color1={designData.frameColor1}
              color2={designData.frameColor2}
              useGradient={designData.frameUseGradient}
              onColorChange={(val) => updateDesignData({ ...designData, frameColor: val })}
              onGradientToggle={(val) => updateDesignData({ ...designData, frameUseGradient: val })}
              onColor1Change={(val) => updateDesignData({ ...designData, frameColor1: val })}
              onColor2Change={(val) => updateDesignData({ ...designData, frameColor2: val })}
            />
            <ColorPicker
              label="Frame Background"
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
          </div>
        )}
      </div>

      {/* QR Pattern Options */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="mb-3 sm:mb-4 text-sm font-semibold text-slate-900">QR Pattern</h3>
        
        {/* Pattern Style Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-slate-700">Pattern Style</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {["classic", "dots", "rounded", "pixels", "grid"].map((pattern) => (
              <button
                key={pattern}
                type="button"
                onClick={() => updateDesignData({ ...designData, patternStyle: pattern })}
                className={`
                  flex h-16 sm:h-20 flex-col items-center justify-center rounded-lg border-2 text-[10px] sm:text-xs transition-all
                  ${designData.patternStyle === pattern
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
            label="Pattern Color"
            color={designData.patternColor || designData.qrColor}
            onColorChange={(val) => updateDesignData({ ...designData, patternColor: val, qrColor: val })}
          />
          <ColorPicker
            label="Pattern Background"
            color={designData.patternBgColor || designData.bgColor}
            color1={designData.patternBgColor1}
            color2={designData.patternBgColor2}
            useGradient={designData.patternBgUseGradient}
            transparent={designData.patternBgTransparent}
            showTransparent={true}
            onColorChange={(val) => updateDesignData({ ...designData, patternBgColor: val, bgColor: val })}
            onGradientToggle={(val) => updateDesignData({ ...designData, patternBgUseGradient: val })}
            onColor1Change={(val) => updateDesignData({ ...designData, patternBgColor1: val })}
            onColor2Change={(val) => updateDesignData({ ...designData, patternBgColor2: val })}
            onTransparentToggle={(val) => updateDesignData({ ...designData, patternBgTransparent: val, bgTransparent: val })}
          />
        </div>

        {/* Helper Note */}
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Remember!</span> Use high-contrast colors for best scan results.
          </p>
        </div>
      </div>

      {/* Corner Customization */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="mb-3 sm:mb-4 text-sm font-semibold text-slate-900">Corner Customization</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Corner Frame Style */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700">Corner Frame Style</label>
            <div className="grid grid-cols-4 gap-2 sm:gap-2">
              {["square", "rounded", "circle", "extra-rounded"].map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateDesignData({ ...designData, cornerFrameStyle: style })}
                  className={`
                    flex h-12 flex-col items-center justify-center rounded-lg border-2 text-xs transition-all
                    ${designData.cornerFrameStyle === style
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
                label="Corner Frame Color"
                color={designData.cornerFrameColor}
                useGradient={false}
                onColorChange={(val) => updateDesignData({ ...designData, cornerFrameColor: val })}
                onGradientToggle={() => {}}
                onColor1Change={() => {}}
                onColor2Change={() => {}}
              />
            </div>
          </div>

          {/* Corner Dot Style */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700">Corner Dot Style</label>
            <div className="grid grid-cols-4 gap-2 sm:gap-2">
              {["square", "rounded", "circle", "extra-rounded"].map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateDesignData({ ...designData, cornerDotStyle: style })}
                  className={`
                    flex h-12 flex-col items-center justify-center rounded-lg border-2 text-xs transition-all
                    ${designData.cornerDotStyle === style
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
                label="Corner Dot Color"
                color={designData.cornerDotColor}
                useGradient={false}
                onColorChange={(val) => updateDesignData({ ...designData, cornerDotColor: val })}
                onGradientToggle={() => {}}
                onColor1Change={() => {}}
                onColor2Change={() => {}}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logo Options */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="mb-3 sm:mb-4 text-sm font-semibold text-slate-900">Logo</h3>
        
        {designData.logo ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={designData.logo}
                  alt="Logo preview"
                  className="h-20 w-20 rounded-lg border-2 border-slate-200 object-contain bg-white p-2"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 mb-1">Logo uploaded</p>
                <p className="text-xs text-slate-500">Your logo will appear in the center of the QR code</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
                title="Remove logo"
              >
                <FaTrash className="text-sm" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700">Upload Logo</label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition-colors hover:border-indigo-400 hover:bg-indigo-50">
              <FaUpload className="mb-2 text-2xl text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Click to upload</span>
              <span className="mt-1 text-xs text-slate-500">PNG, JPG up to 1 MB</span>
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


  if (subscriptionStatus !== null && !canCreate) {
    return (
      <DashboardLayout title="Create QR Code" description="">
        <div className="max-w-xl mx-auto py-8 px-4 text-center">
          <p className="text-gray-700 mb-6">
            Your free trial has ended. Please choose a plan to continue creating QR codes.
          </p>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:from-indigo-700 hover:to-purple-700"
          >
            View Plans
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Create QR Code"
      description="Create a dynamic QR code in three simple steps"
    >

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_400px] gap-4 sm:gap-6">
        {/* Left: Main Content */}
        <div className="space-y-4 sm:space-y-6 min-w-0">
          <StepIndicator currentStep={step} />

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Step Content */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 md:p-6">
              {step === 1 && renderStep1()}
              {step === 2 && (
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-slate-900">
                    2. Add content to your QR code
                  </h2>
                  {renderStep2()}
                </div>
              )}
              {step === 3 && renderStep3()}

              {/* Error/Success Messages */}
              {error && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
                  <p className="font-medium mb-1">QR code created successfully!</p>

                  {/* Hide short link for website, wifi, instagram, whatsapp */}
                  {!["website", "wifi", "instagram", "whatsapp"].includes(selectedType) && (
                    <p className="mb-3">
                      Short link:{" "}
                      <Link
                        href={success.shortUrl}
                        className="font-mono text-xs text-emerald-800 underline"
                        target="_blank"
                      >
                        {success.shortUrl}
                      </Link>
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowDownloadModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                  >
                    <FaDownload className="w-3 h-3" />
                    Download QR Code
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1}

                className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={
                    (step === 1 && !canContinueFromStep1) ||
                    (step === 2 && !canContinueFromStep2())
                  }

                  className="w-full sm:w-auto rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              ) : (

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {qrCodeUrl && (
                    <button
                      type="button"
                      onClick={() => setShowDownloadModal(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-2.5 text-sm font-semibold text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <FaDownload className="w-4 h-4" />
                      Download
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving || !canContinueFromStep2()}
                    className="w-full sm:w-auto rounded-lg bg-indigo-600 px-4 sm:px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? "Creating..." : "Create QR Code"}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>


        {/* Download Modal */}
        {showDownloadModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDownloadModal(false);
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Select the format to download</h3>
                <button
                  type="button"
                  onClick={() => setShowDownloadModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Format Options */}
                <div className="mb-6">
                  <label className="mb-3 block text-sm font-medium text-slate-700">Format</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "png", label: "PNG", icon: FaFileImage },
                      { id: "jpg", label: "JPEG", icon: FaFileImage },
                      { id: "svg", label: "SVG", icon: FaFileImage },
                      { id: "pdf", label: "PDF", icon: FaFilePdf },
                      { id: "eps", label: "EPS", icon: FaFileImage },
                      { id: "print", label: "Print", icon: FaPrint },
                    ].map((format) => {
                      const Icon = format.icon;
                      return (
                        <button
                          key={format.id}
                          type="button"
                          onClick={() => setDownloadFormat(format.id)}
                          className={`
                            flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                            ${downloadFormat === format.id
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }
                          `}
                        >
                          <Icon className="w-6 h-6 mb-2" />
                          <span className="text-xs font-medium">{format.label}</span>
                          <input
                            type="radio"
                            checked={downloadFormat === format.id}
                            onChange={() => setDownloadFormat(format.id)}
                            className="mt-2 h-3 w-3 text-indigo-600 focus:ring-indigo-500"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* File Size Options */}
                <div className="mb-6">
                  <label className="mb-3 block text-sm font-medium text-slate-700">File size</label>
                  <div className="space-y-2">
                    {["default", "512x512", "1024x1024", "2048x2048", "4096x4096"].map((size) => (
                      <label
                        key={size}
                        className={`
                          flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                          ${downloadSize === size
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="downloadSize"
                          value={size}
                          checked={downloadSize === size}
                          onChange={(e) => setDownloadSize(e.target.value)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-3 text-sm text-slate-700">
                          {size === "default" ? "Default" : size}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDownloadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <FaDownload className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right: Preview Panel */}
        <div className="space-y-4 order-first lg:order-last">
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 md:p-6">
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPreviewMode("destination")}
                  className={`
                    rounded-lg px-3 py-1 text-xs font-medium transition-colors
                    ${previewMode === "destination"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }
                  `}
                >
                  Destination
                </button>

                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      if (canGenerateQR) {
                        setPreviewMode("qr");
                      }
                    }}
                    disabled={!canGenerateQR}
                    className={`
                      rounded-lg px-3 py-1 text-xs font-medium transition-colors relative
                      ${previewMode === "qr"
                        ? "bg-indigo-100 text-indigo-700"
                        : canGenerateQR
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                      }
                    `}
                  >
                    QR Code
                  </button>
                  {!canGenerateQR && selectedType && (
                    <div className="absolute bottom-full right-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 overflow-hidden">
                      {/* Header */}
                      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                            <svg className="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">Required Fields Missing</span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="px-4 py-3">
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {getRequiredFieldsMessage(selectedType)}
                        </p>
                      </div>
                      
                      {/* Arrow */}
                      <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
                      <div className="absolute top-full right-[22px] w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-transparent border-t-gray-200"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-center w-full">
              <div className="w-full max-w-sm mx-auto">
                <MobilePreview
                  key={`preview-${selectedType}-${previewKey}`}
                  qrType={hoveredType || selectedType}
                  formData={formData}
                  designData={designData}
                  previewMode={previewMode}
                  qrCodeUrl={qrCodeUrl}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <p className="text-xs font-medium text-slate-800 mb-1">💡 Tip</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Use high contrast between QR color and background for best scan reliability. Dark QR on light background works best.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
