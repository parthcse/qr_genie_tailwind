// pages/dashboard/create-qr.js
import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "../../components/DashboardLayout";
import DynamicForm from "../../components/qrFields/DynamicForm";
import { getSchemaForType } from "../../lib/qrSchemas";
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
  FaChevronUp
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
    id: "pdf",
    label: "PDF",
    description: "Show a PDF file",
    icon: FaFilePdf,
    active: true,
    color: "red"
  },
  {
    id: "vcard",
    label: "vCard",
    description: "Share a digital business card",
    icon: FaAddressCard,
    active: true,
    color: "blue"
  },
  {
    id: "links",
    label: "List of Links",
    description: "Share multiple links",
    icon: FaLink,
    active: true,
    color: "purple"
  },
  {
    id: "business",
    label: "Business",
    description: "Share info about your business",
    icon: FaBuilding,
    active: true,
    color: "slate"
  },
  {
    id: "video",
    label: "Video",
    description: "Show a video",
    icon: FaVideo,
    active: true,
    color: "pink"
  },
  {
    id: "images",
    label: "Images",
    description: "Show multiple images",
    icon: FaImages,
    active: true,
    color: "emerald"
  },
  {
    id: "facebook",
    label: "Facebook",
    description: "Share your Facebook page",
    icon: FaFacebook,
    active: true,
    color: "blue"
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
    id: "social",
    label: "Social Media",
    description: "Share social channels",
    icon: FaShareAlt,
    active: true,
    color: "indigo"
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
    id: "mp3",
    label: "MP3",
    description: "Share an audio file",
    icon: FaMusic,
    active: true,
    color: "yellow"
  },
  {
    id: "menu",
    label: "Menu",
    description: "Create a restaurant menu",
    icon: FaUtensils,
    active: true,
    color: "orange"
  },
  {
    id: "apps",
    label: "Apps",
    description: "Redirect to an app store",
    icon: FaMobileAlt,
    active: true,
    color: "slate"
  },
  {
    id: "coupon",
    label: "Coupon",
    description: "Share a coupon",
    icon: FaTicketAlt,
    active: true,
    color: "amber"
  },
  {
    id: "wifi",
    label: "WiFi",
    description: "Connect to a WiFi network",
    icon: FaWifi,
    active: true,
    color: "cyan"
  },
];

