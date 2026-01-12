// components/qrFields/FieldComponents.js
import { useState } from "react";
import {
  FaPlus,
  FaTrash,
  FaUpload,
  FaImage,
  FaFile,
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
} from "react-icons/fa";

// Base Input Component
export function InputField({ field, value, onChange, error }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={field.type || "text"}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
          error ? "border-red-300" : "border-slate-300"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Textarea Component
export function TextareaField({ field, value, onChange, error }) {
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
        required={field.required}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none ${
          error ? "border-red-300" : "border-slate-300"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
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
export function FileField({ field, value, onChange, onFileSelect }) {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
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
                if (onChange) onChange("");
              }}
              className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
            >
              <FaTrash className="text-xs" />
            </button>
          </div>
        )}
        {value && !preview && (
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
      newItem[f.id] = f.defaultValue || "";
    });
    onChange([...items, newItem]);
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, fieldId, fieldValue) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [fieldId]: fieldValue };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          {field.label}
        </label>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          <FaPlus className="text-xs" />
          Add
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
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
                      value={item[subField.id]}
                      onChange={(val) => updateItem(index, subField.id, val)}
                    />
                  )}
                  {subField.type === "url" && (
                    <InputField
                      field={subField}
                      value={item[subField.id]}
                      onChange={(val) => updateItem(index, subField.id, val)}
                    />
                  )}
                  {subField.type === "email" && (
                    <InputField
                      field={subField}
                      value={item[subField.id]}
                      onChange={(val) => updateItem(index, subField.id, val)}
                    />
                  )}
                  {subField.type === "tel" && (
                    <InputField
                      field={subField}
                      value={item[subField.id]}
                      onChange={(val) => updateItem(index, subField.id, val)}
                    />
                  )}
                  {subField.type === "textarea" && (
                    <TextareaField
                      field={subField}
                      value={item[subField.id]}
                      onChange={(val) => updateItem(index, subField.id, val)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
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

