// Short labels and pages of the QR types that have their own page. In a small file of its own, because the home page uses
// it and shouldn't have to load all the pages' content in landingPages.js.
export const TYPE_PAGES = {
  website: { label: "Website QR code", path: "/website-qr-code" },
  menu: { label: "Menu QR code", path: "/restaurant-menu-qr-code" },
  links: { label: "List of links QR code", path: "/multiple-links-qr-code" },
  wifi: { label: "Wi-Fi QR code", path: "/wifi-qr-code" },
  whatsapp: { label: "WhatsApp QR code", path: "/whatsapp-qr-code" },
  instagram: { label: "Instagram QR code", path: "/instagram-qr-code" },
};
