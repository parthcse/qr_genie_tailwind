// components/qrFields/DynamicForm.js
import { useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaQuestionCircle,
  FaGlobe,
  FaQrcode,
  FaLock,
  FaFolder,
  FaPalette,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaShareAlt,
  FaFont,
  FaImage,
  FaFilePdf,
  FaLink,
  FaImages,
  FaVideo,
  FaMusic,
  FaUtensils,
  FaWifi,
  FaList,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaYoutube,
  FaTiktok,
  FaWhatsapp,
  FaPinterest,
  FaSnapchat,
} from "react-icons/fa";
import {
  InputField,
  TextareaField,
  SelectField,
  ToggleField,
  ColorField,
  FileField,
  RepeaterField,
  IconSelectorField,
} from "./FieldComponents";

// Icon mapping
const iconMap = {
  FaGlobe,
  FaQrcode,
  FaLock,
  FaFolder,
  FaPalette,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaShareAlt,
  FaFont,
  FaImage,
  FaFilePdf,
  FaLink,
  FaImages,
  FaVideo,
  FaMusic,
  FaUtensils,
  FaWifi,
  FaList,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaYoutube,
  FaTiktok,
  FaWhatsapp,
  FaPinterest,
  FaSnapchat,
};

// Collapsible Section Component
const CollapsibleSection = ({
  section,
  formData,
  updateFormData,
  expandedSections,
  toggleSection,
}) => {
  const isExpanded = expandedSections[section.id];
  const Icon = iconMap[section.icon] || FaQrcode;

  const renderField = (field, path = "") => {
    const fieldPath = path ? `${path}.${field.id}` : field.id;
    const fieldValue = getNestedValue(formData, fieldPath);
    const updateValue = (value) => {
      updateFormData(fieldPath, value);
    };

    // Check conditional fields
    if (field.conditional) {
      const conditionValue = getNestedValue(formData, field.conditional);
      if (!conditionValue) return null;
    }

    switch (field.type) {
      case "text":
      case "url":
      case "email":
      case "tel":
      case "password":
        return (
          <InputField
            key={field.id}
            field={field}
            value={fieldValue}
            onChange={updateValue}
          />
        );

      case "textarea":
        return (
          <TextareaField
            key={field.id}
            field={field}
            value={fieldValue}
            onChange={updateValue}
          />
        );

      case "select":
        return (
          <SelectField
            key={field.id}
            field={field}
            value={fieldValue}
            onChange={updateValue}
          />
        );

      case "toggle":
        return (
          <ToggleField
            key={field.id}
            field={field}
            value={fieldValue}
            onChange={updateValue}
          />
        );

      case "color":
        return (
          <ColorField
            key={field.id}
            field={field}
            value={fieldValue}
            onChange={updateValue}
          />
        );

      case "file":
        return (
          <FileField
            key={field.id}
            field={field}
            value={fieldValue}
            onChange={updateValue}
          />
        );

      case "repeater":
        return (
          <RepeaterField
            key={field.id}
            field={field}
            value={fieldValue}
            onChange={updateValue}
          />
        );

      case "iconSelector":
        return (
          <IconSelectorField
            key={field.id}
            field={field}
            value={fieldValue}
            onChange={updateValue}
          />
        );

      case "section":
        return (
          <div key={field.id} className="space-y-3">
            {field.label && (
              <h4 className="text-sm font-medium text-slate-700">
                {field.label}
              </h4>
            )}
            <div className="space-y-3 pl-4 border-l-2 border-slate-200">
              {field.fields?.map((subField) => renderField(subField, fieldPath))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => toggleSection(section.id)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Icon className="text-lg" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {section.title}
              </h3>
              {section.required && <span className="text-red-500">*</span>}
              {section.helpText && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show help tooltip
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <FaQuestionCircle className="text-xs" />
                </button>
              )}
            </div>
            {section.description && (
              <p className="mt-0.5 text-xs text-slate-500">
                {section.description}
              </p>
            )}
          </div>
        </div>
        <div className="text-slate-400">
          {isExpanded ? (
            <FaChevronUp className="text-sm" />
          ) : (
            <FaChevronDown className="text-sm" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="pt-4 space-y-4">
            {section.fields?.map((field) => renderField(field))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get nested values
function getNestedValue(obj, path) {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}

// Main Dynamic Form Component
export default function DynamicForm({ schema, formData, updateFormData }) {
  const [expandedSections, setExpandedSections] = useState(() => {
    const initial = {};
    schema.sections?.forEach((section) => {
      initial[section.id] = section.required !== false; // Expand required sections by default
    });
    return initial;
  });

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleUpdateFormData = (path, value) => {
    const keys = path.split(".");
    const newData = { ...formData };
    let current = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      } else {
        current[key] = { ...current[key] };
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    updateFormData(newData);
  };

  if (!schema || !schema.sections) {
    return (
      <div className="text-center py-8 text-slate-500">
        No form schema available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schema.sections.map((section) => (
        <CollapsibleSection
          key={section.id}
          section={section}
          formData={formData}
          updateFormData={handleUpdateFormData}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
        />
      ))}
    </div>
  );
}

