// lib/qr/qrSchemas.js
// JSON schemas for all QR code types

// Sections several types share: the page's colour theme, the code's private name and its folder
const LOOK_SECTION = {
  id: "look",
  icon: "FaPalette",
  title: "Colours",
  description: "Pick a colour theme for your page.",
  fields: [{ id: "theme", type: "theme", label: "Theme" }],
};
const nameSection = (placeholder) => ({
  id: "name",
  icon: "FaQrcode",
  title: "Name",
  description: "Only you see this. It helps you find the code later.",
  fields: [{ id: "name", type: "text", label: "Name", placeholder }],
});
const FOLDER_SECTION = {
  id: "folder",
  icon: "FaFolder",
  title: "Folder",
  description: "Keep your codes organized in folders.",
  fields: [{ id: "folder", type: "folder", label: "Select Folder" }],
};

export const qrTypeSchemas = {
  website: {
    sections: [
      {
        id: "website",
        icon: "FaGlobe",
        title: "Website",
        required: true,
        description: "The page people open when they scan your code.",
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
        title: "Name",
        description: "Only you see this. It helps you find the code later.",
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
        title: "Password protection",
        description: "Ask people for a password before they reach the website.",
        fields: [
          {
            id: "passwordEnabled",
            type: "toggle",
            label: "Require a password to open this link",
            defaultValue: false,
          },
          {
            id: "password",
            type: "password",
            label: "Password",
            placeholder: "At least 4 characters",
            conditional: "passwordEnabled",
          },
        ],
      },
      {
        id: "folder",
        icon: "FaFolder",
        title: "Folder",
        description: "Keep your codes organized in folders.",
        fields: [
          {
            id: "folder",

            type: "folder",
            label: "Select Folder",
          },
        ],
      },
    ],
  },

  // A page QR-Genie hosts: content rules in lib/qr/qrContent.js, the page in components/qr/landing/LinksLanding.js
  links: {
    sections: [
      {
        id: "page",
        icon: "FaUserCircle",
        title: "Your page",
        required: true,
        description: "What people see at the top of the page.",
        fields: [
          { id: "avatar", type: "image", label: "Photo or logo" },
          { id: "title", type: "text", label: "Title", required: true, placeholder: "e.g. Café Aroma" },
          {
            id: "description",
            type: "textarea",
            label: "Short description",
            placeholder: "e.g. Fresh coffee and cakes in the old town. Open every day.",
            rows: 3,
            maxLength: 300,
          },
        ],
      },
      {
        id: "links",
        icon: "FaLink",
        title: "Links",
        required: true,
        description: "One button for each link, in this order. You can change them after printing.",
        fields: [{ id: "links", type: "linkList", label: "Buttons", required: true, max: 20 }],
      },
      {
        id: "look",
        icon: "FaPalette",
        title: "Colours",
        description: "Pick a colour theme for your page.",
        fields: [{ id: "theme", type: "theme", label: "Theme" }],
      },
      {
        id: "name",
        icon: "FaQrcode",
        title: "Name",
        description: "Only you see this. It helps you find the code later.",
        fields: [{ id: "name", type: "text", label: "Name", placeholder: "e.g. Shop window link page" }],
      },
      {
        id: "folder",
        icon: "FaFolder",
        title: "Folder",
        description: "Keep your codes organized in folders.",
        fields: [{ id: "folder", type: "folder", label: "Select Folder" }],
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

        id: "wifiInfo",
        icon: "FaWifi",
        title: "Wi-Fi network",
        required: true,
        description: "Provide your network information.",
        fields: [
          {
            id: "ssid",
            type: "text",

            label: "Network name *",
            required: true,
            placeholder: "E.g. MyWifi",
          },
          {
            id: "password",
            type: "password",

            label: "Network password",
            placeholder: "E.g. Wi-Fi Password",
          },
          {
            id: "security",
            type: "select",

            label: "Encryption type",
            options: [
              { value: "WPA", label: "WPA" },
              { value: "WEP", label: "WEP" },
              { value: "WPA-EAP", label: "WPA-EAP" },
              { value: "nopass", label: "nopass" },
            ],
            defaultValue: "WPA",
          },
          {
            id: "hidden",
            type: "toggle",
            label: "Hidden network",
            defaultValue: false,
          },
        ],
      },

      {
        id: "name",
        icon: "FaQrcode",
        title: "Name",
        description: "Only you see this. It helps you find the code later.",
        fields: [
          {
            id: "name",
            type: "text",
            label: "Name",
            placeholder: "e.g. My QR code",
          },
        ],
      },
      {
        id: "folder",
        icon: "FaFolder",
        title: "Folder",
        description: "Keep your codes organized in folders.",
        fields: [
          {
            id: "folder",
            type: "folder",
            label: "Select Folder",
          },
        ],
      },
    ],
  },

  whatsapp: {
    sections: [
      {
        id: "whatsappInfo",
        icon: "FaWhatsapp",
        title: "WhatsApp chat",
        required: true,
        description: "Scanning this QR code will open WhatsApp, ready to text the provided phone number. Optionally add a prefilled message.",
        fields: [
          {
            id: "countryCode",
            type: "select",
            label: "Country",
            required: true,
            defaultValue: "+91",
            options: [
              { value: "+91", label: "India +91" },
              { value: "+1", label: "United States +1" },
              { value: "+44", label: "United Kingdom +44" },
              { value: "+86", label: "China +86" },
              { value: "+81", label: "Japan +81" },
              { value: "+49", label: "Germany +49" },
              { value: "+33", label: "France +33" },
              { value: "+39", label: "Italy +39" },
              { value: "+34", label: "Spain +34" },
              { value: "+7", label: "Russia +7" },
              { value: "+82", label: "South Korea +82" },
              { value: "+61", label: "Australia +61" },
              { value: "+55", label: "Brazil +55" },
              { value: "+52", label: "Mexico +52" },
              { value: "+27", label: "South Africa +27" },
              { value: "+971", label: "UAE +971" },
              { value: "+966", label: "Saudi Arabia +966" },
              { value: "+65", label: "Singapore +65" },
              { value: "+60", label: "Malaysia +60" },
              { value: "+62", label: "Indonesia +62" },
              { value: "+84", label: "Vietnam +84" },
              { value: "+66", label: "Thailand +66" },
              { value: "+63", label: "Philippines +63" },
              { value: "+92", label: "Pakistan +92" },
              { value: "+880", label: "Bangladesh +880" },
              { value: "+94", label: "Sri Lanka +94" },
              { value: "+977", label: "Nepal +977" },
            ],
          },
          {
            id: "phone",
            type: "tel",
            label: "Phone number",
            required: true,
            placeholder: "081234 56789",
          },
          {
            id: "message",
            type: "textarea",
            label: "Message",
            placeholder: "Write your message",
            rows: 3,
          },
        ],
      },
      {
        id: "name",
        icon: "FaQrcode",
        title: "Name",
        description: "Only you see this. It helps you find the code later.",
        fields: [
          {
            id: "name",
            type: "text",
            label: "Name",
            placeholder: "e.g. My WhatsApp QR code",
          },
        ],
      },
      {
        id: "folder",
        icon: "FaFolder",
        title: "Folder",
        description: "Keep your codes organized in folders.",
        fields: [
          {
            id: "folder",
            type: "folder",
            label: "Select Folder",
          },
        ],
      },
    ],
  },

  instagram: {
    sections: [
      {
        id: "instagramInfo",
        icon: "FaInstagram",
        title: "Instagram profile",
        required: true,
        description: "Enter the Instagram username that this QR code will redirect to.",
        fields: [
          {
            id: "username",
            type: "text",
            label: "Username",
            required: true,
            placeholder: "username",
            prefix: "@",
          },
        ],
      },
      {
        id: "name",
        icon: "FaQrcode",
        title: "Name",
        description: "Only you see this. It helps you find the code later.",
        fields: [
          {
            id: "name",
            type: "text",
            label: "Name",
            placeholder: "e.g. My Instagram QR code",
          },
        ],
      },
      {
        id: "folder",
        icon: "FaFolder",
        title: "Folder",
        description: "Keep your codes organized in folders.",
        fields: [
          {
            id: "folder",
            type: "folder",
            label: "Select Folder",
          },
        ],
      },
    ],
  },

  // Hosted page: content rules in lib/qr/qrContent.js, platforms in lib/qr/socialPlatforms.js
  social: {
    sections: [
      {
        id: "page",
        icon: "FaUserCircle",
        title: "Your page",
        required: true,
        description: "What people see at the top of the page.",
        fields: [
          { id: "avatar", type: "image", label: "Photo or logo" },
          { id: "title", type: "text", label: "Name or brand", required: true, placeholder: "e.g. Café Aroma" },
          { id: "description", type: "textarea", label: "Short description", placeholder: "e.g. Follow us for new dishes and events.", rows: 3, maxLength: 300 },
        ],
      },
      {
        id: "profiles",
        icon: "FaShareAlt",
        title: "Social profiles",
        required: true,
        description: "Type a username or paste a link. You can change them after printing.",
        fields: [{ id: "profiles", type: "profileList", label: "Profiles", required: true, max: 20 }],
      },
      LOOK_SECTION,
      nameSection("e.g. Social profiles on the menu"),
      FOLDER_SECTION,
    ],
  },

  // Forwards to a Facebook page (pages/api/create-dynamic.js)
  facebook: {
    sections: [
      {
        id: "facebookInfo",
        icon: "FaFacebook",
        title: "Facebook page",
        required: true,
        description: "Scanning this code opens your Facebook page, in the Facebook app when it's installed.",
        fields: [{ id: "page", type: "text", label: "Page name or link", required: true, placeholder: "e.g. cafearoma or facebook.com/cafearoma" }],
      },
      nameSection("e.g. My Facebook QR code"),
      FOLDER_SECTION,
    ],
  },

  // Hosted page with "Save contact": content rules in lib/qr/qrContent.js, page in components/qr/landing/BusinessLanding.js
  business: {
    sections: [
      {
        id: "page",
        icon: "FaBuilding",
        title: "Your business",
        required: true,
        description: "What people see at the top of the page.",
        fields: [
          { id: "avatar", type: "image", label: "Logo", round: false },
          { id: "businessName", type: "text", label: "Business name", required: true, placeholder: "e.g. Café Aroma" },
          { id: "description", type: "textarea", label: "About", placeholder: "e.g. Coffee, cakes and light lunches in the old town since 2015.", rows: 3, maxLength: 500 },
        ],
      },
      {
        id: "contact",
        icon: "FaPhone",
        title: "Contact and location",
        required: true,
        description: "Add at least one. People can call, email, visit your website or get directions in one tap.",
        fields: [
          { id: "phone", type: "tel", label: "Phone", placeholder: "e.g. +91 98765 43210" },
          { id: "email", type: "email", label: "Email", placeholder: "e.g. hello@cafearoma.com" },
          { id: "website", type: "url", label: "Website", placeholder: "e.g. cafearoma.com" },
          { id: "address", type: "textarea", label: "Address", placeholder: "e.g. 12 MG Road, Pune 411001", rows: 2, maxLength: 200 },
        ],
      },
      {
        id: "hours",
        icon: "FaClock",
        title: "Opening hours",
        description: "Optional. Write them the way you like.",
        fields: [{ id: "hours", type: "hours", label: "Hours" }],
      },
      {
        id: "profiles",
        icon: "FaShareAlt",
        title: "Social profiles",
        description: "Optional. Add your Instagram, Facebook, WhatsApp and more.",
        fields: [{ id: "profiles", type: "profileList", label: "Profiles", max: 10 }],
      },
      LOOK_SECTION,
      nameSection("e.g. Shop window business card"),
      FOLDER_SECTION,
    ],
  },

  // Hosted page with "Save contact" (a vCard): content rules in lib/qr/qrContent.js, page in ContactLanding.js
  vcard: {
    sections: [
      {
        id: "person",
        icon: "FaAddressCard",
        title: "About you",
        required: true,
        description: "Your name is required; everything else is optional.",
        fields: [
          { id: "avatar", type: "image", label: "Photo" },
          { id: "firstName", type: "text", label: "First name", placeholder: "e.g. Asha" },
          { id: "lastName", type: "text", label: "Last name", placeholder: "e.g. Patel" },
          { id: "jobTitle", type: "text", label: "Job title", placeholder: "e.g. Sales manager" },
          { id: "company", type: "text", label: "Company", placeholder: "e.g. Café Aroma" },
          { id: "note", type: "textarea", label: "Short note", placeholder: "e.g. Happy to help with catering and events.", rows: 2, maxLength: 300 },
        ],
      },
      {
        id: "contact",
        icon: "FaPhone",
        title: "Contact details",
        required: true,
        description: "Add at least a phone number, an email address or a website.",
        fields: [
          { id: "phone", type: "tel", label: "Mobile", placeholder: "e.g. +91 98765 43210" },
          { id: "phone2", type: "tel", label: "Work phone", placeholder: "Optional" },
          { id: "email", type: "email", label: "Email", placeholder: "e.g. asha@cafearoma.com" },
          { id: "website", type: "url", label: "Website", placeholder: "e.g. cafearoma.com" },
          { id: "address", type: "textarea", label: "Address", placeholder: "Optional", rows: 2, maxLength: 200 },
        ],
      },
      {
        id: "profiles",
        icon: "FaShareAlt",
        title: "Social profiles",
        description: "Optional. Add your LinkedIn, Instagram, WhatsApp and more.",
        fields: [{ id: "profiles", type: "profileList", label: "Profiles", max: 10 }],
      },
      LOOK_SECTION,
      nameSection("e.g. My business card"),
      FOLDER_SECTION,
    ],
  },
};

// Helper to get schema for a QR type
export function getSchemaForType(type) {
  return qrTypeSchemas[type] || qrTypeSchemas.website;
}

