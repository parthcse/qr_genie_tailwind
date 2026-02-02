// components/DesignedQRCode.js
// Shared component for rendering fully designed QR codes (with frame, colors, logo, etc.)
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import QRCodeSVG as fallback
const QRCodeSVG = dynamic(() => import("qrcode.react").then((mod) => mod.QRCodeSVG), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg"></div>
});

// Helper function to create QR config (shared between preview and download)
export const createQRConfig = (size, value, designData) => {
  // Map pattern styles to qr-code-styling types
  const patternTypeMap = {
    classic: "square",
    dots: "dots",
    rounded: "rounded",
    pixels: "extra-rounded",
    grid: "classy",
  };

  // Map corner styles
  const cornerTypeMap = {
    square: "square",
    rounded: "extra-rounded",
    circle: "dot",
    "extra-rounded": "extra-rounded",
  };

  // Determine pattern color (with gradient support)
  let patternColor = designData?.patternColor || designData?.qrColor || "#000000";
  if (designData?.patternUseGradient && designData.patternColor1 && designData.patternColor2) {
    patternColor = {
      type: "linear-gradient",
      rotation: designData.patternGradientType === "vertical" ? 0 : 
               designData.patternGradientType === "horizontal" ? 90 :
               designData.patternGradientType === "diagonal" ? 45 :
               designData.patternGradientType === "inverse-diagonal" ? 135 : 0,
      colorStops: [
        { offset: 0, color: designData.patternColor1 },
        { offset: 1, color: designData.patternColor2 },
      ],
    };
  }

  // Determine background color (with gradient and transparent support)
  let backgroundColor = designData?.patternBgColor || designData?.bgColor || "#ffffff";
  if (designData?.patternBgTransparent || designData?.bgTransparent) {
    backgroundColor = "transparent";
  } else if (designData?.patternBgUseGradient && designData.patternBgColor1 && designData.patternBgColor2) {
    backgroundColor = {
      type: designData.patternBgGradientType === "radial" ? "radial-gradient" : "linear-gradient",
      rotation: designData.patternBgGradientType === "radial" ? 0 :
               designData.patternBgGradientType === "vertical" ? 0 :
               designData.patternBgGradientType === "horizontal" ? 90 : 0,
      colorStops: [
        { offset: 0, color: designData.patternBgColor1 },
        { offset: 1, color: designData.patternBgColor2 },
      ],
    };
  }

  // Determine corner frame color
  const cornerFrameColor = designData?.cornerFrameColor || designData?.patternColor || "#000000";
  const cornerDotColor = designData?.cornerDotColor || designData?.patternColor || "#000000";

  // Build configuration object for QRCodeStyling
  const qrConfig = {
    width: size,
    height: size,
    type: "svg",
    data: value,
    margin: 1,
    qrOptions: {
      typeNumber: 0,
      mode: "Byte",
      errorCorrectionLevel: designData?.logo ? "H" : "M",
    },
    dotsOptions: {
      type: patternTypeMap[designData?.patternStyle] || "square",
      color: patternColor,
    },
    backgroundOptions: {
      color: backgroundColor,
    },
    cornersSquareOptions: {
      type: cornerTypeMap[designData?.cornerFrameStyle] || "square",
      color: cornerFrameColor,
    },
    cornersDotOptions: {
      type: cornerTypeMap[designData?.cornerDotStyle] || "square",
      color: cornerDotColor,
    },
  };

  // Only add imageOptions and image if logo exists
  if (designData?.logo) {
    qrConfig.image = designData.logo;
    qrConfig.imageOptions = {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 0,
      crossOrigin: "anonymous",
    };
  }

  return qrConfig;
};

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
      
      const frameColor = parsedDesignData?.frameUseGradient
        ? `linear-gradient(135deg, ${parsedDesignData.frameColor1 || "#000000"}, ${parsedDesignData.frameColor2 || "#000000"})`
        : parsedDesignData?.frameColor || "#000000";
      
      const frameBg = parsedDesignData?.frameBgTransparent
        ? "transparent"
        : parsedDesignData?.frameBgUseGradient
          ? `linear-gradient(135deg, ${parsedDesignData.frameBgColor1 || "#ffffff"}, ${parsedDesignData.frameBgColor2 || "#ffffff"})`
          : parsedDesignData?.frameBgColor || "#ffffff";
      
      return {
        border: `4px solid ${parsedDesignData?.frameUseGradient ? "transparent" : frameColor}`,
        background: parsedDesignData?.frameUseGradient ? frameColor : frameBg,
        backgroundImage: parsedDesignData?.frameUseGradient ? frameColor : undefined,
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
                    color: parsedDesignData?.frameUseGradient ? "#ffffff" : 
                           (parsedDesignData.frameStyle === "label" && 
                            (parsedDesignData?.frameBgColor === "#000000" || 
                             parsedDesignData?.frameBgColor?.toLowerCase() === "black" ||
                             (parsedDesignData?.frameBgColor?.startsWith("#") && 
                              parseInt(parsedDesignData.frameBgColor.slice(1, 3), 16) < 80)))
                           ? "#ffffff"
                           : parsedDesignData?.frameColor || "#000000",
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
    
    const frameColor = parsedDesignData?.frameUseGradient
      ? `linear-gradient(135deg, ${parsedDesignData.frameColor1 || "#000000"}, ${parsedDesignData.frameColor2 || "#000000"})`
      : parsedDesignData?.frameColor || "#000000";
    
    const frameBg = parsedDesignData?.frameBgTransparent
      ? "transparent"
      : parsedDesignData?.frameBgUseGradient
        ? `linear-gradient(135deg, ${parsedDesignData.frameBgColor1 || "#ffffff"}, ${parsedDesignData.frameBgColor2 || "#ffffff"})`
        : parsedDesignData?.frameBgColor || "#ffffff";
    
    return {
      border: `4px solid ${parsedDesignData?.frameUseGradient ? "transparent" : frameColor}`,
      background: parsedDesignData?.frameUseGradient ? frameColor : frameBg,
      backgroundImage: parsedDesignData?.frameUseGradient ? frameColor : undefined,
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
                  color: parsedDesignData?.frameUseGradient ? "#ffffff" : 
                         (parsedDesignData.frameStyle === "label" && 
                          (parsedDesignData?.frameBgColor === "#000000" || 
                           parsedDesignData?.frameBgColor?.toLowerCase() === "black" ||
                           (parsedDesignData?.frameBgColor?.startsWith("#") && 
                            parseInt(parsedDesignData.frameBgColor.slice(1, 3), 16) < 80)))
                         ? "#ffffff"
                         : parsedDesignData?.frameColor || "#000000",
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
