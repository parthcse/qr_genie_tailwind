// components/qr/DesignedQRCode.js
// Shared component for rendering fully designed QR codes (with frame, colors, logo, etc.)
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { createQRConfig } from "@/lib/qr/qrConfig";

// Dynamically import QRCodeSVG as fallback
const QRCodeSVG = dynamic(() => import("qrcode.react").then((mod) => mod.QRCodeSVG), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg"></div>
});

/**
 * DesignedQRCode Component
 * Renders a fully designed QR code with frame, colors, logo, etc.
 * 
 * @param {string} value - The QR code value/content
 * @param {object} designData - Design configuration object
 * @param {number} size - Size of the QR code (default: 200)
 * @param {boolean} showFrame - Whether to show the frame text (default: true)
 * @param {string} className - Additional CSS classes
 */
export default function DesignedQRCode({ 
  value, 
  designData = {}, 
  size = 200, 
  showFrame = true,
  className = "" 
}) {
  const qrRef = useRef(null);
  const [QRCodeStylingClass, setQRCodeStylingClass] = useState(null);
  const [qrInstance, setQrInstance] = useState(null);

  useEffect(() => {
    // Dynamically import qr-code-styling only on client side
    if (typeof window !== "undefined") {
      import("qr-code-styling").then((module) => {
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

  // Parse designData if it's a string (from API)
  let parsedDesignData = designData;
  if (typeof designData === "string") {
    try {
      parsedDesignData = JSON.parse(designData);
    } catch (e) {
      console.error("Error parsing designData:", e);
      parsedDesignData = {};
    }
  }

  // Fallback to QRCodeSVG if qr-code-styling is not available
  if (!QRCodeStylingClass) {
    const patternColor = parsedDesignData?.patternUseGradient
      ? parsedDesignData.patternColor1 || parsedDesignData.patternColor || "#000000"
      : parsedDesignData?.patternColor || parsedDesignData?.qrColor || "#000000";
    
    const bgColor = parsedDesignData?.patternBgTransparent || parsedDesignData?.bgTransparent
      ? "transparent"
      : parsedDesignData?.patternBgUseGradient || parsedDesignData?.useGradientBg
        ? parsedDesignData.patternBgColor1 || parsedDesignData.bgColor1 || parsedDesignData.bgColor || "#ffffff"
        : parsedDesignData?.patternBgColor || parsedDesignData?.bgColor || "#ffffff";

    // Get frame styles for fallback
    const getFrameStylesFallback = () => {
      if (!showFrame || !parsedDesignData?.frameStyle || parsedDesignData.frameStyle === "none") {
        return {};
      }
      
      // Frame Color always controls border color only (no gradient support)
      const frameBorderColor = parsedDesignData?.frameColor || "#000000";
      
      // Frame Background controls the background inside the frame
      const frameBg = parsedDesignData?.frameBgTransparent
        ? "transparent"
        : parsedDesignData?.frameBgUseGradient
          ? `linear-gradient(135deg, ${parsedDesignData.frameBgColor1 || "#ffffff"}, ${parsedDesignData.frameBgColor2 || "#ffffff"})`
          : parsedDesignData?.frameBgColor || "#ffffff";
      
      return {
        border: `4px solid ${frameBorderColor}`,
        background: frameBg,
        backgroundImage: parsedDesignData?.frameBgUseGradient ? frameBg : undefined,
        padding: "16px",
        borderRadius: parsedDesignData?.frameStyle === "bubble" ? "24px" : 
                     parsedDesignData?.frameStyle === "badge" ? "12px" :
                     parsedDesignData?.frameStyle === "tag" ? "8px 8px 8px 0" : "8px",
      };
    };

    const frameStylesFallback = getFrameStylesFallback();
    const hasFrameFallback = showFrame && parsedDesignData?.frameStyle && parsedDesignData.frameStyle !== "none" && parsedDesignData?.frameText;

    return (
      <div className={`flex flex-col items-center ${className}`}>
        {hasFrameFallback ? (
          <div
            className="flex flex-col items-center justify-center shadow-xl relative"
            style={frameStylesFallback}
          >
            {/* Frame Text (Label) */}
            {parsedDesignData?.frameText && (
              <div className="mb-2 w-full">
                <span 
                  className="text-sm font-semibold px-3 py-1 rounded block text-center"
                  style={{
                    color: parsedDesignData?.frameTextColor || parsedDesignData?.frameColor || "#000000",
                    background: parsedDesignData?.frameBgTransparent ? "transparent" : 
                                parsedDesignData?.frameBgUseGradient ? 
                                  `linear-gradient(135deg, ${parsedDesignData.frameBgColor1 || "#ffffff"}, ${parsedDesignData.frameBgColor2 || "#ffffff"})` :
                                  (parsedDesignData.frameStyle === "label" 
                                    ? parsedDesignData?.frameBgColor || "#000000"
                                    : parsedDesignData?.frameBgColor || "#ffffff"),
                  }}
                >
                  {parsedDesignData.frameText}
                </span>
              </div>
            )}
            
            {/* QR Code */}
            <div
              className="rounded-lg flex items-center justify-center p-4"
              style={{
                background: parsedDesignData?.patternBgTransparent || parsedDesignData?.bgTransparent
                  ? "transparent"
                  : parsedDesignData?.patternBgUseGradient || parsedDesignData?.useGradientBg
                    ? `linear-gradient(135deg, ${parsedDesignData.patternBgColor1 || parsedDesignData.bgColor1 || "#ffffff"}, ${parsedDesignData.patternBgColor2 || parsedDesignData.bgColor2 || "#ffffff"})`
                    : parsedDesignData?.patternBgColor || parsedDesignData?.bgColor || "#ffffff",
              }}
            >
              <QRCodeSVG
                value={value}
                size={size}
                level={parsedDesignData?.logo ? "H" : "M"}
                bgColor={bgColor}
                fgColor={patternColor}
                imageSettings={parsedDesignData?.logo ? {
                  src: parsedDesignData.logo,
                  height: parsedDesignData.logoSize || 40,
                  width: parsedDesignData.logoSize || 40,
                  excavate: true,
                } : undefined}
              />
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg flex items-center justify-center p-4 border border-gray-200 bg-white"
            style={{
              background: parsedDesignData?.patternBgTransparent || parsedDesignData?.bgTransparent
                ? "transparent"
                : parsedDesignData?.patternBgUseGradient || parsedDesignData?.useGradientBg
                  ? `linear-gradient(135deg, ${parsedDesignData.patternBgColor1 || parsedDesignData.bgColor1 || "#ffffff"}, ${parsedDesignData.patternBgColor2 || parsedDesignData.bgColor2 || "#ffffff"})`
                  : parsedDesignData?.patternBgColor || parsedDesignData?.bgColor || "#ffffff",
            }}
          >
            <QRCodeSVG
              value={value}
              size={size}
              level={parsedDesignData?.logo ? "H" : "M"}
              bgColor={bgColor}
              fgColor={patternColor}
              imageSettings={parsedDesignData?.logo ? {
                src: parsedDesignData.logo,
                height: parsedDesignData.logoSize || 40,
                width: parsedDesignData.logoSize || 40,
                excavate: true,
              } : undefined}
            />
          </div>
        )}
      </div>
    );
  }

  // Render with qr-code-styling
  // Get frame styles if frame is enabled
  const getFrameStyles = () => {
    if (!showFrame || !parsedDesignData?.frameStyle || parsedDesignData.frameStyle === "none") {
      return {};
    }
    
    // Frame Color always controls border color only (no gradient support)
    const frameBorderColor = parsedDesignData?.frameColor || "#000000";
    
    // Frame Background controls the background inside the frame
    const frameBg = parsedDesignData?.frameBgTransparent
      ? "transparent"
      : parsedDesignData?.frameBgUseGradient
        ? `linear-gradient(135deg, ${parsedDesignData.frameBgColor1 || "#ffffff"}, ${parsedDesignData.frameBgColor2 || "#ffffff"})`
        : parsedDesignData?.frameBgColor || "#ffffff";
    
    return {
      border: `4px solid ${frameBorderColor}`,
      background: frameBg,
      backgroundImage: parsedDesignData?.frameBgUseGradient ? frameBg : undefined,
      padding: "16px",
      borderRadius: parsedDesignData?.frameStyle === "bubble" ? "24px" : 
                   parsedDesignData?.frameStyle === "badge" ? "12px" :
                   parsedDesignData?.frameStyle === "tag" ? "8px 8px 8px 0" : "8px",
    };
  };

  const frameStyles = getFrameStyles();
  const hasFrame = showFrame && parsedDesignData?.frameStyle && parsedDesignData.frameStyle !== "none" && parsedDesignData?.frameText;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {hasFrame ? (
        <div
          className="flex flex-col items-center justify-center shadow-xl relative"
          style={frameStyles}
        >
          {/* Frame Text (Label) */}
          {parsedDesignData?.frameText && (
            <div className="mb-2 w-full">
              <span 
                className="text-sm font-semibold px-3 py-1 rounded block text-center"
                style={{
                  color: parsedDesignData?.frameTextColor || parsedDesignData?.frameColor || "#000000",
                  background: parsedDesignData?.frameBgTransparent ? "transparent" : 
                              parsedDesignData?.frameBgUseGradient ? 
                                `linear-gradient(135deg, ${parsedDesignData.frameBgColor1 || "#ffffff"}, ${parsedDesignData.frameBgColor2 || "#ffffff"})` :
                                (parsedDesignData.frameStyle === "label" 
                                  ? parsedDesignData?.frameBgColor || "#000000"
                                  : parsedDesignData?.frameBgColor || "#ffffff"),
                }}
              >
                {parsedDesignData.frameText}
              </span>
            </div>
          )}
          
          {/* QR Code */}
          <div
            className="rounded-lg flex items-center justify-center p-4"
            style={{
              background: parsedDesignData?.patternBgTransparent || parsedDesignData?.bgTransparent
                ? "transparent"
                : parsedDesignData?.patternBgUseGradient || parsedDesignData?.useGradientBg
                  ? `linear-gradient(135deg, ${parsedDesignData.patternBgColor1 || parsedDesignData.bgColor1 || "#ffffff"}, ${parsedDesignData.patternBgColor2 || parsedDesignData.bgColor2 || "#ffffff"})`
                  : parsedDesignData?.patternBgColor || parsedDesignData?.bgColor || "#ffffff",
            }}
          >
            <div ref={qrRef} className="flex items-center justify-center" style={{ width: size, height: size }} />
          </div>
        </div>
      ) : (
        <div
          className="rounded-lg flex items-center justify-center p-2 border border-gray-200 bg-white"
          style={{
            background: parsedDesignData?.patternBgTransparent || parsedDesignData?.bgTransparent
              ? "transparent"
              : parsedDesignData?.patternBgUseGradient || parsedDesignData?.useGradientBg
                ? `linear-gradient(135deg, ${parsedDesignData.patternBgColor1 || parsedDesignData.bgColor1 || "#ffffff"}, ${parsedDesignData.patternBgColor2 || parsedDesignData.bgColor2 || "#ffffff"})`
                : parsedDesignData?.patternBgColor || parsedDesignData?.bgColor || "#ffffff",
          }}
        >
          <div ref={qrRef} className="flex items-center justify-center" style={{ width: size, height: size }} />
        </div>
      )}
    </div>
  );
}
