// components/qrFields/FieldComponents.js
import { useState, useEffect, useRef } from "react";
import {
  FaPlus,
  FaTrash,
  FaUpload,
  FaImage,
  FaFile,
  FaFilePdf,
  FaQuestionCircle,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaYoutube,
  FaTiktok,
  FaWhatsapp,
  FaPinterest,
  FaSnapchat,
  FaLink,
  FaGlobe,
  FaEnvelope,
  FaChevronUp,
  FaChevronDown,
  FaGithub,
  FaGoogle,
  FaReddit,
  FaSkype,
  FaTumblr,
  FaVimeo,
  FaVk,
  FaTelegram,
  FaSpotify,
  FaSoundcloud,
  FaApple,
  FaBehance,
  FaYelp,
  FaTimes,
} from "react-icons/fa";

// Base Input Component
export function InputField({ field, value, onChange, error }) {
  const handleChange = (e) => {
    let newValue = e.target.value;
    // Remove @ if user types it (we'll add it visually)
    if (field.prefix === "@" && newValue.startsWith("@")) {
      newValue = newValue.substring(1);
    }
    onChange(newValue);
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.prefix ? (
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none">
            {field.prefix}
          </div>
          <input
            type={field.type || "text"}
            value={value || ""}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            className={`w-full rounded-lg border pl-8 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              error ? "border-red-300" : "border-slate-300"
            }`}
          />
        </div>
      ) : (
        <input
          type={field.type || "text"}
          value={value || ""}
          onChange={handleChange}
          placeholder={field.placeholder}
          required={field.required}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
            error ? "border-red-300" : "border-slate-300"
          }`}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Textarea Component
export function TextareaField({ field, value, onChange, error }) {
  const currentLength = (value || "").length;
  const maxLength = field.maxLength;
  const showCounter = maxLength !== undefined;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={field.rows || 3}
        maxLength={maxLength}
        required={field.required}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none ${
          error ? "border-red-300" : "border-slate-300"
        }`}
      />
      <div className="mt-1 flex items-center justify-between">
        {error && <p className="text-xs text-red-600">{error}</p>}
        {showCounter && (
          <p className={`text-xs ml-auto ${
            currentLength >= maxLength ? "text-red-600" : "text-slate-500"
          }`}>
            {currentLength}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}

// Select/Dropdown Component
export function SelectField({ field, value, onChange, error }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
          error ? "border-red-300" : "border-slate-300"
        }`}
      >
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Toggle/Switch Component
export function ToggleField({ field, value, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={value || false}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span className="text-sm text-slate-700">{field.label}</span>
    </label>
  );
}

// Color Palette Component
export function ColorPaletteField({ field, value, onChange, onPaletteSelect, formData }) {
  const colorPalettes = [
    { id: "blue-green", primary: "#527AC9", secondary: "#7EC09F", name: "Blue & Green" },
    { id: "white-black", primary: "#FFFFFF", secondary: "#000000", name: "White & Black" },
    { id: "blue-dark", primary: "#3B82F6", secondary: "#1E40AF", name: "Blue & Dark Blue" },
    { id: "purple-black", primary: "#8B5CF6", secondary: "#000000", name: "Purple & Black" },
    { id: "green-black", primary: "#10B981", secondary: "#000000", name: "Green & Black" },
    { id: "yellow-black", primary: "#F59E0B", secondary: "#000000", name: "Yellow & Black" },
    { id: "orange-green", primary: "#FF7B25", secondary: "#7EC09F", name: "Orange & Green" },
    { id: "pink-blue", primary: "#EC4899", secondary: "#3B82F6", name: "Pink & Blue" },
  ];

  // Detect current selection based on primary/secondary colors
  const currentPrimary = formData?.primaryColor || "#527AC9";
  const currentSecondary = formData?.secondaryColor || "#7EC09F";
  const selectedPaletteId = value || colorPalettes.find(
    p => p.primary.toUpperCase() === currentPrimary.toUpperCase() && 
         p.secondary.toUpperCase() === currentSecondary.toUpperCase()
  )?.id || null;

  const handlePaletteSelect = (palette) => {
    if (onPaletteSelect) {
      onPaletteSelect(palette.primary, palette.secondary);
    }
    if (onChange) {
      onChange(palette.id);
    }
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {field.label || "Color palette"}
      </label>
      <div className="grid grid-cols-4 gap-2">
        {colorPalettes.map((palette) => {
          const isSelected = selectedPaletteId === palette.id;
          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => handlePaletteSelect(palette)}
              className={`
                relative flex items-center gap-1 p-2 rounded-lg border-2 transition-all
                ${isSelected 
                  ? "border-indigo-600 bg-indigo-50 shadow-md" 
                  : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }
              `}
              title={palette.name}
            >
              <div 
                className="w-8 h-8 rounded-sm flex-shrink-0"
                style={{ backgroundColor: palette.primary }}
              ></div>
              <div 
                className="w-8 h-8 rounded-sm flex-shrink-0"
                style={{ backgroundColor: palette.secondary }}
              ></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Color Picker Component
export function ColorField({ field, value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {field.label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || field.defaultValue || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded-lg border border-slate-300"
        />
        <input
          type="text"
          value={value || field.defaultValue || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// File Upload Component
export function FileField({ field, value, onChange, onFileSelect, compact = false }) {
  const [preview, setPreview] = useState(() => {
    // Initialize preview from value if it's a data URL
    if (value && typeof value === "string" && value.startsWith("data:image")) {
      return value;
    }
    return null;
  });
  const [fileInfo, setFileInfo] = useState(null);
  const [error, setError] = useState("");

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileInfo(null);
      setError("");
      setPreview(null);
      if (onChange) onChange("");
      if (onFileSelect) onFileSelect(null);
      return;
    }

    // Validation for PDF files
    if (field.accept?.includes(".pdf") || field.accept === ".pdf") {
      // Check file type
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setError("Only PDF files are allowed");
        setFileInfo(null);
        return;
      }
      
      // Check file size (100MB = 100 * 1024 * 1024 bytes)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("File size must be less than 100MB");
        setFileInfo(null);
        return;
      }
      
      setError("");
      setFileInfo({
        name: file.name,
        size: formatFileSize(file.size),
      });
    }

    if (field.accept?.includes("image")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        if (onFileSelect) onFileSelect(file);
      };
      reader.readAsDataURL(file);
    } else {
      if (onFileSelect) onFileSelect(file);
    }

    if (onChange) onChange(file.name);
  };

  const isPdfField = field.accept?.includes(".pdf") || field.accept === ".pdf";
  const isImageField = field.accept?.includes("image") || field.accept === "image/*";

  // Handle preview for file objects
  useEffect(() => {
    if (value && value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(value);
    } else if (value && typeof value === "string" && value.startsWith("data:image")) {
      setPreview(value);
    } else if (!value) {
      setPreview(null);
    }
  }, [value]);

  // Compact image upload for List of Links
  if (compact && isImageField) {
    const displayPreview = preview || (value && typeof value === "string" && value.startsWith("data:image") ? value : null);
    
    return (
      <div>
        {field.label && (
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <label className={`
          flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors relative overflow-hidden
          ${error 
            ? "border-red-300 bg-red-50" 
            : displayPreview 
              ? "border-indigo-300 bg-indigo-50" 
              : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50"
          }
        `}>
          {displayPreview ? (
            <>
              <img
                src={displayPreview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setPreview(null);
                  setFileInfo(null);
                  setError("");
                  if (onChange) onChange("");
                  if (onFileSelect) onFileSelect(null);
                }}
                className="absolute top-0 right-0 bg-red-500 p-1 text-white hover:bg-red-600 rounded-bl-lg z-10"
              >
                <FaTrash className="text-xs" />
              </button>
            </>
          ) : (
            <>
              <FaUpload className="mb-1 text-lg text-slate-400" />
              <svg className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-3 text-slate-400" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8C2 6 4 4 6 4C6 2 8 0 10 0C12 0 14 2 14 4C16 4 18 6 18 8C20 8 22 10 22 12" strokeLinecap="round"/>
              </svg>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            required={field.required}
          />
        </label>
        {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
        {isPdfField ? (
          // Enhanced PDF Upload UI
          <label className={`
            flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors cursor-pointer
            ${error 
              ? "border-red-300 bg-red-50" 
              : fileInfo 
                ? "border-indigo-300 bg-indigo-50" 
                : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50"
            }
          `}>
            <div className="p-6 w-full text-center">
              <FaFilePdf className="mx-auto mb-3 text-4xl text-indigo-500" />
              <div className="text-sm font-medium text-indigo-600 mb-1">
                Upload PDF
              </div>
              <div className="text-xs text-slate-500 mb-2">
                Maximum size: 100MB
              </div>
              {fileInfo && (
                <div className="mt-3 p-2 bg-white rounded border border-indigo-200">
                  <p className="text-xs font-medium text-slate-700 truncate">{fileInfo.name}</p>
                  <p className="text-xs text-slate-500">{fileInfo.size}</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              required={field.required}
            />
          </label>
        ) : (
          // Standard file upload UI
          <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
            <FaUpload className="mb-2 text-xl text-slate-400" />
            <span className="text-sm text-slate-600">
              {field.multiple ? "Upload files" : "Upload file"}
            </span>
            <span className="text-xs text-slate-400">
              {field.accept || "Any file"}
            </span>
            <input
              type="file"
              accept={field.accept}
              multiple={field.multiple}
              onChange={handleFileChange}
              className="hidden"
              required={field.required}
            />
          </label>
        )}
        
        {/* Error Message */}
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <span>⚠</span>
            {error}
          </p>
        )}
        
        {/* Image Preview */}
        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="h-32 w-32 rounded-lg object-cover border border-slate-200"
            />
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setFileInfo(null);
                setError("");
                if (onChange) onChange("");
                if (onFileSelect) onFileSelect(null);
              }}
              className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
            >
              <FaTrash className="text-xs" />
            </button>
          </div>
        )}
        
        {/* File name display for non-image files */}
        {value && !preview && !fileInfo && (
          <p className="text-sm text-slate-600 flex items-center gap-2">
            <FaFile className="text-slate-400" />
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

// Repeater Component
export function RepeaterField({ field, value, onChange }) {
  const items = value || field.defaultValue || [];

  const addItem = () => {
    const newItem = {};
    field.fields.forEach((f) => {
      if (f.type === "socialIcon") {
        // For social icons, don't set a default - user must select
        newItem[f.id] = "";
      } else {
        newItem[f.id] = f.defaultValue || "";
      }
    });
    onChange([...items, newItem]);
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const moveItem = (index, direction) => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === items.length - 1) return;
    
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    onChange(newItems);
  };

  const updateItem = (index, fieldId, fieldValue) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [fieldId]: fieldValue };
    onChange(updated);
  };

  // Check if this is a "List of Links" type repeater (has icon/image, title, url fields)
  const isLinkRepeater = field.fields?.some(f => f.id === "icon" || f.id === "image") && 
                         field.fields?.some(f => f.id === "title" || f.id === "linkText") &&
                         field.fields?.some(f => f.id === "url");
  
  // Check if this is a "Social Networks" type repeater (has icon field with type "socialIcon")
  const isSocialRepeater = field.fields?.some(f => f.type === "socialIcon") && 
                           field.iconOptions && 
                           field.iconOptions.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-slate-700">
            {field.label}
          </label>
          {field.description && (
            <p className="text-xs text-slate-500 mt-0.5">{field.description}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className={`rounded-lg border border-slate-200 bg-white p-4 ${
              isLinkRepeater ? "relative" : ""
            }`}
          >
            {isSocialRepeater ? (
              // Special layout for Social Networks - icon on left, fields in middle, actions on right
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  {/* Icon Display and Selection */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 overflow-hidden">
                      {item.icon ? (() => {
                        const iconOption = field.iconOptions.find(opt => opt.id === item.icon);
                        const IconComponent = iconComponentMap[iconOption?.icon] || FaLink;
                        return (
                          <IconComponent className="text-2xl text-gray-700" />
                        );
                      })() : (
                        <FaLink className="text-2xl text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Input Fields */}
                  <div className="flex-1 space-y-3">
                    {(() => {
                      const iconOption = field.iconOptions.find(opt => opt.id === item.icon);
                      const useUserId = iconOption?.useUserId || false;
                      
                      return (
                        <>
                          {useUserId ? (
                            <InputField
                              field={{
                                id: "userId",
                                label: "User ID*",
                                placeholder: "E.g. MyUserID",
                                required: true,
                              }}
                              value={item.userId || ""}
                              onChange={(val) => updateItem(index, "userId", val)}
                            />
                          ) : (
                            <InputField
                              field={{
                                id: "url",
                                label: "URL*",
                                placeholder: "E.g. https://socialnetworks.com/",
                                required: true,
                              }}
                              value={item.url || ""}
                              onChange={(val) => updateItem(index, "url", val)}
                            />
                          )}
                          <InputField
                            field={{
                              id: "text",
                              label: "Text",
                              placeholder: "E.g. Follow us",
                            }}
                            value={item.text || ""}
                            onChange={(val) => updateItem(index, "text", val)}
                          />
                        </>
                      );
                    })()}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 flex-shrink-0 pt-1">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, "up")}
                      disabled={index === 0}
                      className={`p-2 rounded-lg transition-colors ${
                        index === 0
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-blue-600 hover:bg-blue-50 bg-blue-50"
                      }`}
                      title="Move up"
                    >
                      <FaChevronUp className="text-sm" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, "down")}
                      disabled={index === items.length - 1}
                      className={`p-2 rounded-lg transition-colors ${
                        index === items.length - 1
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-blue-600 hover:bg-blue-50 bg-blue-50"
                      }`}
                      title="Move down"
                    >
                      <FaChevronDown className="text-sm" />
                    </button>
                  </div>
                </div>

                {/* Icon Selection Grid */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="text-xs font-medium text-slate-600 mb-2 block">
                    Select Icon:
                  </label>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {field.iconOptions.map((iconOption) => {
                      const IconComponent = iconComponentMap[iconOption.icon] || FaLink;
                      const isSelected = item.icon === iconOption.id;
                      
                      return (
                        <button
                          key={iconOption.id}
                          type="button"
                          onClick={() => updateItem(index, "icon", iconOption.id)}
                          className={`
                            flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all
                            ${isSelected
                              ? "border-indigo-600 bg-indigo-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                            }
                          `}
                          title={iconOption.label}
                        >
                          <IconComponent className={`text-lg ${isSelected ? "text-indigo-600" : "text-gray-500"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : isLinkRepeater ? (
              // Special layout for List of Links - horizontal layout with action buttons
              <div className="flex gap-4 items-start">
                {/* Image Upload - Compact */}
                <div className="flex-shrink-0">
                  {field.fields.find(f => f.id === "icon" || f.id === "image") && (
                    <FileField
                      field={{
                        ...field.fields.find(f => f.id === "icon" || f.id === "image"),
                        label: "",
                      }}
                      value={item[field.fields.find(f => f.id === "icon" || f.id === "image")?.id]?.name || 
                             (typeof item[field.fields.find(f => f.id === "icon" || f.id === "image")?.id] === "string" 
                               ? item[field.fields.find(f => f.id === "icon" || f.id === "image")?.id] 
                               : "") || ""}
                      onChange={(val) => {
                        const fieldId = field.fields.find(f => f.id === "icon" || f.id === "image")?.id;
                        if (typeof item[fieldId] !== "object" || !(item[fieldId] instanceof File)) {
                          updateItem(index, fieldId, val);
                        }
                      }}
                      onFileSelect={(file) => {
                        const fieldId = field.fields.find(f => f.id === "icon" || f.id === "image")?.id;
                        updateItem(index, fieldId, file);
                      }}
                      compact={true}
                    />
                  )}
                </div>

                {/* Link Text and URL - Vertical Stack */}
                <div className="flex-1 space-y-3">
                  {field.fields.map((subField) => {
                    if (subField.id === "icon" || subField.id === "image") return null;
                    
                    return (
                      <div key={subField.id}>
                        {subField.type === "text" && (
                          <InputField
                            field={subField}
                            value={item[subField.id] || ""}
                            onChange={(val) => updateItem(index, subField.id, val)}
                          />
                        )}
                        {subField.type === "url" && (
                          <InputField
                            field={subField}
                            value={item[subField.id] || ""}
                            onChange={(val) => updateItem(index, subField.id, val)}
                          />
                        )}
                        {subField.type === "email" && (
                          <InputField
                            field={subField}
                            value={item[subField.id] || ""}
                            onChange={(val) => updateItem(index, subField.id, val)}
                          />
                        )}
                        {subField.type === "tel" && (
                          <InputField
                            field={subField}
                            value={item[subField.id] || ""}
                            onChange={(val) => updateItem(index, subField.id, val)}
                          />
                        )}
                        {subField.type === "textarea" && (
                          <TextareaField
                            field={subField}
                            value={item[subField.id] || ""}
                            onChange={(val) => updateItem(index, subField.id, val)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons - Right Side */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, "up")}
                    disabled={index === 0}
                    className={`p-2 rounded-lg transition-colors ${
                      index === 0
                        ? "text-slate-300 cursor-not-allowed"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                    title="Move up"
                  >
                    <FaChevronUp className="text-sm" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, "down")}
                    disabled={index === items.length - 1}
                    className={`p-2 rounded-lg transition-colors ${
                      index === items.length - 1
                        ? "text-slate-300 cursor-not-allowed"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                    title="Move down"
                  >
                    <FaChevronDown className="text-sm" />
                  </button>
                </div>
              </div>
            ) : (
              // Default layout for other repeater types
              <>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">
                    Item {index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded p-1 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {field.fields.map((subField) => (
                    <div key={subField.id}>
                      {subField.type === "text" && (
                        <InputField
                          field={subField}
                          value={item[subField.id] || ""}
                          onChange={(val) => updateItem(index, subField.id, val)}
                        />
                      )}
                      {subField.type === "url" && (
                        <InputField
                          field={subField}
                          value={item[subField.id] || ""}
                          onChange={(val) => updateItem(index, subField.id, val)}
                        />
                      )}
                      {subField.type === "email" && (
                        <InputField
                          field={subField}
                          value={item[subField.id] || ""}
                          onChange={(val) => updateItem(index, subField.id, val)}
                        />
                      )}
                      {subField.type === "tel" && (
                        <InputField
                          field={subField}
                          value={item[subField.id] || ""}
                          onChange={(val) => updateItem(index, subField.id, val)}
                        />
                      )}
                      {subField.type === "textarea" && (
                        <TextareaField
                          field={subField}
                          value={item[subField.id] || ""}
                          onChange={(val) => updateItem(index, subField.id, val)}
                        />
                      )}
                      {subField.type === "file" && (
                        <FileField
                          field={subField}
                          value={item[subField.id]?.name || (typeof item[subField.id] === "string" ? item[subField.id] : "") || ""}
                          onChange={(val) => {
                            if (typeof item[subField.id] !== "object" || !(item[subField.id] instanceof File)) {
                              updateItem(index, subField.id, val);
                            }
                          }}
                          onFileSelect={(file) => updateItem(index, subField.id, file)}
                        />
                      )}
                      {subField.type === "iconSelector" && (
                        <IconSelectorField
                          field={subField}
                          value={item[subField.id] || {}}
                          onChange={(val) => updateItem(index, subField.id, val)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add Button */}
      <button
        type="button"
        onClick={addItem}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transition-all duration-200"
      >
        <FaPlus className="text-sm" />
        {isSocialRepeater ? "Add Social Network" : "Add Link"}
      </button>
    </div>
  );
}

// Icon Selector Component
const iconComponentMap = {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaYoutube,
  FaTiktok,
  FaWhatsapp,
  FaPinterest,
  FaSnapchat,
  FaLink,
  FaGlobe,
  FaEnvelope,
  FaGithub,
  FaGoogle,
  FaReddit,
  FaSkype,
  FaTumblr,
  FaVimeo,
  FaVk,
  FaTelegram,
  FaSpotify,
  FaSoundcloud,
  FaApple,
  FaBehance,
  FaYelp,
  // Fallbacks for icons that might not exist
  FaDribbble: FaLink,
  FaLine: FaLink,
  FaTripadvisor: FaLink,
  FaWechat: FaLink,
  FaFacebookMessenger: FaFacebook,
  FaDeviantart: FaLink,
  FaUber: FaLink,
  FaStrava: FaLink,
  FaFoursquare: FaLink,
};

export function IconSelectorField({ field, value, onChange }) {
  const selectedIcons = value || {};
  const [showAll, setShowAll] = useState(field.showAll || false);

  const getIconComponent = (iconName) => {
    return iconComponentMap[iconName] || null;
  };

  const toggleIcon = (iconId) => {
    const updated = { ...selectedIcons };
    if (updated[iconId]) {
      delete updated[iconId];
    } else {
      updated[iconId] = { url: "" };
    }
    onChange(updated);
  };

  const updateIconUrl = (iconId, url) => {
    const updated = { ...selectedIcons };
    if (updated[iconId]) {
      updated[iconId] = { ...updated[iconId], url };
    }
    onChange(updated);
  };

  const visibleIcons = showAll
    ? field.icons
    : field.icons.slice(0, 6);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          {field.label}
        </label>
        {field.icons.length > 6 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-indigo-600 hover:text-indigo-700"
          >
            {showAll ? "Show less" : "Show all icons"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {visibleIcons.map((iconDef) => {
          const IconComponent = getIconComponent(iconDef.icon);
          const isSelected = !!selectedIcons[iconDef.id];

          return (
            <div key={iconDef.id} className="space-y-2">
              <button
                type="button"
                onClick={() => toggleIcon(iconDef.id)}
                className={`
                  flex h-14 w-full flex-col items-center justify-center rounded-lg border-2 transition-all
                  ${isSelected
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                  }
                `}
              >
                {IconComponent && (
                  <IconComponent
                    className={`text-xl ${
                      isSelected ? "text-indigo-600" : "text-slate-400"
                    }`}
                  />
                )}
                <span
                  className={`mt-1 text-[10px] ${
                    isSelected ? "text-indigo-700" : "text-slate-500"
                  }`}
                >
                  {iconDef.label}
                </span>
              </button>
              {isSelected && (
                <input
                  type="url"
                  value={selectedIcons[iconDef.id]?.url || ""}
                  onChange={(e) => updateIconUrl(iconDef.id, e.target.value)}
                  placeholder="URL"
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Folder Field Component with Create Modal
export function FolderField({ field, value, onChange, error, folders = [], onFolderCreated }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const dropdownRef = useRef(null);

  // Get selected folder name
  const selectedFolder = folders.find(f => f.id === value);
  const displayValue = selectedFolder ? selectedFolder.name : (value ? "Unknown Folder" : "No Folder");

  const handleSelectFolder = (folderId) => {
    onChange(folderId || "");
    setIsDropdownOpen(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setCreateError("Folder name is required");
      return;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create folder");
      }

      const { folder } = await response.json();
      
      // Call callback to refresh folders list
      if (onFolderCreated) {
        onFolderCreated(folder);
      }
      
      // Auto-select the new folder
      onChange(folder.id);
      
      // Close modal and reset
      setShowCreateModal(false);
      setNewFolderName("");
      setIsDropdownOpen(false);
    } catch (err) {
      setCreateError(err.message || "Failed to create folder");
    } finally {
      setIsCreating(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  return (
    <>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative z-50" ref={dropdownRef}>
          {/* Readonly Input */}
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 cursor-pointer focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex items-center justify-between transition-colors ${
              error ? "border-red-300" : isDropdownOpen ? "border-indigo-500" : "border-slate-300"
            }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsDropdownOpen(!isDropdownOpen);
              }
            }}
          >
            <span className={value ? "text-slate-900" : "text-slate-400"}>
              {displayValue}
            </span>
            <FaChevronDown
              className={`text-slate-400 transition-transform ${
                isDropdownOpen ? "transform rotate-180" : ""
              }`}
            />
          </div>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="z-[9999] w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl max-h-60 overflow-auto" style={{ zIndex: 9999 }}>
              {/* No Folder Option */}
              <button
                type="button"
                onClick={() => handleSelectFolder("")}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  !value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-700"
                }`}
              >
                No Folder
              </button>

              {/* Existing Folders */}
              {folders.length > 0 ? (
                folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => handleSelectFolder(folder.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                      value === folder.id ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-700"
                    }`}
                  >
                    {folder.name}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-slate-400 italic">
                  No folders yet
                </div>
              )}

              {/* Divider */}
              {folders.length > 0 && (
                <div className="border-t border-slate-200 my-1"></div>
              )}

              {/* Create Folder Option */}
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setShowCreateModal(true);
                }}
                className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-colors font-medium"
              >
                <FaPlus className="text-xs" />
                Create Folder
              </button>
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Create New Folder</h2>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Folder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => {
                    setNewFolderName(e.target.value);
                    setCreateError("");
                  }}
                  placeholder="Enter folder name"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    createError ? "border-red-300" : "border-slate-300"
                  }`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateFolder();
                    }
                    if (e.key === "Escape") {
                      setShowCreateModal(false);
                      setNewFolderName("");
                      setCreateError("");
                    }
                  }}
                />
                {createError && <p className="mt-1 text-xs text-red-600">{createError}</p>}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewFolderName("");
                  setCreateError("");
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={isCreating || !newFolderName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

