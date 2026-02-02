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

  ColorPaletteField,
  FileField,
  RepeaterField,
  IconSelectorField,
  FolderField,
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

  batchUpdateFormData,
  expandedSections,
  toggleSection,
  type,
  getFieldPath,
  folders = [],
  onFolderCreated,
}) => {
  const isExpanded = expandedSections[section.id];
  const Icon = iconMap[section.icon] || FaQrcode;


  // updateFormData prop is handleUpdateFormData from DynamicForm which takes (path, value)
  // So we can use it directly

  const renderField = (field, path = "") => {
    // Ensure fieldPath is always a valid string
    const fieldId = field?.id || "";
    let pathStr = path && typeof path === "string" ? path : "";
    
    // If no path provided and this is a nested type, use the type prefix
    // Use getFieldPath helper which already handles the type logic
    const fieldPath = pathStr ? `${pathStr}.${fieldId}` : (getFieldPath ? getFieldPath(fieldId) : fieldId);
    
    // Ensure fieldPath is a non-empty string
    if (!fieldPath || typeof fieldPath !== "string") {
      console.warn("renderField: Invalid fieldPath", { field, path, fieldPath });
      return null;
    }
    
    const fieldValue = getNestedValue(formData, fieldPath);
    const updateValue = (value) => {
      // updateFormData prop is handleUpdateFormData from DynamicForm which takes (path, value)
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


      case "folder":
        return (
          <FolderField
            key={field.id}
            field={field}
            value={fieldValue}
            onChange={updateValue}
            folders={folders}
            onFolderCreated={onFolderCreated}
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


      case "colorPalette":
        // Special handling: palette selection updates both primaryColor and secondaryColor
        const handlePaletteSelect = (primary, secondary) => {
          // Update both colors atomically using batch update if available
          if (batchUpdateFormData) {
            batchUpdateFormData([
              { path: "primaryColor", value: primary },
              { path: "secondaryColor", value: secondary },
            ]);
          } else {
            // Fallback to individual updates
            updateFormData("primaryColor", primary);
            updateFormData("secondaryColor", secondary);
          }
        };
        
        return (
          <ColorPaletteField
            key={field.id}
            field={field}
            value={fieldValue}
            onChange={updateValue}
            onPaletteSelect={handlePaletteSelect}
            formData={formData}
          />
        );

      case "file":
        // For file fields, we need to store the file object, not just the name
        const handleFileSelect = (file) => {
          // Use updateFormData with path/value approach
          // updateFormData prop is handleUpdateFormData from DynamicForm which takes (path, value)
          updateFormData(fieldPath, file);
        };
        
        return (
          <FileField
            key={field.id}
            field={field}

            value={fieldValue?.name || fieldValue || ""}
            onChange={updateValue}
            onFileSelect={handleFileSelect}
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

        <div className="px-4 pb-4 border-t border-slate-100 relative overflow-visible">
          <div className="pt-4 space-y-4 relative">
            {section.id === "design" && section.fields?.length >= 3 ? (
              // Special rendering for design section with swap button
              <>
                {renderField(section.fields[0])} {/* Color Palette */}
                <div className="space-y-4">
                  <div className="relative">
                    {renderField(section.fields[1])} {/* Primary Color */}
                    {/* Swap Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const primaryValue = getNestedValue(formData, section.fields[1].id) || section.fields[1].defaultValue;
                        const secondaryValue = getNestedValue(formData, section.fields[2].id) || section.fields[2].defaultValue;
                        // Swap values atomically using batch update
                        if (batchUpdateFormData) {
                          batchUpdateFormData([
                            { path: section.fields[1].id, value: secondaryValue },
                            { path: section.fields[2].id, value: primaryValue },
                          ]);
                        } else {
                          // Fallback to individual updates if batch not available
                          updateFormData(section.fields[1].id, secondaryValue);
                          updateFormData(section.fields[2].id, primaryValue);
                        }
                      }}
                      className="absolute right-0 top-8 w-8 h-8 rounded-full border-2 border-indigo-300 bg-white flex items-center justify-center hover:bg-indigo-50 transition-colors shadow-sm z-10"
                      title="Swap colors"
                    >
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </button>
                  </div>
                  {renderField(section.fields[2])} {/* Secondary Color */}
                </div>
              </>
            ) : (
              section.fields?.map((field) => renderField(field))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get nested values
function getNestedValue(obj, path) {

  if (!path || typeof path !== "string") return undefined;
  const keys = path.split(".").filter(k => k); // Filter out empty strings
  let current = obj;
  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}

// Main Dynamic Form Component

export default function DynamicForm({ schema, formData, updateFormData, type, folders = [], onFolderCreated }) {
  // For nested types like "vcard" and "links", we need to prefix field paths
  // BUT: name and folder should ALWAYS be at top level, regardless of type
  const getFieldPath = (fieldId) => {
    if (!type) return fieldId;
    
    // Name and folder fields should always be at top level
    if (fieldId === "name" || fieldId === "folder") {
      return fieldId;
    }
    
    // Types that have nested structure in formData
    const nestedTypes = ["vcard", "links", "business", "whatsapp", "instagram", "menu", "apps", "coupon", "wifi"];
    if (nestedTypes.includes(type)) {
      return `${type}.${fieldId}`;
    }
    return fieldId;
  };
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

    if (!path || typeof path !== "string") {
      console.warn("handleUpdateFormData: path must be a string", path);
      return;
    }
    const keys = path.split(".").filter(k => k); // Filter out empty strings
    if (keys.length === 0) {
      console.warn("handleUpdateFormData: path is empty", path);
      return;
    }
    
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


  // Helper function to update multiple fields atomically
  const handleBatchUpdateFormData = (updates) => {
    // updates is an array of { path, value } objects
    const newData = { ...formData };
    
    updates.forEach(({ path, value }) => {
      if (!path || typeof path !== "string") return;
      const keys = path.split(".").filter(k => k);
      if (keys.length === 0) return;
      
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
    });
    
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

          batchUpdateFormData={handleBatchUpdateFormData}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          type={type}
          getFieldPath={getFieldPath}
          folders={folders}
          onFolderCreated={onFolderCreated}
        />
      ))}
    </div>
  );
}

