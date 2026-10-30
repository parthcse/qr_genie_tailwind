import {
  FaBolt,
  FaBookOpen,
  FaChartLine,
  FaClipboardCheck,
  FaComments,
  FaConciergeBell,
  FaDownload,
  FaGlobe,
  FaHome,
  FaHotel,
  FaInstagram,
  FaLink,
  FaLock,
  FaMobileAlt,
  FaPalette,
  FaPause,
  FaPen,
  FaPrint,
  FaQrcode,
  FaShieldAlt,
  FaSyncAlt,
  FaTicketAlt,
  FaUserPlus,
  FaUtensils,
  FaWhatsapp,
  FaWifi,
} from "react-icons/fa";
import { TRIAL_DAYS } from "@/lib/billing/subscription";

/**
 * Content of the QR type and industry pages (rendered by LandingPage.js). Each page targets one search phrase from
 * the SEO plan: the title, h1 and first paragraph use it. Only promise what the product does today (see
 * DEVELOPER_GUIDE "QR codes"): Wi-Fi codes are static (no tracking, can't be edited), passwords only on website codes,
 * and the pages QR-Genie hosts are the released "page" types in lib/qr/qrTypes.js (list of links, menu, ...); forms
 * and uploaded files (PDFs, images) still live on pages people already have.
 *
 * Fields: path, crumb (breadcrumb name), seoTitle (≤ 60 characters), description (≤ 160), eyebrow { icon, label },
 * title + highlight (in the gradient) + subtitle (the h1), summary (one sentence under the h1 in the banner), intro (the overview below the banner), createType (preselected type on the create page, or null), cta, preview (the banner picture: qrColor, card (name, what it opens,
 * its scans; isStatic for Wi-Fi) and note), benefits, steps (3 or 4), ideas (type: which QR type fits, linked to
 * its page), faqs (also sent as FAQ structured data, so plain text), related (paths of other pages).
 */

// Short labels and pages of the QR types, for the badges on ideas and the related links
export const TYPE_PAGES = {
  website: { label: "Website QR code", path: "/website-qr-code" },
  menu: { label: "Menu QR code", path: "/restaurant-menu-qr-code" },
  links: { label: "List of links QR code", path: "/multiple-links-qr-code" },
  wifi: { label: "Wi-Fi QR code", path: "/wifi-qr-code" },
  whatsapp: { label: "WhatsApp QR code", path: "/whatsapp-qr-code" },
  instagram: { label: "Instagram QR code", path: "/instagram-qr-code" },
};

// The pages for the related links (long, descriptive label) and the footer (short label)
export const LANDING_LINKS = {
  "/website-qr-code": { label: "Website QR code", long: "Website QR code generator" },
  "/multiple-links-qr-code": { label: "List of links", long: "QR code for multiple links" },
  "/wifi-qr-code": { label: "Wi-Fi QR code", long: "Wi-Fi QR code generator" },
  "/whatsapp-qr-code": { label: "WhatsApp QR code", long: "WhatsApp QR code generator" },
  "/instagram-qr-code": { label: "Instagram QR code", long: "Instagram QR code generator" },
  "/restaurant-menu-qr-code": { label: "Restaurant menus", long: "QR codes for restaurant menus" },
  "/qr-codes-for-events": { label: "Events", long: "QR codes for events" },
  "/qr-codes-for-real-estate": { label: "Real estate", long: "QR codes for real estate" },
  "/qr-codes-for-hotels": { label: "Hotels", long: "QR codes for hotels" },
  "/qr-code-types": { label: "QR code types", long: "All QR code types" },
  "/pricing": { label: "Pricing", long: "Plans and pricing" },
};

const signUpStep = {
  icon: <FaUserPlus className="h-6 w-6" />,
  title: "Create a free account",
  description: `Sign up in under a minute. The ${TRIAL_DAYS}-day free trial needs no card.`,
};

