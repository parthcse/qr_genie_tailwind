// qr-code-styling options for a designed QR code (pattern, colours, corners, logo). Shared by the on-screen
// QR code (components/qr/DesignedQRCode.js) and the downloads (lib/qr/qrDownload.js); no React, so it runs anywhere.

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
  const isTransparentBg = designData?.patternBgTransparent || designData?.bgTransparent;
  let backgroundColor = null;
  
  if (!isTransparentBg) {
    const baseColor = designData?.patternBgColor || designData?.bgColor || "#ffffff";
    
    if (designData?.patternBgUseGradient) {
      // When gradient is enabled, ensure both colors are set (use base color as fallback)
      const color1 = designData.patternBgColor1 || designData.bgColor1 || baseColor;
      const color2 = designData.patternBgColor2 || designData.bgColor2 || baseColor;
      
      backgroundColor = {
        type: designData.patternBgGradientType === "radial" ? "radial-gradient" : "linear-gradient",
        rotation: designData.patternBgGradientType === "radial" ? 0 :
                 designData.patternBgGradientType === "vertical" ? 0 :
                 designData.patternBgGradientType === "horizontal" ? 90 : 0,
        colorStops: [
          { offset: 0, color: color1 },
          { offset: 1, color: color2 },
        ],
      };
    } else {
      backgroundColor = baseColor;
    }
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
    cornersSquareOptions: {
      type: cornerTypeMap[designData?.cornerFrameStyle] || "square",
      color: cornerFrameColor,
    },
    cornersDotOptions: {
      type: cornerTypeMap[designData?.cornerDotStyle] || "square",
      color: cornerDotColor,
    },
  };

  // Only include backgroundOptions if background is not transparent
  // When transparent, omit backgroundOptions entirely to let SVG handle transparency correctly
  if (!isTransparentBg && backgroundColor !== null) {
    qrConfig.backgroundOptions = {
      color: backgroundColor,
    };
  }

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
