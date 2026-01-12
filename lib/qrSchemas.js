// lib/qrSchemas.js
// JSON schemas for all QR code types

export const qrTypeSchemas = {
  website: {
    sections: [
      {
        id: "website",
        icon: "FaGlobe",
        title: "Website Information",
        required: true,
        description: "Input the URL this QR will redirect to.",
        fields: [
          {
            id: "url",
            type: "url",
            label: "Website URL",
            required: true,
            placeholder: "https://www.example.com",
          },
        ],
      },
      {
        id: "name",
        icon: "FaQrcode",
        title: "Name of the QR Code",
        description: "Give a name to your QR code.",
        fields: [
          {
            id: "name",
            type: "text",
            label: "Name",
            placeholder: "e.g. Summer campaign landing page",
          },
        ],
      },
      {
        id: "password",
        icon: "FaLock",
        title: "Password",
        helpText: true,
        fields: [
          {
            id: "passwordEnabled",
            type: "toggle",
            label: "Activate password to access the QR code.",
            defaultValue: false,
          },
          {
            id: "password",
            type: "password",
            label: "Password",
            placeholder: "Enter password",
            conditional: "passwordEnabled",
          },
        ],
      },
      {
        id: "folder",
        icon: "FaFolder",
        title: "Folder",
        description: "Link this QR to an existing or a new folder.",
        fields: [
          {
            id: "folder",
            type: "select",
            label: "Select Folder",
            options: [
              { value: "", label: "Select folder" },
              { value: "new", label: "+ New Folder" },
            ],
          },
        ],
      },
    ],
  },

  pdf: {
    sections: [
      {
        id: "upload",
        icon: "FaFilePdf",
        title: "Upload PDF",
        required: true,
        description: "Upload your PDF file or provide a URL.",
        fields: [
          {
            id: "pdfFile",
            type: "file",
            label: "PDF File",
            accept: ".pdf",
            required: true,
          },
          {
            id: "pdfUrl",
            type: "url",
            label: "Or PDF URL",
            placeholder: "https://example.com/file.pdf",
          },
          {
            id: "title",
            type: "text",
            label: "Title",
            placeholder: "Document title",
          },
          {
            id: "description",
            type: "textarea",
            label: "Description",
            placeholder: "Add a description",
            rows: 3,
          },
          {
            id: "buttonText",
            type: "text",
            label: "Button Text",
            placeholder: "Download PDF",
            defaultValue: "Download PDF",
          },
          {
            id: "thumbnail",
            type: "file",
            label: "Thumbnail Image",
            accept: "image/*",
          },
        ],
      },
      {
        id: "name",
        icon: "FaQrcode",
        title: "Name of the QR Code",
        fields: [
          {
            id: "name",
            type: "text",
            label: "Name",
            placeholder: "e.g. Product brochure",
          },
        ],
      },
    ],
  },

  vcard: {
    sections: [
      {
        id: "design",
        icon: "FaPalette",
        title: "Design",
        fields: [
          {
            id: "colorPalette",
            type: "section",
            label: "Color Palette",
            fields: [
              {
                id: "primaryColor",
                type: "color",
                label: "Primary Color",
                defaultValue: "#4f46e5",
              },
              {
                id: "secondaryColor",
                type: "color",
                label: "Secondary Color",
                defaultValue: "#6366f1",
              },
            ],
          },
        ],
      },
      {
        id: "personal",
        icon: "FaUser",
        title: "Personal Information",
        fields: [
          {
            id: "profileImage",
            type: "file",
            label: "Profile Image",
            accept: "image/*",
          },
          {
            id: "firstName",
            type: "text",
            label: "Name",
            required: true,
            placeholder: "John",
          },
          {
            id: "lastName",
            type: "text",
            label: "Surname",
            placeholder: "Doe",
          },
        ],
      },
      {
        id: "contact",
        icon: "FaPhone",
        title: "Contact Details",
        fields: [
          {
            id: "phones",
            type: "repeater",
            label: "Add Phone",
            fields: [
              {
                id: "phone",
                type: "tel",
                label: "Phone",
                placeholder: "+1 555 123 4567",
              },
              {
                id: "label",
                type: "text",
                label: "Label",
                placeholder: "Mobile",
              },
            ],
            defaultValue: [{ phone: "", label: "" }],
          },
          {
            id: "emails",
            type: "repeater",
            label: "Add Email",
            fields: [
              {
                id: "email",
                type: "email",
                label: "Email",
                placeholder: "you@example.com",
              },
              {
                id: "label",
                type: "text",
                label: "Label",
                placeholder: "Work",
              },
            ],
            defaultValue: [{ email: "", label: "" }],
          },
          {
            id: "websites",
            type: "repeater",
            label: "Add Website",
            fields: [
              {
                id: "url",
                type: "url",
                label: "Website",
                placeholder: "https://example.com",
              },
              {
                id: "label",
                type: "text",
                label: "Label",
                placeholder: "Personal",
              },
            ],
            defaultValue: [{ url: "", label: "" }],
          },
          {
            id: "addContactAtTop",
            type: "toggle",
            label: "Add contact at the top",
            defaultValue: false,
          },
        ],
      },
      {
        id: "location",
        icon: "FaMapMarkerAlt",
        title: "Location",
        fields: [
          {
            id: "addressSearch",
            type: "text",
            label: "Address Search",
            placeholder: "Search for address",
          },
          {
            id: "manualEntry",
            type: "toggle",
            label: "Manual entry",
            defaultValue: false,
          },
          {
            id: "street",
            type: "text",
            label: "Street",
            placeholder: "123 Main St",
            conditional: "manualEntry",
          },
          {
            id: "city",
            type: "text",
            label: "City",
            placeholder: "New York",
            conditional: "manualEntry",
          },
          {
            id: "postalCode",
            type: "text",
            label: "Postal Code",
            placeholder: "10001",
            conditional: "manualEntry",
          },
          {
            id: "country",
            type: "select",
            label: "Country",
            options: [
              { value: "us", label: "United States" },
              { value: "uk", label: "United Kingdom" },
              { value: "ca", label: "Canada" },
              { value: "au", label: "Australia" },
            ],
            conditional: "manualEntry",
          },
        ],
      },
      {
        id: "company",
        icon: "FaBuilding",
        title: "Company Details",
        fields: [
          {
            id: "company",
            type: "text",
            label: "Company",
            placeholder: "Company Name",
          },
          {
            id: "profession",
            type: "text",
            label: "Profession",
            placeholder: "Software Engineer",
          },
          {
            id: "summary",
            type: "textarea",
            label: "Summary",
            placeholder: "Write a brief summary...",
            rows: 4,
          },
        ],
      },
      {
        id: "social",
        icon: "FaShareAlt",
        title: "Social Networks",
        fields: [
          {
            id: "socialNetworks",
            type: "iconSelector",
            label: "Social Networks",
            icons: [
              { id: "facebook", icon: "FaFacebook", label: "Facebook" },
              { id: "instagram", icon: "FaInstagram", label: "Instagram" },
              { id: "twitter", icon: "FaTwitter", label: "Twitter" },
              { id: "linkedin", icon: "FaLinkedin", label: "LinkedIn" },
              { id: "youtube", icon: "FaYoutube", label: "YouTube" },
              { id: "tiktok", icon: "FaTiktok", label: "TikTok" },
              { id: "whatsapp", icon: "FaWhatsapp", label: "WhatsApp" },
            ],
            defaultValue: {},
          },
        ],
      },
      {
        id: "fonts",
        icon: "FaFont",
        title: "Fonts",
        fields: [
          {
            id: "fontFamily",
            type: "select",
            label: "Choose font family",
            options: [
              { value: "inter", label: "Inter" },
              { value: "roboto", label: "Roboto" },
              { value: "opensans", label: "Open Sans" },
              { value: "lato", label: "Lato" },
            ],
          },
        ],
      },
      {
        id: "welcome",
        icon: "FaImage",
        title: "Welcome Screen",
        fields: [
          {
            id: "welcomeImage",
            type: "file",
            label: "Add welcome image",
            accept: "image/*",
          },
        ],
      },
      {
        id: "name",
        icon: "FaQrcode",
        title: "Name of the QR Code",
        fields: [
          {
            id: "name",
            type: "text",
            label: "Name",
            placeholder: "My vCard",
          },
        ],
      },
      {
        id: "password",
        icon: "FaLock",
        title: "Password",
        fields: [
          {
            id: "passwordEnabled",
            type: "toggle",
            label: "Activate password to access the QR code.",
            defaultValue: false,
          },
          {
            id: "password",
            type: "password",
            label: "Password",
            placeholder: "Enter password",
            conditional: "passwordEnabled",
          },
        ],
      },
      {
        id: "folder",
        icon: "FaFolder",
        title: "Folder",
        fields: [
          {
            id: "folder",
            type: "select",
            label: "Select Folder",
            options: [
              { value: "", label: "Select folder" },
              { value: "new", label: "+ New Folder" },
            ],
          },
        ],
      },
    ],
  },

  links: {
    sections: [
      {
        id: "profile",
        icon: "FaUser",
        title: "Profile",
        fields: [
          {
            id: "profileImage",
            type: "file",
            label: "Profile Image",
            accept: "image/*",
          },
          {
            id: "title",
            type: "text",
            label: "Title",
            required: true,
            placeholder: "Your Name",
          },
          {
            id: "description",
            type: "textarea",
            label: "Description",
            placeholder: "Add a description",
            rows: 3,
          },
        ],
      },
      {
        id: "buttons",
        icon: "FaLink",
        title: "Buttons",
        fields: [
          {
            id: "buttons",
            type: "repeater",
            label: "Add Button",
            fields: [
              {
                id: "label",
                type: "text",
                label: "Label",
                required: true,
                placeholder: "Button Label",
              },
              {
                id: "url",
                type: "url",
                label: "URL",
                required: true,
                placeholder: "https://example.com",
              },
              {
                id: "icon",
                type: "iconSelector",
                label: "Icon",
                single: true,
                icons: [
                  { id: "link", icon: "FaLink", label: "Link" },
                  { id: "globe", icon: "FaGlobe", label: "Website" },
                  { id: "envelope", icon: "FaEnvelope", label: "Email" },
                ],
              },
            ],
            defaultValue: [{ label: "", url: "", icon: "" }],
          },
        ],
      },
      {
        id: "branding",
        icon: "FaPalette",
        title: "Branding",
        fields: [
          {
            id: "themeColor",
            type: "color",
            label: "Theme Color",
            defaultValue: "#4f46e5",
          },
          {
            id: "buttonStyle",
            type: "select",
            label: "Button Style",
            options: [
              { value: "filled", label: "Filled" },
              { value: "outlined", label: "Outlined" },
              { value: "text", label: "Text" },
            ],
          },
          {
            id: "backgroundColor",
            type: "color",
            label: "Background Color",
            defaultValue: "#ffffff",
          },
          {
            id: "useGradient",
            type: "toggle",
            label: "Use gradient background",
            defaultValue: false,
          },
        ],
      },
      {
        id: "social",
        icon: "FaShareAlt",
        title: "Social Links",
        fields: [
          {
            id: "socialNetworks",
            type: "iconSelector",
            label: "Social Networks",
            icons: [
              { id: "facebook", icon: "FaFacebook", label: "Facebook" },
              { id: "instagram", icon: "FaInstagram", label: "Instagram" },
              { id: "twitter", icon: "FaTwitter", label: "Twitter" },
              { id: "linkedin", icon: "FaLinkedin", label: "LinkedIn" },
            ],
            defaultValue: {},
          },
        ],
      },
    ],
  },

  images: {
    sections: [
      {
        id: "upload",
        icon: "FaImages",
        title: "Upload Images",
        required: true,
        fields: [
          {
            id: "images",
            type: "file",
            label: "Upload Images",
            accept: "image/*",
            multiple: true,
            required: true,
          },
          {
            id: "galleryLayout",
            type: "select",
            label: "Gallery Layout",
            options: [
              { value: "grid", label: "Grid" },
              { value: "carousel", label: "Carousel" },
              { value: "masonry", label: "Masonry" },
            ],
          },
          {
            id: "title",
            type: "text",
            label: "Title",
            placeholder: "Gallery Title",
          },
          {
            id: "description",
            type: "textarea",
            label: "Description",
            placeholder: "Add a description",
            rows: 3,
          },
        ],
      },
    ],
  },

  video: {
    sections: [
      {
        id: "upload",
        icon: "FaVideo",
        title: "Video",
        required: true,
        fields: [
          {
            id: "videoFile",
            type: "file",
            label: "Upload Video",
            accept: "video/*",
          },
          {
            id: "youtubeUrl",
            type: "url",
            label: "Or YouTube URL",
            placeholder: "https://youtube.com/watch?v=...",
          },
          {
            id: "coverImage",
            type: "file",
            label: "Cover Image",
            accept: "image/*",
          },
          {
            id: "title",
            type: "text",
            label: "Title",
            placeholder: "Video Title",
          },
          {
            id: "description",
            type: "textarea",
            label: "Description",
            placeholder: "Add a description",
            rows: 3,
          },
        ],
      },
    ],
  },

  mp3: {
    sections: [
      {
        id: "upload",
        icon: "FaMusic",
        title: "Audio File",
        required: true,
        fields: [
          {
            id: "audioFile",
            type: "file",
            label: "Upload MP3",
            accept: "audio/*",
            required: true,
          },
          {
            id: "coverImage",
            type: "file",
            label: "Cover Image",
            accept: "image/*",
          },
          {
            id: "title",
            type: "text",
            label: "Title",
            placeholder: "Song Title",
          },
          {
            id: "artist",
            type: "text",
            label: "Artist Name",
            placeholder: "Artist Name",
          },
          {
            id: "description",
            type: "textarea",
            label: "Description",
            placeholder: "Add a description",
            rows: 3,
          },
        ],
      },
    ],
  },

  menu: {
    sections: [
      {
        id: "upload",
        icon: "FaUtensils",
        title: "Menu",
        required: true,
        fields: [
          {
            id: "menuFile",
            type: "file",
            label: "Upload PDF or Images",
            accept: ".pdf,image/*",
            multiple: true,
          },
          {
            id: "restaurantName",
            type: "text",
            label: "Restaurant Name",
            required: true,
            placeholder: "Restaurant Name",
          },
          {
            id: "menuTitle",
            type: "text",
            label: "Menu Title",
            placeholder: "Dinner Menu",
          },
          {
            id: "description",
            type: "textarea",
            label: "Description",
            placeholder: "Add a description",
            rows: 3,
          },
          {
            id: "sections",
            type: "repeater",
            label: "Menu Sections",
            fields: [
              {
                id: "sectionName",
                type: "text",
                label: "Section Name",
                placeholder: "Breakfast",
              },
              {
                id: "items",
                type: "repeater",
                label: "Items",
                fields: [
                  {
                    id: "itemName",
                    type: "text",
                    label: "Item Name",
                    placeholder: "Item Name",
                  },
                  {
                    id: "price",
                    type: "text",
                    label: "Price",
                    placeholder: "$10.00",
                  },
                  {
                    id: "description",
                    type: "textarea",
                    label: "Description",
                    placeholder: "Item description",
                    rows: 2,
                  },
                ],
                defaultValue: [{ itemName: "", price: "", description: "" }],
              },
            ],
            defaultValue: [{ sectionName: "", items: [] }],
          },
        ],
      },
    ],
  },

  wifi: {
    sections: [
      {
        id: "network",
        icon: "FaWifi",
        title: "WiFi Network",
        required: true,
        fields: [
          {
            id: "ssid",
            type: "text",
            label: "SSID (Network Name)",
            required: true,
            placeholder: "MyWiFi",
          },
          {
            id: "password",
            type: "password",
            label: "Password",
            placeholder: "Network password",
          },
          {
            id: "security",
            type: "select",
            label: "Security Type",
            options: [
              { value: "WPA", label: "WPA" },
              { value: "WPA2", label: "WPA2" },
              { value: "WEP", label: "WEP" },
              { value: "nopass", label: "No Password" },
            ],
            defaultValue: "WPA2",
          },
          {
            id: "hidden",
            type: "toggle",
            label: "Hidden network",
            defaultValue: false,
          },
        ],
      },
    ],
  },

  social: {
    sections: [
      {
        id: "networks",
        icon: "FaShareAlt",
        title: "Social Media",
        fields: [
          {
            id: "socialNetworks",
            type: "iconSelector",
            label: "Social Networks",
            icons: [
              { id: "facebook", icon: "FaFacebook", label: "Facebook" },
              { id: "instagram", icon: "FaInstagram", label: "Instagram" },
              { id: "twitter", icon: "FaTwitter", label: "Twitter" },
              { id: "linkedin", icon: "FaLinkedin", label: "LinkedIn" },
              { id: "youtube", icon: "FaYoutube", label: "YouTube" },
              { id: "tiktok", icon: "FaTiktok", label: "TikTok" },
              { id: "pinterest", icon: "FaPinterest", label: "Pinterest" },
              { id: "snapchat", icon: "FaSnapchat", label: "Snapchat" },
            ],
            defaultValue: {},
            showAll: true,
          },
        ],
      },
    ],
  },

  business: {
    sections: [
      {
        id: "company",
        icon: "FaBuilding",
        title: "Company Information",
        required: true,
        fields: [
          {
            id: "companyName",
            type: "text",
            label: "Company Name",
            required: true,
            placeholder: "Company Name",
          },
          {
            id: "logo",
            type: "file",
            label: "Logo Image",
            accept: "image/*",
          },
          {
            id: "about",
            type: "textarea",
            label: "About",
            placeholder: "About the company",
            rows: 4,
          },
        ],
      },
      {
        id: "services",
        icon: "FaList",
        title: "Services",
        fields: [
          {
            id: "services",
            type: "repeater",
            label: "Add Service",
            fields: [
              {
                id: "serviceName",
                type: "text",
                label: "Service Name",
                placeholder: "Service Name",
              },
              {
                id: "description",
                type: "textarea",
                label: "Description",
                placeholder: "Service description",
                rows: 2,
              },
            ],
            defaultValue: [{ serviceName: "", description: "" }],
          },
        ],
      },
      {
        id: "location",
        icon: "FaMapMarkerAlt",
        title: "Location",
        fields: [
          {
            id: "address",
            type: "textarea",
            label: "Address",
            placeholder: "Street address",
            rows: 2,
          },
          {
            id: "hours",
            type: "textarea",
            label: "Hours of Operation",
            placeholder: "Mon-Fri: 9am-5pm",
            rows: 3,
          },
        ],
      },
      {
        id: "contact",
        icon: "FaPhone",
        title: "Contact Details",
        fields: [
          {
            id: "phone",
            type: "tel",
            label: "Phone",
            placeholder: "+1 555 123 4567",
          },
          {
            id: "email",
            type: "email",
            label: "Email",
            placeholder: "contact@company.com",
          },
          {
            id: "website",
            type: "url",
            label: "Website",
            placeholder: "https://company.com",
          },
        ],
      },
    ],
  },
};

// Helper to get schema for a QR type
export function getSchemaForType(type) {
  return qrTypeSchemas[type] || qrTypeSchemas.website;
}