export const LANDING_PAGES = {
  website: {
    path: "/website-qr-code",
    crumb: "Website QR code",
    seoTitle: "Website QR Code Generator with Tracking | QR-Genie",
    description:
      `Create a website QR code that opens any link. Change the URL after printing, track every scan and add your logo. Free for ${TRIAL_DAYS} days, no card needed.`,
    eyebrow: { icon: FaGlobe, label: "Website QR code" },
    title: "Website QR Code",
    highlight: "Generator",
    subtitle: "Link to any page and change it anytime",
    summary: "Turn any web address into a QR code you can edit after printing, with scan tracking built in.",
    intro:
      "Turn any web address into a QR code: your menu, booking page, online shop, review page or a PDF you host. Because QR-Genie codes are dynamic, you can change the link after the code is printed and see how many people scan it.",
    createType: "website",
    cta: "Create a website QR code",
    preview: {
      qrColor: "#4338ca",
      card: { title: "Website QR code", detail: "yourcafe.com/menu", stat: "248 scans this week" },
      note: { icon: FaLink, title: "Link updated", text: "No reprint needed" },
    },
    benefits: {
      title: "Why use a dynamic URL QR code",
      description: "A link QR code made with QR-Genie keeps working when your plans change.",
      items: [
        { icon: <FaLink className="h-5 w-5" />, title: "Change the link anytime", description: "Point the code at a new page whenever you need to. The printed code stays the same, so there's nothing to reprint." },
        { icon: <FaChartLine className="h-5 w-5" />, title: "See every scan", description: "Scans by day, country, city and device, unique visitors and your busiest hours, with CSV export." },
        { icon: <FaPalette className="h-5 w-5" />, title: "Your colours and logo", description: "Pick colours or a gradient, dot and corner styles, a frame with your own text, and your logo in the middle." },
        { icon: <FaLock className="h-5 w-5" />, title: "Optional password", description: "Ask for a password before the page opens, for staff-only pages, private documents or member offers." },
        { icon: <FaPause className="h-5 w-5" />, title: "Pause and resume", description: "Switch a code off when a campaign ends and show your own message instead. Switch it back on any time." },
        { icon: <FaDownload className="h-5 w-5" />, title: "Print-ready downloads", description: "Download PNG, SVG, JPEG or PDF, or print straight from your browser. SVG and PDF stay sharp at any size." },
      ],
    },
    steps: {
      title: "How to create a website QR code",
      items: [
        signUpStep,
        { icon: <FaLink className="h-6 w-6" />, title: "Paste your link", description: "Choose Website, paste the address and give the code a name so you can find it later." },
        { icon: <FaPalette className="h-6 w-6" />, title: "Design it", description: "Add your colours, logo and a frame with a call to action such as Scan for the menu." },
        { icon: <FaDownload className="h-6 w-6" />, title: "Download and print", description: "Download it for print or the web. Change the link later from your dashboard." },
      ],
    },
    ideas: {
      title: "Ideas for your link QR code",
      items: [
        { title: "Menus and price lists", description: "Link to your online menu and update it when dishes or prices change." },
        { title: "Review pages", description: "Send happy customers straight to your Google review page from the counter or the receipt." },
        { title: "Product packaging", description: "Open instructions, recipes or a reorder page, and change it for each new batch." },
        { title: "Flyers and posters", description: "Point to your current offer, then switch the link when the campaign ends." },
        { title: "Business cards", description: "Link to your website or portfolio, and keep printed cards working when the address changes." },
        { title: "Bookings and appointments", description: "Open your booking page from shop windows, vehicles and leaflets." },
      ],
    },
    faqs: [
      {
        question: "Is a website QR code free?",
        answer:
          `You can create website QR codes free for ${TRIAL_DAYS} days with the free trial: up to 2 codes, no card needed. After that a 3, 6 or 12-month plan gives you unlimited codes; the pricing page shows the prices in your currency.`,
      },
      {
        question: "Can I change the URL after the QR code is printed?",
        answer:
          "Yes. Website codes are dynamic by default: the printed code holds a short QR-Genie link, and you can change where it sends people from your dashboard at any time.",
      },
      {
        question: "Can I track how many people scan my website QR code?",
        answer:
          "Yes. Every scan of a dynamic code is counted, with unique scans, the day and hour, country and city, device, operating system and browser. You can export the data as a CSV file.",
      },
      {
        question: "What's the difference between a static and a dynamic website QR code?",
        answer:
          "A static code holds the web address itself, so it can't be changed or tracked. A dynamic code holds a short link that forwards to your address, so you can edit it, see scans, add a password or pause it. You choose when you create the code.",
      },
      {
        question: "Will my website QR code stop working?",
        answer:
          "Dynamic codes work while your trial or subscription is active. If your plan ends they're paused, not deleted, and they work again with the same link as soon as you subscribe. Static codes keep working regardless.",
      },
    ],
    related: ["/multiple-links-qr-code", "/wifi-qr-code", "/whatsapp-qr-code", "/instagram-qr-code", "/pricing"],
  },

  links: {
    path: "/multiple-links-qr-code",
    crumb: "List of links QR code",
    seoTitle: "QR Code for Multiple Links: One Scan, Every Link | QR-Genie",
    description: `Share all your links with one QR code: a mobile page with your photo and a button for each link. Edit it after printing. Free for ${TRIAL_DAYS} days.`,
    eyebrow: { icon: FaLink, label: "List of links QR code" },
    title: "Multiple Links QR Code",
    highlight: "Generator",
    subtitle: "One scan, all your links",
    summary: "One QR code that opens a page with all your links, which you can change after printing.",
    intro:
      "Put your menu, booking page, shop, reviews and social profiles behind a single QR code. People who scan it see a clean mobile page with your photo, a short description and a button for each link. QR-Genie hosts the page, so there's nothing to build, and you can change it whenever you like.",
    createType: "links",
    cta: "Create a list of links",
    preview: {
      qrColor: "#6d28d9",
      card: { title: "List of links", detail: "Café Aroma · 4 links", stat: "312 scans this week" },
      note: { icon: FaPen, title: "Page updated", text: "Same printed code" },
    },
    benefits: {
      title: "Why use a QR code for multiple links",
      description: "One code on your counter, card or poster, and people choose where to go.",
      items: [
        { icon: <FaLink className="h-5 w-5" />, title: "Every link in one place", description: "Up to 20 buttons for your menu, bookings, shop, reviews, social profiles or anything else with a web address." },
        { icon: <FaSyncAlt className="h-5 w-5" />, title: "Change it after printing", description: "Add, remove or reorder links, or change the text and photo, whenever you like. The printed code stays the same." },
        { icon: <FaMobileAlt className="h-5 w-5" />, title: "Made for phones", description: "A fast, clean page that opens straight from the camera, with no app to install and nothing to sign in to." },
        { icon: <FaPalette className="h-5 w-5" />, title: "Your look", description: "Your photo or logo, a title and a short description, in one of eight colour themes. The code itself gets your colours and logo too." },
        { icon: <FaChartLine className="h-5 w-5" />, title: "See every scan", description: "Scans by day, country, city and device, unique visitors and your busiest hours, with CSV export." },
        { icon: <FaBolt className="h-5 w-5" />, title: "Nothing to build", description: "We host the page for you. No website, domain or hosting needed: it's ready the moment you create the code." },
      ],
    },
    steps: {
      title: "How to create a QR code for multiple links",
      items: [
        signUpStep,
        { icon: <FaLink className="h-6 w-6" />, title: "Add your links", description: "Choose List of links, add a title, your photo and a button for each link, and pick a colour theme." },
        { icon: <FaPalette className="h-6 w-6" />, title: "Design the code", description: "Give the code your colours and logo, and a frame with a call to action such as Scan for all our links." },
        { icon: <FaDownload className="h-6 w-6" />, title: "Download and print", description: "Print it anywhere. Edit the page later from your dashboard; the code doesn't change." },
      ],
    },
    ideas: {
      title: "Ideas for your list of links",
      items: [
        { title: "Cafés and restaurants", description: "Your menu, delivery apps, table booking, reviews and Instagram behind one code on the table." },
        { title: "Shop windows and counters", description: "Opening hours, your online shop, offers and directions, even when you're closed." },
        { title: "Business cards", description: "Your website, portfolio, LinkedIn and a WhatsApp chat, all from one small code." },
        { title: "Events", description: "The schedule, tickets, the venue map and the after-party, updated as plans change." },
        { title: "Creators and artists", description: "Your latest work, shop, newsletter and social profiles in one scan." },
        { title: "Product packaging", description: "Instructions, recipes, the reorder page and support, changed for each new batch." },
      ],
    },
    faqs: [
      {
        question: "What is a QR code for multiple links?",
        answer:
          "It's one QR code that opens a mobile page with a button for each of your links. People who scan it choose where to go: your menu, your shop, your social profiles and so on.",
      },
      {
        question: "Do I need my own website?",
        answer:
          "No. QR-Genie hosts the page for you. Add a title, an optional photo or logo and your links, and the page is ready as soon as you create the code.",
      },
      {
        question: "Can I change the links after printing?",
        answer:
          "Yes. Open the code in your dashboard and choose Edit page. Add, remove or reorder links, or change the photo, text and colours; the printed code stays the same.",
      },
      {
        question: "How many links can I add?",
        answer: "Up to 20 links per page, each with its own button and the text you choose.",
      },
      {
        question: "Is a QR code for multiple links free?",
        answer: `You can try it free for ${TRIAL_DAYS} days with up to 2 QR codes, no card needed. After that a 3, 6 or 12-month plan gives you unlimited codes; the pricing page shows the prices in your currency.`,
      },
      {
        question: "Can I see how many people scan it?",
        answer:
          "Yes. Every scan is counted, with the day and hour, country and city, device, operating system and browser, and you can export the data as a CSV file.",
      },
    ],
    related: ["/website-qr-code", "/instagram-qr-code", "/whatsapp-qr-code", "/restaurant-menu-qr-code", "/pricing"],
  },

  wifi: {
    path: "/wifi-qr-code",
    crumb: "Wi-Fi QR code",
    seoTitle: "WiFi QR Code Generator for Guests and Customers | QR-Genie",
    description:
      `Make a WiFi QR code so guests join your network in one scan, with no password typing. Works with iPhone and Android cameras. Free for ${TRIAL_DAYS} days.`,
    eyebrow: { icon: FaWifi, label: "Wi-Fi QR code" },
    title: "WiFi QR Code",
    highlight: "Generator",
    subtitle: "Guests join your network in one scan",
    summary: "Share your network name and password in one code, so guests connect with a single scan.",
    intro:
      "Put your network name and password into a QR code. Guests point their phone camera at it and join straight away, with no long password to read out or type. Made for cafés, hotels, offices, clinics and events.",
    createType: "wifi",
    cta: "Create a Wi-Fi QR code",
    preview: {
      qrColor: "#0e7490",
      card: { title: "Wi-Fi QR code", detail: "Guest Wi-Fi · WPA", stat: "Joins in one scan", isStatic: true },
      note: { icon: FaBolt, title: "Connected", text: "No password typed" },
    },
    benefits: {
      title: "Why share your Wi-Fi with a QR code",
      description: "The quickest way to get guests online, and no more passwords spelled out across the counter.",
      items: [
        { icon: <FaBolt className="h-5 w-5" />, title: "Join in seconds", description: "One scan and a tap on Join. No spelling out passwords or typing them wrong." },
        { icon: <FaMobileAlt className="h-5 w-5" />, title: "Works with phone cameras", description: "Recent iPhones and Android phones read Wi-Fi QR codes with the built-in camera, no app needed." },
        { icon: <FaShieldAlt className="h-5 w-5" />, title: "WPA, WEP and open networks", description: "Choose your network's security type, and mark hidden networks so phones still find them." },
        { icon: <FaQrcode className="h-5 w-5" />, title: "Nothing to load", description: "The network details live inside the code itself, so it works before the phone is online." },
        { icon: <FaPalette className="h-5 w-5" />, title: "Matches your space", description: "Your colours, logo and a frame such as Scan to join our Wi-Fi, ready for table cards and room signs." },
        { icon: <FaDownload className="h-5 w-5" />, title: "Print anywhere", description: "Download PNG, SVG, JPEG or PDF for table tents, posters, key card holders and stickers." },
      ],
    },
    steps: {
      title: "How to create a QR code for your Wi-Fi password",
      items: [
        signUpStep,
        { icon: <FaWifi className="h-6 w-6" />, title: "Enter your network", description: "Choose Wi-Fi, then type the network name, password and security type exactly as your router shows them." },
        { icon: <FaPalette className="h-6 w-6" />, title: "Design it", description: "Add your colours, logo and a short call to action." },
        { icon: <FaPrint className="h-6 w-6" />, title: "Print and display", description: "Put it where guests can see it: reception, tables or the back of a room door." },
      ],
    },
    ideas: {
      title: "Where to put your Wi-Fi QR code",
      items: [
        { title: "Cafés and restaurants", description: "On table cards and menus, so customers don't have to ask." },
        { title: "Hotel rooms and rentals", description: "On the welcome card, key card holder or fridge door." },
        { title: "Offices and meeting rooms", description: "A guest network code at reception and in meeting rooms." },
        { title: "Clinics and waiting rooms", description: "Let people get online while they wait, without asking the front desk." },
        { title: "Events and conferences", description: "On badges, signs and slides so everyone connects quickly." },
        { title: "Shops and salons", description: "Near the counter or the waiting area, so customers can look things up while they wait." },
      ],
    },
    faqs: [
      {
        question: "How does a Wi-Fi QR code work?",
        answer:
          "The code holds your network name, password and security type in a standard format that phones understand. When someone scans it with their camera, the phone offers to join the network, so nobody has to type the password.",
      },
      {
        question: "Do Wi-Fi QR codes work on iPhone and Android?",
        answer:
          "Yes. Recent iPhones and Android phones read Wi-Fi QR codes with the built-in camera app. Some older Android phones need the QR scanner in their Wi-Fi settings or a scanner app.",
      },
      {
        question: "What happens if I change my Wi-Fi password?",
        answer:
          "Make a new code. A phone can only join a network from details stored inside the code itself, so Wi-Fi codes can't be edited after they're made, and a new password means printing a new code.",
      },
      {
        question: "Can I track scans of a Wi-Fi QR code?",
        answer:
          "No. The network details are inside the code and the phone joins directly, so the scan never reaches QR-Genie. If you need scan numbers, use a website or WhatsApp code.",
      },
      {
        question: "Do Wi-Fi QR codes expire?",
        answer:
          "No. A Wi-Fi code keeps working for as long as the network name and password stay the same, even if your QR-Genie plan ends.",
      },
      {
        question: "Is it safe to share my Wi-Fi password in a QR code?",
        answer:
          "Anyone who scans the code can join the network, just as if you'd told them the password. Use a guest network that's kept separate from your own devices, and print a new code when you change the password.",
      },
    ],
    related: ["/website-qr-code", "/whatsapp-qr-code", "/qr-codes-for-hotels", "/restaurant-menu-qr-code", "/pricing"],
  },

  whatsapp: {
    path: "/whatsapp-qr-code",
    crumb: "WhatsApp QR code",
    seoTitle: "WhatsApp QR Code Generator for Business | QR-Genie",
    description:
      `Create a WhatsApp QR code that opens a chat with your number and an optional ready-typed message. Track scans and add your logo. Free for ${TRIAL_DAYS} days.`,
    eyebrow: { icon: FaWhatsapp, label: "WhatsApp QR code" },
    title: "WhatsApp QR Code",
    highlight: "Generator",
    subtitle: "Start a chat with customers in one scan",
    summary: "One scan opens a WhatsApp chat with your business, with an optional message already typed.",
    intro:
      "Let customers message you without saving your number. One scan opens WhatsApp with your business number and, if you like, a message already typed, so asking a question, booking or ordering takes seconds.",
    createType: "whatsapp",
    cta: "Create a WhatsApp QR code",
    preview: {
      qrColor: "#047857",
      card: { title: "WhatsApp QR code", detail: "Chat with Your Business", stat: "96 scans this week" },
      note: { icon: FaComments, title: "New chat", text: "From your flyer" },
    },
    benefits: {
      title: "Why use a WhatsApp chat QR code",
      description: "The shortest path from a printed flyer to a conversation with you.",
      items: [
        { icon: <FaComments className="h-5 w-5" />, title: "No number to save", description: "WhatsApp opens a chat with you straight away; customers don't have to add you as a contact first." },
        { icon: <FaPen className="h-5 w-5" />, title: "Message already typed", description: "Add a ready-made message such as I'd like to book a table, so customers only need to tap Send." },
        { icon: <FaChartLine className="h-5 w-5" />, title: "See how many people scan", description: "Scans by day, country and device show which flyer, shop window or package brings in chats." },
        { icon: <FaLink className="h-5 w-5" />, title: "Change it later", description: "The code is dynamic, so you can point it at a new number or message without reprinting." },
        { icon: <FaPalette className="h-5 w-5" />, title: "On-brand design", description: "Use your colours and logo and add a frame like Chat with us on WhatsApp." },
        { icon: <FaGlobe className="h-5 w-5" />, title: "Works worldwide", description: "Enter any number with its country code. The chat opens in the WhatsApp app on phones." },
      ],
    },
    steps: {
      title: "How to create a WhatsApp QR code",
      items: [
        signUpStep,
        { icon: <FaWhatsapp className="h-6 w-6" />, title: "Add your number", description: "Choose WhatsApp, enter your number with the country code and, if you like, the message people will send." },
        { icon: <FaPalette className="h-6 w-6" />, title: "Design it", description: "Add your colours, logo and a frame with a call to action." },
        { icon: <FaDownload className="h-6 w-6" />, title: "Download and share", description: "Print it on counters, packaging, flyers and delivery bags, or add it to your website." },
      ],
    },
    ideas: {
      title: "Ways businesses use WhatsApp QR codes",
      items: [
        { title: "Orders and bookings", description: "Take table bookings, takeaway orders or appointments in a chat." },
        { title: "Customer support", description: "Put the code on packaging and manuals so customers can ask for help." },
        { title: "Delivery and takeaway", description: "On bags and boxes, for reorders and feedback." },
        { title: "Shop windows", description: "Let passers-by ask about products or opening hours, even when you're closed." },
        { title: "Property and vehicle sales", description: "On signs and windows, so buyers can message the agent or seller right away." },
        { title: "Events", description: "For questions, directions and last-minute updates." },
      ],
    },
    faqs: [
      {
        question: "How does a WhatsApp QR code work?",
        answer:
          "The code opens WhatsApp's own click-to-chat link for your number, optionally with a message already typed. With QR-Genie the scan passes through your short link first, so it's counted in your analytics.",
      },
      {
        question: "Does the customer need to save my number?",
        answer: "No. The chat opens straight away, and they can save you as a contact later if they want to.",
      },
      {
        question: "Can I add a pre-filled message?",
        answer:
          "Yes. Add the message when you create the code, for example \"Hi, I'd like to book a table\". The customer can still edit it before sending.",
      },
      {
        question: "Does it work with WhatsApp Business?",
        answer: "Yes. The code works with any WhatsApp number, on WhatsApp or WhatsApp Business.",
      },
      {
        question: "Can I see how many people scanned it?",
        answer: "Yes. Every scan is counted with the day, country, city and device, so you can compare where your chats come from.",
      },
    ],
    related: ["/website-qr-code", "/instagram-qr-code", "/restaurant-menu-qr-code", "/qr-codes-for-real-estate", "/pricing"],
  },

  instagram: {
    path: "/instagram-qr-code",
    crumb: "Instagram QR code",
    seoTitle: "Instagram QR Code Generator for Your Profile | QR-Genie",
    description:
      `Create an Instagram QR code that opens your profile in one scan. Add your logo and colours, track scans and change it anytime. Free for ${TRIAL_DAYS} days.`,
    eyebrow: { icon: FaInstagram, label: "Instagram QR code" },
    title: "Instagram QR Code",
    highlight: "Generator",
    subtitle: "Turn every scan into a new follower",
    summary: "One scan opens your Instagram profile, ready for a tap on Follow.",
    intro:
      "Make a QR code for your Instagram profile and put it on posters, packaging, menus and shop windows. One scan opens your profile, in the Instagram app when it's installed, ready for a tap on Follow.",
    createType: "instagram",
    cta: "Create an Instagram QR code",
    preview: {
      qrColor: "#be185d",
      card: { title: "Instagram QR code", detail: "instagram.com/yourbrand", stat: "310 scans this week" },
      note: { icon: FaInstagram, title: "+1 follower", text: "From your poster" },
    },
    benefits: {
      title: "Why use a QR code for your Instagram profile",
      description: "Make following you as easy as pointing a camera.",
      items: [
        { icon: <FaInstagram className="h-5 w-5" />, title: "Opens your profile", description: "One scan takes people straight to your profile, with no searching for the right handle." },
        { icon: <FaMobileAlt className="h-5 w-5" />, title: "Opens the app", description: "On phones with Instagram installed, the profile opens in the app, where following takes one tap." },
        { icon: <FaChartLine className="h-5 w-5" />, title: "Count your scans", description: "See how many people scan, from which countries and devices, and which places work best." },
        { icon: <FaPalette className="h-5 w-5" />, title: "Styled your way", description: "Use your brand colours or a gradient, your logo and a frame like Follow us." },
        { icon: <FaLink className="h-5 w-5" />, title: "Change it later", description: "Renamed or moved accounts? Point the code at your new profile without reprinting." },
        { icon: <FaDownload className="h-5 w-5" />, title: "Ready for print", description: "Download PNG, SVG, JPEG or PDF for posters, stickers, cards and packaging." },
      ],
    },
    steps: {
      title: "How to make an Instagram QR code",
      items: [
        signUpStep,
        { icon: <FaInstagram className="h-6 w-6" />, title: "Enter your username", description: "Choose Instagram and type your username, with or without the @, or paste your profile link." },
        { icon: <FaPalette className="h-6 w-6" />, title: "Design it", description: "Add your colours, logo and a frame that invites people to follow you." },
        { icon: <FaPrint className="h-6 w-6" />, title: "Print and share", description: "Download it for posters, packaging, menus and business cards." },
      ],
    },
    ideas: {
      title: "Where to use your Instagram QR code",
      items: [
        { title: "Shop windows and counters", description: "Turn window shoppers and customers at the till into followers." },
        { title: "Packaging and labels", description: "Show buyers your latest products and behind-the-scenes posts." },
        { title: "Restaurant tables", description: "On menus and table cards, so diners can tag you in their photos." },
        { title: "Event stands and stages", description: "On banners and screens, to keep the audience after the event." },
        { title: "Business cards and flyers", description: "Your portfolio in one scan." },
        { title: "Salons and studios", description: "On mirrors and reception desks, so clients can see your latest work." },
      ],
    },
    faqs: [
      {
        question: "How do I make a QR code for my Instagram profile?",
        answer:
          "Start the free trial, choose Instagram, enter your username and design the code. You can download it straight away as PNG, SVG, JPEG or PDF.",
      },
      {
        question: "Doesn't Instagram have its own QR code?",
        answer:
          "Instagram can make a basic QR code for your profile. A QR-Genie code adds your own colours, logo and frame, counts every scan, and can be pointed at a different profile later without reprinting.",
      },
      {
        question: "Will it open the Instagram app?",
        answer:
          "On phones with Instagram installed, the profile usually opens in the app. Otherwise it opens in the browser, where people can follow you after logging in.",
      },
      {
        question: "Can I track Instagram QR code scans?",
        answer: "Yes. Every scan is counted with the day, country, city, device and browser.",
      },
      {
        question: "Can I change the profile later?",
        answer: "Yes. Instagram codes are dynamic, so you can point the code at a new profile from your dashboard and printed codes follow.",
      },
    ],
    related: ["/website-qr-code", "/whatsapp-qr-code", "/restaurant-menu-qr-code", "/qr-codes-for-events", "/pricing"],
  },

  restaurant: {
    path: "/restaurant-menu-qr-code",
    crumb: "Restaurant menus",
    seoTitle: "QR Code for Restaurant Menus, Editable Anytime | QR-Genie",
    description:
      `Create a QR code for your restaurant menu: type your menu or link to the one you have. Change it anytime without reprinting and track scans. Free for ${TRIAL_DAYS} days.`,
    eyebrow: { icon: FaUtensils, label: "For restaurants" },
    title: "QR Codes for",
    highlight: "Restaurant Menus",
    subtitle: "Update your menu without reprinting",
    summary: "Put your menu on every table, and change it whenever dishes or prices change.",
    intro:
      "Type your menu into QR-Genie and we host it as a fast mobile page, or link to the menu you already have online. When dishes or prices change, update it in your dashboard and every printed code shows the new menu. Add a Wi-Fi code for guests and a WhatsApp code for orders.",
    createType: "menu",
    cta: "Create a menu QR code",
    preview: {
      qrColor: "#c2410c",
      card: { title: "Table menu", detail: "yourcafe.com/menu", stat: "248 scans this week" },
      note: { icon: FaUtensils, title: "Menu updated", text: "Same code on every table" },
    },
    benefits: {
      title: "Why restaurants use dynamic menu QR codes",
      description: "A digital menu that's always current, and fewer questions for your staff.",
      items: [
        { icon: <FaUtensils className="h-5 w-5" />, title: "Contactless digital menu", description: "Guests scan at the table and browse the menu on their own phone." },
        { icon: <FaSyncAlt className="h-5 w-5" />, title: "Update without reprinting", description: "Seasonal dishes or new prices: edit the menu (or its link) and every printed code shows the new one." },
        { icon: <FaChartLine className="h-5 w-5" />, title: "See when guests scan", description: "Scans by day, hour and device, and a weekday-by-hour view of your busiest times." },
        { icon: <FaWifi className="h-5 w-5" />, title: "Wi-Fi without asking", description: "Add a Wi-Fi QR code to table cards so guests connect without asking staff." },
        { icon: <FaWhatsapp className="h-5 w-5" />, title: "Orders and bookings by chat", description: "A WhatsApp code on takeaway bags and flyers brings in reorders and table bookings." },
        { icon: <FaPalette className="h-5 w-5" />, title: "Matches your brand", description: "Your colours and logo, plus a frame like Scan for the menu." },
      ],
    },
    steps: {
      title: "How to make a QR code for your restaurant menu",
      items: [
        { icon: <FaUtensils className="h-6 w-6" />, title: "Add your menu", description: "Choose Menu and type your sections, dishes and prices, or choose Website and paste the link to a menu you already have online." },
        { icon: <FaQrcode className="h-6 w-6" />, title: "Design the code", description: "Name the code and pick your colours, logo and a frame such as Scan for the menu." },
        { icon: <FaPrint className="h-6 w-6" />, title: "Print it for your tables", description: "Download print-ready files for table tents, stickers, windows and takeaway bags." },
        { icon: <FaSyncAlt className="h-6 w-6" />, title: "Update anytime", description: "When the menu changes, edit it in your dashboard. Nothing to reprint." },
      ],
    },
    ideas: {
      title: "QR codes around your restaurant",
      items: [
        { title: "Table tents and stickers", description: "The menu on every table, readable on any phone.", type: "menu" },
        { title: "Takeaway bags and boxes", description: "Reorders and feedback on WhatsApp.", type: "whatsapp" },
        { title: "Guest Wi-Fi", description: "A Wi-Fi code on table cards or at the counter.", type: "wifi" },
        { title: "Instagram", description: "Turn diners into followers with a code by the till or in the bill folder.", type: "instagram" },
        { title: "Everything in one code", description: "Menu, delivery apps, bookings and your Instagram on one page, from a single code at the till.", type: "links" },
        { title: "Reviews", description: "Link the receipt or bill folder to your Google review page.", type: "website" },
      ],
    },
    faqs: [
      {
        question: "How do I create a QR code for my restaurant menu?",
        answer:
          `Choose Menu, type your sections, dishes and prices, design the code and print it. If your menu is already online, choose Website and paste its link instead. The free trial lets you try it with up to 2 codes for ${TRIAL_DAYS} days.`,
      },
      {
        question: "Can I update the menu without reprinting the QR code?",
        answer:
          "Yes. The printed code holds a short QR-Genie link. Edit the menu (or change the link it opens) in your dashboard and the next scan shows the new one.",
      },
      {
        question: "Do I need a website for my menu?",
        answer:
          "No. With a Menu QR code you type your menu into QR-Genie and we host it as a mobile page, with sections, prices and notes such as allergens. If your menu is already online, on your website, an ordering platform or a PDF, a Website QR code can open it instead.",
      },
      {
        question: "Can I use one QR code for every table?",
        answer:
          "Yes, one code can go on every table. To compare areas, such as the terrace and the dining room, give each its own code and compare their scans.",
      },
      {
        question: "Do guests need an app to scan the menu QR code?",
        answer: "No. Recent iPhones and Android phones scan QR codes with the built-in camera, and the menu opens in their browser.",
      },
    ],
    related: ["/qr-code-types", "/website-qr-code", "/wifi-qr-code", "/whatsapp-qr-code", "/pricing"],
  },

  events: {
    path: "/qr-codes-for-events",
    crumb: "Events",
    seoTitle: "Event QR Codes for Tickets, Schedules and Wi-Fi | QR-Genie",
    description:
      `Use event QR codes for tickets, schedules, check-in forms and venue Wi-Fi. Change links as plans change and see how many people scan. Free for ${TRIAL_DAYS} days.`,
    eyebrow: { icon: FaTicketAlt, label: "For events" },
    title: "Event",
    highlight: "QR Codes",
    subtitle: "One scan for tickets, schedules and updates",
    summary: "Tickets, schedules, check-in forms and venue Wi-Fi, each one scan away and easy to change as plans change.",
    intro:
      "Put QR codes on posters, badges, signs and slides that open your ticket page, schedule, check-in or registration form, the venue Wi-Fi or a WhatsApp help line. Plans change; with dynamic codes, the printed signs keep up.",
    createType: "website",
    cta: "Create an event QR code",
    preview: {
      qrColor: "#047857",
      card: { title: "Event tickets", detail: "yourevent.com/tickets", stat: "512 scans this week" },
      note: { icon: FaTicketAlt, title: "Schedule updated", text: "Posters stay the same" },
    },
    benefits: {
      title: "Why event organisers use dynamic QR codes",
      description: "Print early, change your mind late.",
      items: [
        { icon: <FaSyncAlt className="h-5 w-5" />, title: "Keep up with changes", description: "New schedule, a room change or sold-out tickets? Change the link and every poster and badge follows." },
        { icon: <FaClipboardCheck className="h-5 w-5" />, title: "Registration and check-in", description: "Link a code to your registration or check-in form, so guests sign in on their own phones." },
        { icon: <FaChartLine className="h-5 w-5" />, title: "See what draws attention", description: "Compare scans from posters, flyers and slides, by day, hour and location." },
        { icon: <FaWifi className="h-5 w-5" />, title: "Venue Wi-Fi", description: "A Wi-Fi code on badges and signs gets everyone online without queues at the help desk." },
        { icon: <FaWhatsapp className="h-5 w-5" />, title: "Help by WhatsApp", description: "A WhatsApp code gives guests a direct line for questions and directions." },
        { icon: <FaPause className="h-5 w-5" />, title: "Switch off afterwards", description: "Pause codes when the event ends and show your own message, such as See you next year." },
      ],
    },
    steps: {
      title: "How to create QR codes for your event",
      items: [
        signUpStep,
        { icon: <FaLink className="h-6 w-6" />, title: "Add your links", description: "Create a code for each job: tickets, schedule, check-in form, Wi-Fi or WhatsApp." },
        { icon: <FaPalette className="h-6 w-6" />, title: "Design and print", description: "Match your event branding and download print-ready files for posters, badges and slides." },
        { icon: <FaChartLine className="h-6 w-6" />, title: "Track and update", description: "Watch the scans come in and change any link as plans change." },
      ],
    },
    ideas: {
      title: "QR code ideas for events",
      items: [
        { title: "Posters and flyers", description: "Open the ticket page or registration form.", type: "website" },
        { title: "Check-in", description: "Link to your check-in or sign-up form at the entrance.", type: "website" },
        { title: "Schedules and maps", description: "On badges and signs; update the schedule as sessions move.", type: "website" },
        { title: "Venue Wi-Fi", description: "On badges, tables and slides.", type: "wifi" },
        { title: "Help line", description: "Questions, lost property and directions by WhatsApp.", type: "whatsapp" },
        { title: "Follow the event", description: "On the stage screen or programme, to keep your audience for next time.", type: "instagram" },
      ],
    },
    faqs: [
      {
        question: "Can I use QR codes for event check-in?",
        answer:
          "Yes, by linking a code to your check-in or registration form, for example one from your ticketing service or a form builder. QR-Genie makes and tracks the code; the form itself stays with the service you use.",
      },
      {
        question: "Can I change the link after the posters are printed?",
        answer: "Yes. Dynamic codes hold a short QR-Genie link, so you can send scans to a new page at any time.",
      },
      {
        question: "Can I see which poster gets the most scans?",
        answer: "Give each poster or channel its own code and compare their scans by day, hour, country and device in your analytics.",
      },
      {
        question: "What happens to the codes after the event?",
        answer:
          "Pause them and show your own message, point them at next year's page, or leave them as they are. Paused codes can be switched back on any time.",
      },
      {
        question: "Do guests need an app to scan event QR codes?",
        answer: "No. The cameras on recent iPhones and Android phones scan QR codes directly.",
      },
    ],
    related: ["/website-qr-code", "/wifi-qr-code", "/whatsapp-qr-code", "/instagram-qr-code", "/pricing"],
  },

  realEstate: {
    path: "/qr-codes-for-real-estate",
    crumb: "Real estate",
    seoTitle: "Real Estate QR Codes for Signs and Listings | QR-Genie",
    description:
      `Put QR codes on for-sale signs and flyers that open the property listing. Swap the link when a home sells and see how many buyers scan. Free for ${TRIAL_DAYS} days.`,
    eyebrow: { icon: FaHome, label: "For real estate" },
    title: "Real Estate",
    highlight: "QR Codes",
    subtitle: "From the sign to the listing in one scan",
    summary: "Signs and flyers that open the full listing, and point to your next property when this one sells.",
    intro:
      "Add a QR code to for-sale signs, window cards and flyers that opens the full listing: photos, price, floor plan and viewing times. When the property sells, point the same sign at your next listing.",
    createType: "website",
    cta: "Create a property QR code",
    preview: {
      qrColor: "#4338ca",
      card: { title: "12 Oak Lane sign", detail: "youragency.com/12-oak-lane", stat: "38 scans this week" },
      note: { icon: FaHome, title: "38 scans this week", text: "From the sign outside" },
    },
    benefits: {
      title: "Why agents use dynamic QR codes on property signs",
      description: "Every sign becomes a way in to the listing, and you can see who's interested.",
      items: [
        { icon: <FaHome className="h-5 w-5" />, title: "The listing in one scan", description: "Buyers see photos, price and details straight from the sign, day or night." },
        { icon: <FaSyncAlt className="h-5 w-5" />, title: "Reuse your signs", description: "When a home sells, change the link to the next property. The sign stays the same." },
        { icon: <FaChartLine className="h-5 w-5" />, title: "Measure buyer interest", description: "Scans per sign, by day and hour, show which properties and spots draw attention." },
        { icon: <FaWhatsapp className="h-5 w-5" />, title: "Talk to buyers fast", description: "Add a WhatsApp code so buyers can message you about a viewing straight away." },
        { icon: <FaLock className="h-5 w-5" />, title: "Private links", description: "Protect off-market listings or documents with a password before the page opens." },
        { icon: <FaPalette className="h-5 w-5" />, title: "Your agency's brand", description: "Your logo, colours and a frame like Scan for photos and price." },
      ],
    },
    steps: {
      title: "How to add a QR code to a property sign",
      items: [
        signUpStep,
        { icon: <FaLink className="h-6 w-6" />, title: "Link the listing", description: "Create a website QR code with the property's listing page, or a WhatsApp code with your number." },
        { icon: <FaPrint className="h-6 w-6" />, title: "Print it on signs and flyers", description: "Download SVG or PDF files, which stay sharp on large signs." },
        { icon: <FaSyncAlt className="h-6 w-6" />, title: "Update when it sells", description: "Point the code at your next listing, or pause it and show a Sold message." },
      ],
    },
    ideas: {
      title: "Where real estate QR codes work",
      items: [
        { title: "For-sale and to-let signs", description: "The full listing from the street, at any hour.", type: "website" },
        { title: "Window cards", description: "Each property in your office window opens its own listing.", type: "website" },
        { title: "Flyers and brochures", description: "Photos, floor plans and a virtual tour that won't fit on paper.", type: "website" },
        { title: "Open house sign-in", description: "Link to a sign-in or feedback form at viewings.", type: "website" },
        { title: "Agent contact", description: "On signs and business cards, for quick questions.", type: "whatsapp" },
        { title: "Your listings on Instagram", description: "Grow your following with every property you market.", type: "instagram" },
      ],
    },
    faqs: [
      {
        question: "How do QR codes on real estate signs work?",
        answer:
          "The sign carries a dynamic QR code with a short QR-Genie link, which forwards to the listing. Buyers scan it with their phone camera and see the property straight away.",
      },
      {
        question: "Can I reuse a sign for another property?",
        answer: "Yes. Change the code's link to the new listing in your dashboard and the same sign works for the next property.",
      },
      {
        question: "Can I see how many people scanned my sign?",
        answer: "Yes. Each code shows total and unique scans, with the day, hour, country, city and device.",
      },
      {
        question: "What file format should I use for large signs?",
        answer: "Use SVG or PDF. They're vector files, so the code stays sharp at any size.",
      },
      {
        question: "Can I show a message when a property is sold?",
        answer:
          "Yes. Pause the code and set your own message, such as \"This home is sold. Call us about similar properties.\" Switch it back on or point it elsewhere any time.",
      },
    ],
    related: ["/website-qr-code", "/whatsapp-qr-code", "/qr-codes-for-events", "/qr-codes-for-hotels", "/pricing"],
  },

  hotels: {
    path: "/qr-codes-for-hotels",
    crumb: "Hotels",
    seoTitle: "Hotel QR Codes for Rooms, Wi-Fi and Menus | QR-Genie",
    description:
      `QR codes for hotel rooms: Wi-Fi, room service menus, guest guides and WhatsApp concierge. Update links anytime and track scans. Free for ${TRIAL_DAYS} days.`,
    eyebrow: { icon: FaHotel, label: "For hotels" },
    title: "Hotel",
    highlight: "QR Codes",
    subtitle: "Wi-Fi, menus and guest info in every room",
    summary: "Room Wi-Fi, menus, guest guides and front desk chat, from QR codes you can keep up to date.",
    intro:
      "Give guests everything on their phone: join the Wi-Fi with one scan, open the room service menu or guest guide, and message the front desk on WhatsApp. Update menus and information without reprinting room cards.",
    createType: null,
    cta: "Create a hotel QR code",
    preview: {
      qrColor: "#0e7490",
      card: { title: "Room Wi-Fi", detail: "Hotel Guest · WPA", stat: "Joins in one scan", isStatic: true },
      note: { icon: FaConciergeBell, title: "Room 214", text: "Wi-Fi joined in one scan" },
    },
    benefits: {
      title: "Why hotels use QR codes in rooms and public areas",
      description: "Fewer calls to reception, and information that's always up to date.",
      items: [
        { icon: <FaWifi className="h-5 w-5" />, title: "Wi-Fi in one scan", description: "A Wi-Fi code on the key card holder or welcome card means fewer calls to reception." },
        { icon: <FaUtensils className="h-5 w-5" />, title: "Room service and restaurant menus", description: "Link to your menus and change them with the season without reprinting." },
        { icon: <FaConciergeBell className="h-5 w-5" />, title: "WhatsApp concierge", description: "Guests message the front desk for towels, taxis or a late checkout." },
        { icon: <FaBookOpen className="h-5 w-5" />, title: "Digital guest guide", description: "Open your guest information page: breakfast times, the spa, local tips and checkout." },
        { icon: <FaChartLine className="h-5 w-5" />, title: "See what guests use", description: "Scan numbers show which services guests look at, by day and hour." },
        { icon: <FaPalette className="h-5 w-5" />, title: "On-brand cards", description: "Your logo and colours on every code, with a frame such as Scan for room service." },
      ],
    },
    steps: {
      title: "How to set up QR codes for your hotel",
      items: [
        signUpStep,
        { icon: <FaQrcode className="h-6 w-6" />, title: "Create a code for each service", description: "Wi-Fi for the network, website codes for menus and the guest guide, WhatsApp for the front desk." },
        { icon: <FaPrint className="h-6 w-6" />, title: "Print and place them", description: "Download print-ready files for room cards, lifts, the restaurant and reception." },
        { icon: <FaSyncAlt className="h-6 w-6" />, title: "Keep them up to date", description: "Change menu and guide links whenever you need to; the cards stay where they are." },
      ],
    },
    ideas: {
      title: "QR codes around your hotel",
      items: [
        { title: "Rooms", description: "Wi-Fi details on the welcome card or TV stand.", type: "wifi" },
        { title: "Room service", description: "The in-room dining menu, always current.", type: "website" },
        { title: "Front desk chat", description: "Requests and questions by WhatsApp, from any room.", type: "whatsapp" },
        { title: "Restaurant and bar", description: "Menus and opening hours.", type: "website" },
        { title: "Lifts and lobby", description: "The spa, events and this week's offers.", type: "website" },
        { title: "Reviews at checkout", description: "Link the checkout card or receipt to your review page.", type: "website" },
      ],
    },
    faqs: [
      {
        question: "How can hotels use QR codes?",
        answer:
          "Common uses are room Wi-Fi, room service and restaurant menus, a digital guest guide, WhatsApp contact with the front desk, and review links at checkout.",
      },
      {
        question: "Can guests join the Wi-Fi by scanning a QR code?",
        answer:
          "Yes. A Wi-Fi QR code holds the network name and password, and phones offer to join when they scan it. If you change the password, print a new Wi-Fi code: Wi-Fi codes can't be edited after they're made.",
      },
      {
        question: "Can I update the room service menu without reprinting?",
        answer: "Yes. Menu codes are dynamic, so you change the link in your dashboard and every room card opens the new menu.",
      },
      {
        question: "Do guests need an app to scan hotel QR codes?",
        answer: "No. The cameras on recent iPhones and Android phones scan QR codes directly.",
      },
      {
        question: "Can I see how often guests use each code?",
        answer:
          "Yes, for dynamic codes such as menus, guides and WhatsApp: scans by day, hour, country and device. Wi-Fi codes connect directly, so they aren't counted.",
      },
    ],
    related: ["/wifi-qr-code", "/restaurant-menu-qr-code", "/whatsapp-qr-code", "/website-qr-code", "/pricing"],
  },
};
