# Dynamic QR Code Form System

## Overview

This system provides a fully dynamic, schema-driven form builder for creating QR codes. The form fields automatically change based on the selected QR type, with all fields defined in JSON schemas.

## Architecture

### 1. **Schema System** (`lib/qrSchemas.js`)

All QR types are defined as JSON schemas with:
- **Sections**: Collapsible accordion sections
- **Fields**: Individual form fields within sections
- **Field Types**: text, url, email, tel, textarea, select, toggle, color, file, repeater, iconSelector

**Example Schema Structure:**
```javascript
{
  sections: [
    {
      id: "website",
      icon: "FaGlobe",
      title: "Website Information",
      required: true,
      description: "Input the URL...",
      fields: [
        {
          id: "url",
          type: "url",
          label: "Website URL",
          required: true,
          placeholder: "https://..."
        }
      ]
    }
  ]
}
```

### 2. **Field Components** (`components/qrFields/FieldComponents.js`)

Reusable field components:
- `InputField` - Text, URL, Email, Tel, Password inputs
- `TextareaField` - Multi-line text input
- `SelectField` - Dropdown select
- `ToggleField` - Checkbox/toggle switch
- `ColorField` - Color picker with hex input
- `FileField` - File upload with preview
- `RepeaterField` - Dynamic repeating fields (e.g., multiple phones)
- `IconSelectorField` - Social media icon selector

### 3. **Dynamic Form Renderer** (`components/qrFields/DynamicForm.js`)

Main component that:
- Reads schema for selected QR type
- Renders collapsible sections with icons
- Maps field types to components
- Handles nested data structures
- Supports conditional fields (show/hide based on other fields)

### 4. **Integration** (`pages/dashboard/create-qr.js`)

The main create QR page:
- Uses `getSchemaForType()` to load schema
- Passes schema to `DynamicForm` component
- Manages form state globally
- Validates required fields
- Updates preview in real-time

## Supported QR Types

1. **Website** - URL, name, password, folder
2. **PDF** - File upload, title, description, thumbnail
3. **vCard** - Full contact card with all fields
4. **Links** - Link in bio with buttons and branding
5. **Images** - Image gallery with layout options
6. **Video** - Video upload or YouTube link
7. **MP3** - Audio file with cover image
8. **Menu** - Restaurant menu with sections
9. **WiFi** - Network credentials
10. **Social Media** - Multiple social network links
11. **Business** - Company page with services

## Adding New QR Types

1. **Add Schema** in `lib/qrSchemas.js`:
```javascript
newType: {
  sections: [
    {
      id: "section1",
      icon: "FaIcon",
      title: "Section Title",
      fields: [...]
    }
  ]
}
```

2. **Add to QR Types List** in `create-qr.js`:
```javascript
{
  id: "newType",
  label: "New Type",
  icon: FaIcon,
  description: "Description"
}
```

3. **Update Validation** in `canContinueFromStep2()` if needed

## Field Types Reference

### Basic Fields
- `text` - Single-line text input
- `url` - URL input with validation
- `email` - Email input
- `tel` - Phone number input
- `password` - Password input (masked)
- `textarea` - Multi-line text (specify `rows`)

### Selection Fields
- `select` - Dropdown (requires `options` array)
- `toggle` - Checkbox/switch (returns boolean)

### Special Fields
- `color` - Color picker (has `defaultValue`)
- `file` - File upload (specify `accept`, `multiple`)
- `repeater` - Repeating fields (specify `fields` array and `defaultValue`)
- `iconSelector` - Icon grid selector (specify `icons` array)

### Advanced
- `section` - Nested section (contains other fields)

## Conditional Fields

Fields can be conditionally shown:
```javascript
{
  id: "password",
  type: "password",
  conditional: "passwordEnabled" // Only shows if passwordEnabled is true
}
```

## Data Structure

Form data is stored as nested objects:
```javascript
{
  url: "https://...",
  name: "My QR",
  vcard: {
    firstName: "John",
    phones: [
      { phone: "+1234", label: "Mobile" }
    ]
  }
}
```

## Real-time Preview

The preview panel automatically updates when form data changes. The `MobilePreview` component receives:
- `qrType` - Selected QR type
- `formData` - Current form values
- `designData` - Design settings
- `previewMode` - "destination" or "qr"

## Styling

All components use TailwindCSS with your design system:
- Colors: `indigo-600`, `slate-700`, etc.
- Spacing: Consistent padding and margins
- Borders: `border-slate-200`, `rounded-xl`
- Icons: React Icons (Font Awesome)

## Best Practices

1. **Always set `defaultValue`** for repeater fields
2. **Use `required: true`** for mandatory fields
3. **Provide helpful `description`** text for sections
4. **Use `conditional`** for dependent fields
5. **Keep field IDs unique** within a section
6. **Test validation** for each new type

## Future Enhancements

- [ ] File upload to cloud storage
- [ ] Image cropping/editing
- [ ] Rich text editor for descriptions
- [ ] Form field validation messages
- [ ] Auto-save draft functionality
- [ ] Form templates/presets

