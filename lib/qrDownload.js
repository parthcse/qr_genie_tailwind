// lib/qrDownload.js
// Shared utility for downloading designed QR codes consistently across the app
import { createQRConfig } from "../components/DesignedQRCode";

/**
 * Downloads a designed QR code with frame, colors, logo, etc.
 * This ensures all downloads use the same rendering logic as previews.
 * 
 * @param {string} qrValue - The QR code value/content to encode
 * @param {object} designData - Design configuration (frame, colors, logo, etc.)
 * @param {string} format - Download format: "png", "jpg", "jpeg", "svg", "pdf", "print"
 * @param {string} size - Size option: "default", "large", "xl" or pixel size string
 * @param {string} filename - Optional filename (without extension)
 * @returns {Promise<void>}
 */
export async function downloadDesignedQR(qrValue, designData = {}, format = "png", size = "default", filename = "qr-code") {
  if (!qrValue) {
    throw new Error("QR code value is required");
  }

  // Debug logging to help troubleshoot
  const debugHasFrame = (designData?.frameStyle && designData.frameStyle !== "none" && designData?.frameText) ||
                       (designData?.frameColor || designData?.frameBgColor);
  console.log("Downloading QR with design:", {
    hasFrame: debugHasFrame,
    frameStyle: designData?.frameStyle,
    frameText: designData?.frameText,
    frameColor: designData?.frameColor,
    frameBgColor: designData?.frameBgColor,
    hasFrameColor: !!designData?.frameColor,
    hasFrameBgColor: !!designData?.frameBgColor,
    fullDesignData: designData,
  });

  const sizeMap = {
    default: 1024,
    large: 2048,
    xl: 4096,
  };

  const pixelSize = typeof size === "string" && sizeMap[size] ? sizeMap[size] : 
                    typeof size === "number" ? size :
                    parseInt(size) || 1024;

  // Helper function to draw rounded rectangles on canvas
  // Using function declaration for hoisting to ensure it's always accessible
  function drawRoundedRect(ctx, x, y, width, height, radius, topOnly = false, bottomOnly = false) {
    ctx.beginPath();
    
    if (topOnly) {
      // Rounded top corners only
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    } else if (bottomOnly) {
      // Rounded bottom corners only
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y);
    } else {
      // All corners rounded
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    }
    
    ctx.closePath();
  }

  try {
    // Import qr-code-styling
    const QRCodeStyling = (await import("qr-code-styling")).default;

    // Handle print format
    if (format === "print") {
      // For print, we'll create a print-friendly window
      const printWindow = window.open("", "_blank");
      const qrConfig = createQRConfig(pixelSize, qrValue, designData);
      const qrCodeInstance = new QRCodeStyling(qrConfig);
      
      // Create temporary container to render QR
      const tempDiv = document.createElement("div");
      tempDiv.style.width = `${pixelSize}px`;
      tempDiv.style.height = `${pixelSize}px`;
      tempDiv.style.display = "flex";
      tempDiv.style.justifyContent = "center";
      tempDiv.style.alignItems = "center";
      
      await qrCodeInstance.append(tempDiv);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get frame styles if needed
      const hasFrame = designData?.frameStyle && designData.frameStyle !== "none" && designData?.frameText;
      let frameStyles = "";
      if (hasFrame) {
        const frameColor = designData?.frameUseGradient
          ? `linear-gradient(135deg, ${designData.frameColor1 || "#000000"}, ${designData.frameColor2 || "#000000"})`
          : designData?.frameColor || "#000000";
        
        const frameBg = designData?.frameBgTransparent
          ? "transparent"
          : designData?.frameBgUseGradient
            ? `linear-gradient(135deg, ${designData.frameBgColor1 || "#ffffff"}, ${designData.frameBgColor2 || "#ffffff"})`
            : designData?.frameBgColor || "#ffffff";
        
        const borderRadius = designData.frameStyle === "bubble" ? "24px" : 
                           designData.frameStyle === "badge" ? "12px" :
                           designData.frameStyle === "tag" ? "8px 8px 8px 0" : "8px";
        
        frameStyles = `
          .qr-frame {
            border: 4px solid ${designData?.frameUseGradient ? "transparent" : frameColor};
            background: ${designData?.frameUseGradient ? frameColor : frameBg};
            ${designData?.frameUseGradient ? `background-image: ${frameColor};` : ""}
            padding: 16px;
            border-radius: ${borderRadius};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .qr-label {
            color: ${designData?.frameUseGradient ? "#ffffff" : 
                   (designData.frameStyle === "label" && 
                    (designData?.frameBgColor === "#000000" || 
                     designData?.frameBgColor?.toLowerCase() === "black" ||
                     (designData?.frameBgColor?.startsWith("#") && 
                      parseInt(designData.frameBgColor.slice(1, 3), 16) < 80)))
                   ? "#ffffff"
                   : designData?.frameColor || "#000000"};
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
          }
        `;
      }
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print QR Code</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
                background: white; 
              }
              ${frameStyles}
            </style>
          </head>
          <body>
            ${hasFrame ? `<div class="qr-frame"><div class="qr-label">${designData.frameText}</div>` : ""}
            ${tempDiv.innerHTML}
            ${hasFrame ? `</div>` : ""}
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }

    // Create QR config using shared function
    const qrConfig = createQRConfig(pixelSize, qrValue, designData);
    const qrCodeInstance = new QRCodeStyling(qrConfig);

    // Helper to get image data from QR code
    const getQRImageData = async (outputFormat) => {
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = `${pixelSize}px`;
      tempDiv.style.height = `${pixelSize}px`;
      document.body.appendChild(tempDiv);
      
      try {
        await qrCodeInstance.append(tempDiv);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const svgElement = tempDiv.querySelector("svg");
        if (!svgElement) {
          throw new Error("QR code SVG not found");
        }
        
        if (outputFormat === "svg") {
          const svgString = new XMLSerializer().serializeToString(svgElement);
          document.body.removeChild(tempDiv);
          return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
        } else {
          // Convert SVG to raster format
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = pixelSize;
          canvas.height = pixelSize;
          
          const img = new Image();
          const svgBlob = new Blob([new XMLSerializer().serializeToString(svgElement)], { type: "image/svg+xml" });
          const url = URL.createObjectURL(svgBlob);
          
          const dataUrl = await new Promise((resolve, reject) => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
              URL.revokeObjectURL(url);
              document.body.removeChild(tempDiv);
              const mimeType = outputFormat === "jpeg" ? "image/jpeg" : "image/png";
              resolve(canvas.toDataURL(mimeType));
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              document.body.removeChild(tempDiv);
              reject(new Error("Failed to load SVG image"));
            };
            img.src = url;
          });
          
          return dataUrl;
        }
      } catch (error) {
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
        throw error;
      }
    };

    // Handle SVG format
    if (format === "svg") {
      const svgDataUrl = await getQRImageData("svg");
      const link = document.createElement("a");
      link.href = svgDataUrl;
      link.download = `${filename}.svg`;
      link.click();
      return;
    }

    // Handle PDF format
    if (format === "pdf") {
      const pngDataUrl = await getQRImageData("png");
      
      try {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({
          orientation: "square",
          unit: "px",
          format: [pixelSize, pixelSize],
        });
        
        const img = new Image();
        img.src = pngDataUrl;
        await new Promise((resolve, reject) => {
          img.onload = () => {
            pdf.addImage(img, "PNG", 0, 0, pixelSize, pixelSize);
            pdf.save(`${filename}.pdf`);
            resolve();
          };
          img.onerror = reject;
        });
      } catch (error) {
        // Fallback: download as PNG if jsPDF is not available
        console.warn("jsPDF not available, downloading as PNG instead");
        const link = document.createElement("a");
        link.href = pngDataUrl;
        link.download = `${filename}.png`;
        link.click();
      }
      return;
    }

    // Handle PNG, JPG, JPEG formats
    const isJpeg = format === "jpg" || format === "jpeg";
    const mimeType = isJpeg ? "image/jpeg" : "image/png";
    const fileExtension = isJpeg ? (format === "jpg" ? "jpg" : "jpeg") : "png";
    
    // Get the QR code image
    let dataUrl = await getQRImageData(isJpeg ? "jpeg" : "png");
    
    // ALWAYS render frame if frame data exists (matching component logic)
    // Component checks: showFrame && frameStyle && frameStyle !== "none" && frameText
    // But we'll be more lenient - if there's any frame-related data, render it
    const hasFrame = (designData?.frameStyle && 
                      designData.frameStyle !== "none" && 
                      designData?.frameText) ||
                     // Also check if there's frame color or border data (for backwards compatibility)
                     (designData?.frameColor || designData?.frameBgColor);
    
    // If frame is needed, composite it on a canvas to match preview exactly
    if (hasFrame) {
      // Ensure we have frame text (use QR name or type as fallback if needed)
      const finalFrameText = designData?.frameText || 
                            (designData?.frameColor || designData?.frameBgColor ? 
                             (filename !== "qr-code" ? filename : "QR Code") : 
                             "QR Code");
      const finalFrameStyle = designData?.frameStyle || "default";
      
      // Create frame design data with ensured values
      const frameDesignData = {
        ...designData,
        frameText: finalFrameText,
        frameStyle: finalFrameStyle,
      };
      
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // Calculate frame dimensions matching DesignedQRCode component exactly
      // Border: 4px solid (matching component)
      const borderWidth = Math.max(4, pixelSize / 256);
      // Padding: 16px inside frame (matching component's padding)
      const padding = Math.max(16, pixelSize / 64);
      // Label height: ~40px scaled (matching component)
      const labelHeight = Math.max(40, pixelSize / 25.6);
      // QR size: fits within frame with proper spacing
      const qrSize = Math.floor(pixelSize * 0.65);
      
      canvas.width = pixelSize;
      canvas.height = pixelSize;
      
      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      
      // Get frame colors matching component logic
      const frameColor = frameDesignData?.frameUseGradient
        ? frameDesignData.frameColor1 || frameDesignData.frameColor || "#000000"
        : frameDesignData?.frameColor || "#000000";
      
      const frameBg = frameDesignData?.frameBgTransparent
        ? (isJpeg ? "#ffffff" : "transparent")
        : frameDesignData?.frameBgUseGradient
          ? (frameDesignData.frameBgColor1 || frameDesignData.frameBgColor || "#ffffff")
          : frameDesignData?.frameBgColor || "#ffffff";
      
      // Calculate border radius based on frame style (matching component exactly)
      let borderRadius = 8; // default (8px)
      if (finalFrameStyle === "bubble") {
        borderRadius = Math.max(24, pixelSize / 42.67); // 24px scaled
      } else if (finalFrameStyle === "badge") {
        borderRadius = Math.max(12, pixelSize / 85.33); // 12px scaled
      } else if (finalFrameStyle === "tag") {
        borderRadius = Math.max(8, pixelSize / 128); // 8px scaled
      }
      
      // Draw shadow (shadow-xl effect: 0 20px 25px -5px rgba(0, 0, 0, 0.1))
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
      ctx.shadowBlur = Math.max(25, pixelSize / 40.96);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.max(20, pixelSize / 51.2);
      
      // Draw frame background with rounded corners and shadow
      if (!frameDesignData?.frameBgTransparent || isJpeg) {
        drawRoundedRect(ctx, 0, 0, pixelSize, pixelSize, borderRadius);
        
        if (frameDesignData?.frameBgUseGradient) {
          const gradient = ctx.createLinearGradient(0, 0, pixelSize, pixelSize);
          gradient.addColorStop(0, frameDesignData.frameBgColor1 || "#ffffff");
          gradient.addColorStop(1, frameDesignData.frameBgColor2 || "#ffffff");
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = frameBg;
        }
        ctx.fill();
      }
      ctx.restore();
      
      // Draw frame background again on top (without shadow) for clean appearance
      if (!frameDesignData?.frameBgTransparent || isJpeg) {
        drawRoundedRect(ctx, 0, 0, pixelSize, pixelSize, borderRadius);
        
        if (frameDesignData?.frameBgUseGradient) {
          const gradient = ctx.createLinearGradient(0, 0, pixelSize, pixelSize);
          gradient.addColorStop(0, frameDesignData.frameBgColor1 || "#ffffff");
          gradient.addColorStop(1, frameDesignData.frameBgColor2 || "#ffffff");
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = frameBg;
        }
        ctx.fill();
      }
      
      // Draw frame border with rounded corners
      drawRoundedRect(ctx, borderWidth / 2, borderWidth / 2, pixelSize - borderWidth, pixelSize - borderWidth, borderRadius);
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = borderWidth;
      ctx.stroke();
      
      // Calculate inner frame area (inside border and padding)
      const frameInnerX = padding + borderWidth;
      const frameInnerY = padding + borderWidth;
      const frameInnerWidth = pixelSize - (padding * 2) - (borderWidth * 2);
      const frameInnerHeight = pixelSize - (padding * 2) - (borderWidth * 2);
      
      // For label style, draw label background rectangle at top
      if (finalFrameStyle === "label") {
        const labelBg = frameDesignData?.frameBgColor || "#000000";
        ctx.fillStyle = labelBg;
        // Rounded top corners only for label
        const labelRadius = Math.min(borderRadius - 4, 8);
        drawRoundedRect(ctx, frameInnerX, frameInnerY, frameInnerWidth, labelHeight, labelRadius, true, false);
        ctx.fill();
      }
      
      // Draw QR code background area (matching component's inner div structure)
      // Component structure: Frame > Padding > Label (mb-2 = 8px) > QR Container (p-4 = 16px padding, rounded-lg)
      const labelMarginBottom = Math.max(8, pixelSize / 128); // mb-2 = 8px
      const qrContainerPadding = Math.max(16, pixelSize / 64); // p-4 = 16px
      
      const qrBgX = frameInnerX + qrContainerPadding;
      const qrBgY = frameInnerY + labelHeight + labelMarginBottom;
      const qrBgWidth = frameInnerWidth - (qrContainerPadding * 2);
      const qrBgHeight = frameInnerHeight - labelHeight - labelMarginBottom - qrContainerPadding;
      
      // Draw QR background with rounded corners (matching component's rounded-lg)
      const qrBgRadius = Math.max(8, pixelSize / 128); // rounded-lg = 8px
      const qrBgColor = frameDesignData?.patternBgTransparent || frameDesignData?.bgTransparent
        ? (isJpeg ? "#ffffff" : "transparent")
        : frameDesignData?.patternBgUseGradient || frameDesignData?.useGradientBg
          ? (frameDesignData.patternBgColor1 || frameDesignData.bgColor1 || "#ffffff")
          : frameDesignData?.patternBgColor || frameDesignData?.bgColor || "#ffffff";
      
      if (!frameDesignData?.patternBgTransparent || isJpeg) {
        drawRoundedRect(ctx, qrBgX, qrBgY, qrBgWidth, qrBgHeight, qrBgRadius);
        if (frameDesignData?.patternBgUseGradient || frameDesignData?.useGradientBg) {
          const bgGradient = ctx.createLinearGradient(qrBgX, qrBgY, qrBgX + qrBgWidth, qrBgY + qrBgHeight);
          bgGradient.addColorStop(0, frameDesignData.patternBgColor1 || frameDesignData.bgColor1 || "#ffffff");
          bgGradient.addColorStop(1, frameDesignData.patternBgColor2 || frameDesignData.bgColor2 || "#ffffff");
          ctx.fillStyle = bgGradient;
        } else {
          ctx.fillStyle = qrBgColor;
        }
        ctx.fill();
      }
      
      // Draw QR code centered in background area (matching component's flex centering)
      const qrImg = new Image();
      await new Promise((resolve) => {
        qrImg.onload = () => {
          const qrX = qrBgX + (qrBgWidth - qrSize) / 2;
          const qrY = qrBgY + (qrBgHeight - qrSize) / 2;
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          resolve();
        };
        qrImg.onerror = resolve;
        qrImg.src = dataUrl;
      });
      
      // Draw frame text on label background (matching component styling)
      let textColor = "#000000";
      if (frameDesignData?.frameUseGradient) {
        textColor = "#ffffff";
      } else if (finalFrameStyle === "label") {
        // Label style: use white text if background is dark
        const labelBg = frameDesignData?.frameBgColor || "#000000";
        const isDarkBg = labelBg === "#000000" || 
                        labelBg.toLowerCase() === "black" ||
                        (labelBg.startsWith("#") && parseInt(labelBg.slice(1, 3), 16) < 80);
        textColor = isDarkBg ? "#ffffff" : frameColor;
      } else {
        textColor = frameColor;
      }
      
      ctx.fillStyle = textColor;
      const fontSize = Math.max(16, pixelSize / 64); // Scale font size proportionally
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const textX = frameInnerX + frameInnerWidth / 2;
      const textY = frameInnerY + labelHeight / 2;
      ctx.fillText(finalFrameText, textX, textY);
      
      // Convert to requested format
      if (isJpeg) {
        dataUrl = canvas.toDataURL(mimeType, 0.95);
      } else {
        dataUrl = canvas.toDataURL(mimeType);
      }
    } else {
      // Even without frame, ensure JPEG format is applied correctly
      if (isJpeg) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = pixelSize;
        canvas.height = pixelSize;
        
        // Draw white background for JPEG
        ctx.fillStyle = designData?.patternBgTransparent || designData?.bgTransparent
          ? "#ffffff"
          : designData?.patternBgColor || designData?.bgColor || "#ffffff";
        ctx.fillRect(0, 0, pixelSize, pixelSize);
        
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            resolve();
          };
          img.onerror = resolve;
          img.src = dataUrl;
        });
        
        dataUrl = canvas.toDataURL(mimeType, 0.95);
      }
    }
    
    // Download the file
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${filename}.${fileExtension}`;
    link.click();
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
}
