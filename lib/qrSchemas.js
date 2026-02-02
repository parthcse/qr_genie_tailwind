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

            type: "folder",
            label: "Select Folder",
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

        title: "PDF File",
        required: true,
        description: "Upload the PDF file you want to display.",
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

            id: "directShow",
            type: "toggle",
            label: "Directly show the PDF file.",
            defaultValue: false,
          },
        ],
      },
      {
        id: "design",
        icon: "FaPalette",
        title: "Design",
        description: "Choose a color theme for your page.",
        fields: [
          {
            id: "colorPalette",
            type: "colorPalette",
            label: "Color palette",
          },
          {
            id: "primaryColor",
            type: "color",
            label: "Primary color",
            defaultValue: "#527AC9",
          },
          {
            id: "secondaryColor",
            type: "color",
            label: "Secondary color",
            defaultValue: "#7EC09F",
          },
        ],
      },
      {
        id: "fonts",
        icon: "FaFont",
        title: "Fonts",
        description: "Make your page unique with original fonts.",
        fields: [
          {
            id: "titleFont",
            type: "select",
            label: "Title",
            defaultValue: "GT Walsheim Pro",
            options: [
              { value: "GT Walsheim Pro", label: "GT Walsheim Pro" },
              { value: "Inter", label: "Inter" },
              { value: "Roboto", label: "Roboto" },
              { value: "Open Sans", label: "Open Sans" },
              { value: "Lato", label: "Lato" },
              { value: "Montserrat", label: "Montserrat" },
              { value: "Poppins", label: "Poppins" },
              { value: "Playfair Display", label: "Playfair Display" },
            ],
          },
          {
            id: "bodyFont",
            type: "select",
            label: "Texts",
            defaultValue: "GT Walsheim Pro",
            options: [
              { value: "GT Walsheim Pro", label: "GT Walsheim Pro" },
              { value: "Inter", label: "Inter" },
              { value: "Roboto", label: "Roboto" },
              { value: "Open Sans", label: "Open Sans" },
              { value: "Lato", label: "Lato" },
              { value: "Montserrat", label: "Montserrat" },
              { value: "Poppins", label: "Poppins" },
              { value: "Source Sans Pro", label: "Source Sans Pro" },
            ],
          },
        ],
      },
      {
        id: "information",
        icon: "FaInfoCircle",
        title: "PDF Information",
        description: "Add some context to your PDF.",
        fields: [
          {
            id: "company",
            type: "text",
            label: "Company",
            placeholder: "E.g. My Firm",
          },
          {
            id: "title",
            type: "text",
            label: "PDF title",
            placeholder: "E.g. Annual Report",
          },
          {
            id: "description",
            type: "textarea",
            label: "Description",

            placeholder: "E.g. My Firm's Annual Report",
            rows: 3,
            maxLength: 4000,
          },
          {
            id: "website",
            type: "url",
            label: "Website",
            placeholder: "E.g. https://www.myfirm.com/",
          },
          {
            id: "buttonText",
            type: "text",

            label: "Button",
            placeholder: "E.g. View pdf",
            defaultValue: "View PDF",
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

            type: "folder",
            label: "Select Folder",
          },
        ],
      },
    ],
  },

  links: {
    sections: [
      {

        id: "design",
        icon: "FaPalette",
        title: "Design",
        description: "Choose a color theme for your page.",
        fields: [
          {
            id: "backgroundColor",
            type: "color",
            label: "Background color",
            defaultValue: "#7EC09F",
          },
          {
            id: "linkBackgroundColor",
            type: "color",
            label: "Background color of the link",
            defaultValue: "#F7F7F7",
          },
          {
            id: "linkTextColor",
            type: "color",
            label: "Link text color",
            defaultValue: "#242420",
          },
        ],
      },
      {
        id: "basic",
        icon: "FaUser",
        title: "Basic Information",
        required: true,
        description: "Add your profile information.",
        fields: [
          {
            id: "profileImage",
            type: "file",

            label: "Image",
            accept: "image/*",
            helpText: true,
          },
          {
            id: "name",
            type: "text",
            label: "Title",
            required: true,
            placeholder: "E.g. Find me on social networks",
          },
          {
            id: "description",
            type: "textarea",
            label: "Description",

            placeholder: "E.g. New content every week in the links below",
            rows: 3,
            maxLength: 4000,
          },
        ],
      },
      {

        id: "listOfLinks",
        icon: "FaLink",
        title: "List of Links",
        required: true,
        description: "Add your profiles usernames or links to social media pages.",
        fields: [
          {
            id: "buttons",
            type: "repeater",

            label: "Add Link",
            fields: [
              {
                id: "icon",
                type: "file",
                label: "Image",
                accept: "image/*",
              },
              {
                id: "title",
                type: "text",
                label: "Link text",
                required: true,
                placeholder: "Name of the link",
              },
              {
                id: "url",
                type: "url",
                label: "URL",
                required: true,

                placeholder: "E.g. https://mywebsite.com/",
              },
            ],
            defaultValue: [{ title: "", url: "", icon: "" }],
          },
        ],
      },
      {

        id: "socialNetworks",
        icon: "FaShareAlt",
        title: "Social Networks",
        description: "Add social media links to your page.",
        fields: [
          {
            id: "socialLinks",
            type: "repeater",
            label: "Social Networks",
            fields: [
              {
                id: "icon",
                type: "socialIcon",
                label: "Icon",
                required: true,
              },
              {
                id: "url",
                type: "url",
                label: "URL",
                required: false,
                placeholder: "E.g. https://socialnetworks.com/",
              },
              {
                id: "userId",
                type: "text",
                label: "User ID",
                required: false,
                placeholder: "E.g. MyUserID",
              },
              {
                id: "text",
                type: "text",
                label: "Text",
                placeholder: "E.g. Follow us",
              },
            ],
            defaultValue: [],
            iconOptions: [
              { id: "globe", icon: "FaGlobe", label: "Web", useUserId: false },
              { id: "dribbble", icon: "FaDribbble", label: "Dribbble", useUserId: true },
              { id: "facebook", icon: "FaFacebook", label: "Facebook", useUserId: false },
              { id: "flickr", icon: "FaFlickr", label: "Flickr", useUserId: false },
              { id: "github", icon: "FaGithub", label: "GitHub", useUserId: false },
              { id: "google", icon: "FaGoogle", label: "Google", useUserId: false },
              { id: "line", icon: "FaLine", label: "LINE", useUserId: false },
              { id: "linkedin", icon: "FaLinkedin", label: "LinkedIn", useUserId: false },
              { id: "pinterest", icon: "FaPinterest", label: "Pinterest", useUserId: false },
              { id: "reddit", icon: "FaReddit", label: "Reddit", useUserId: false },
              { id: "skype", icon: "FaSkype", label: "Skype", useUserId: false },
              { id: "snapchat", icon: "FaSnapchat", label: "Snapchat", useUserId: true },
              { id: "tripadvisor", icon: "FaTripadvisor", label: "TripAdvisor", useUserId: false },
              { id: "tumblr", icon: "FaTumblr", label: "Tumblr", useUserId: false },
              { id: "twitter", icon: "FaTwitter", label: "Twitter", useUserId: false },
              { id: "vimeo", icon: "FaVimeo", label: "Vimeo", useUserId: false },
              { id: "vk", icon: "FaVk", label: "VK", useUserId: false },
              { id: "wechat", icon: "FaWechat", label: "WeChat", useUserId: false },
              { id: "youtube", icon: "FaYoutube", label: "YouTube", useUserId: false },
              { id: "instagram", icon: "FaInstagram", label: "Instagram", useUserId: true },
              { id: "tiktok", icon: "FaTiktok", label: "TikTok", useUserId: true },
              { id: "whatsapp", icon: "FaWhatsapp", label: "WhatsApp", useUserId: false },
              { id: "telegram", icon: "FaTelegram", label: "Telegram", useUserId: false },
              { id: "facebook-messenger", icon: "FaFacebookMessenger", label: "Messenger", useUserId: false },
              { id: "deviantart", icon: "FaDeviantart", label: "DeviantArt", useUserId: false },
              { id: "uber", icon: "FaUber", label: "Uber Eats", useUserId: false },
              { id: "strava", icon: "FaStrava", label: "Strava", useUserId: false },
              { id: "spotify", icon: "FaSpotify", label: "Spotify", useUserId: false },
              { id: "soundcloud", icon: "FaSoundcloud", label: "SoundCloud", useUserId: false },
              { id: "apple", icon: "FaApple", label: "Apple Music", useUserId: false },
              { id: "behance", icon: "FaBehance", label: "Behance", useUserId: false },
              { id: "foursquare", icon: "FaFoursquare", label: "Foursquare", useUserId: false },
              { id: "yelp", icon: "FaYelp", label: "Yelp", useUserId: false },
              { id: "link", icon: "FaLink", label: "Custom Link", useUserId: false },
            ],
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

        id: "wifiInfo",
        icon: "FaWifi",
        title: "Wi-Fi Information *",
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
        title: "Name of the QR Code",
        description: "Give a name to your QR code.",
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
        description: "Link this QR to an existing or a new folder.",
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
        title: "WhatsApp Information",
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
        title: "Name of the QR Code",
        description: "Give a name to your QR code.",
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
        description: "Link this QR to an existing or a new folder.",
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
        title: "Basic Information",
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
        title: "Name of the QR Code",
        description: "Give a name to your QR code.",
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
        description: "Link this QR to an existing or a new folder.",
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