// Mobile Preview Component
const MobilePreview = ({ qrType, formData, designData, previewMode = "destination" }) => {
  const renderPreview = () => {
    if (previewMode === "qr") {
      return (
        <div className="flex items-center justify-center h-full bg-slate-50">
          <div
            className="w-48 h-48 rounded-2xl border-4 border-slate-200 flex items-center justify-center"
            style={{
              background: designData?.bgTransparent
                ? "transparent"
                : designData?.useGradientBg
                  ? `linear-gradient(135deg, ${designData.bgColor1 || "#ffffff"}, ${designData.bgColor2 || "#ffffff"})`
                  : designData?.bgColor || "#ffffff"
            }}
          >
            <div className="w-40 h-40 bg-slate-900 rounded-lg flex items-center justify-center">
              <FaQrcode className="w-32 h-32 text-white" />
            </div>
          </div>
        </div>
      );
    }

    // Destination preview based on type
    switch (qrType) {
      case "website":
        return (
          <div className="h-full bg-white p-4">
            <div className="h-2 w-12 bg-slate-200 rounded-full mx-auto mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-32 bg-slate-100 rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded w-full"></div>
                <div className="h-3 bg-slate-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        );
      case "pdf":
        return (
          <div className="h-full bg-white p-4">
            <div className="h-2 w-12 bg-slate-200 rounded-full mx-auto mb-4"></div>
            <div className="space-y-3">
              <div className="h-6 bg-red-100 rounded-lg flex items-center justify-center">
                <FaFilePdf className="text-red-600 text-2xl" />
              </div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              <div className="h-24 bg-slate-100 rounded"></div>
            </div>
          </div>
        );
      case "vcard":
        return (
          <div className="h-full bg-white p-4">
            <div className="h-2 w-12 bg-slate-200 rounded-full mx-auto mb-4"></div>
            <div className="space-y-4 text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full mx-auto flex items-center justify-center">
                <FaAddressCard className="text-indigo-600 text-3xl" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3 mx-auto"></div>
              </div>
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
      {/* Phone Frame */}
      <div className="absolute inset-0 bg-slate-900 rounded-[3rem] p-2 shadow-2xl">
        <div className="h-full bg-white rounded-[2.5rem] overflow-hidden">
          {/* Notch */}
          <div className="h-6 bg-slate-900 rounded-b-2xl"></div>
          {/* Screen Content */}
          <div className="h-[calc(100%-1.5rem)] overflow-auto">
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Indicator Component
const StepIndicator = ({ currentStep, onStepClick }) => {
  const steps = [
    { id: 1, label: "Type of QR code" },
    { id: 2, label: "Content" },
    { id: 3, label: "QR design" },
  ];

  return (
    <div className="mb-6 flex items-center gap-4">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onStepClick && onStepClick(step.id)}
            className={`
              flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-all
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
              text-sm font-medium
              ${currentStep === step.id || currentStep > step.id
                ? "text-slate-900"
                : "text-slate-500"
              }
            `}
          >
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div
              className={`
                h-0.5 w-12 transition-all
                ${currentStep > step.id ? "bg-emerald-500" : "bg-slate-200"}
              `}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default function CreateQrPage() {
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
    folder: "",
    // PDF
    pdfUrl: "",
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
      phone: "",
      message: "",
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
    },
  });

  // Design data
  const [designData, setDesignData] = useState({
    qrColor: "#000000",
    bgColor: "#ffffff",
    frameStyle: "none",
    patternStyle: "classic",
    useGradientPattern: false,
    patternColor1: "#000000",
    patternColor2: "#000000",
    bgTransparent: false,
    useGradientBg: false,
    bgColor1: "#ffffff",
    bgColor2: "#ffffff",
    cornerFrameStyle: "square",
    cornerDotStyle: "square",
    cornerFrameColor: "#000000",
    cornerDotColor: "#000000",
    logo: null,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  // Validation
  const canContinueFromStep1 = !!selectedType;
  const canContinueFromStep2 = () => {
    if (!selectedType) return false;
    const schema = getSchemaForType(selectedType);

    // Check required fields from schema
    for (const section of schema.sections || []) {
      for (const field of section.fields || []) {
        if (field.required) {
          const value = getNestedValue(formData, field.id);
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
        return !!(formData.links?.title && formData.links?.buttons?.some(b => b.label && b.url));
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
        body: JSON.stringify({
          qrType: selectedType,
          ...formData, // Send all form data
          qrColor: designData.qrColor,
          bgColor: designData.bgColor,
          design: designData,
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

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              onMouseEnter={() => setHoveredType(type.id)}
              onMouseLeave={() => setHoveredType(null)}
              className={`
                group relative flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all
                ${isSelected
                  ? "border-indigo-600 bg-indigo-50 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }
              `}
            >
              <div
                className={`
                  mb-2 flex h-12 w-12 items-center justify-center rounded-lg transition-colors
                  ${isSelected
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
                  ${isSelected ? "text-indigo-700" : "text-slate-700"}
                `}
              >
                {type.label}
              </span>
              <span className="mt-1 text-xs text-slate-500">
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
    };

    return (
      <DynamicForm
        schema={schema}
        formData={formData}
        updateFormData={updateFormData}
      />
    );
  };

  // Render Step 3 - Design
  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Design your QR code</h2>

      {/* QR Pattern */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="mb-3 block text-sm font-medium text-slate-700">
          QR Code Pattern
        </label>
        <div className="grid grid-cols-5 gap-2">
          {["classic", "dots", "rounded", "pixels", "grid"].map((pattern) => (
            <button
              key={pattern}
              type="button"
              onClick={() => setDesignData({ ...designData, patternStyle: pattern })}
              className={`
                flex h-16 flex-col items-center justify-center rounded-lg border-2 text-xs transition-all
                ${designData.patternStyle === pattern
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }
              `}
            >
              <div className="mb-1 h-6 w-6 rounded bg-slate-900"></div>
              <span className="capitalize">{pattern}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="mb-3 block text-sm font-medium text-slate-700">
          Colors
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs text-slate-600">QR Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={designData.qrColor}
                onChange={(e) => setDesignData({ ...designData, qrColor: e.target.value })}
                className="h-10 w-10 cursor-pointer rounded-lg border border-slate-300"
              />
              <input
                type="text"
                value={designData.qrColor}
                onChange={(e) => setDesignData({ ...designData, qrColor: e.target.value })}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-600">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={designData.bgColor}
                onChange={(e) => setDesignData({ ...designData, bgColor: e.target.value })}
                className="h-10 w-10 cursor-pointer rounded-lg border border-slate-300"
              />
              <input
                type="text"
                value={designData.bgColor}
                onChange={(e) => setDesignData({ ...designData, bgColor: e.target.value })}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Frame */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="mb-3 block text-sm font-medium text-slate-700">
          Frame
        </label>
        <div className="grid grid-cols-5 gap-2">
          {["none", "label", "tag", "bubble", "badge"].map((frame) => (
            <button
              key={frame}
              type="button"
              onClick={() => setDesignData({ ...designData, frameStyle: frame })}
              className={`
                flex h-16 flex-col items-center justify-center rounded-lg border-2 text-xs transition-all
                ${designData.frameStyle === frame
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }
              `}
            >
              <div className="mb-1 h-6 w-6 rounded border-2 border-slate-300"></div>
              <span className="capitalize">{frame === "none" ? "No frame" : frame}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      title="Create QR Code"
      description="Create a dynamic QR code in three simple steps"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left: Main Content */}
        <div className="space-y-6">
          <StepIndicator currentStep={step} />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step Content */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
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
                  <p>
                    Short link:{" "}
                    <Link
                      href={success.shortUrl}
                      className="font-mono text-xs text-emerald-800 underline"
                      target="_blank"
                    >
                      {success.shortUrl}
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving || !canContinueFromStep2()}
                  className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? "Creating..." : "Create QR Code"}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right: Preview Panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
              <div className="flex gap-2">
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
                <button
                  type="button"
                  onClick={() => setPreviewMode("qr")}
                  className={`
                    rounded-lg px-3 py-1 text-xs font-medium transition-colors
                    ${previewMode === "qr"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }
                  `}
                >
                  QR Code
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <MobilePreview
                qrType={hoveredType || selectedType}
                formData={formData}
                designData={designData}
                previewMode={previewMode}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-800 mb-1">💡 Tip</p>
            <p className="text-xs text-slate-600">
              Use high contrast between QR color and background for best scan reliability. Dark QR on light background works best.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
