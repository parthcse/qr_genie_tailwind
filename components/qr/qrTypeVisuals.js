import {
  FaGlobe,
  FaLink,
  FaWifi,
  FaWhatsapp,
  FaInstagram,
  FaShareAlt,
  FaFacebook,
  FaBuilding,
  FaTicketAlt,
  FaUtensils,
  FaMobileAlt,
  FaVideo,
  FaImages,
  FaMusic,
  FaQrcode,
  FaAddressCard,
  FaEnvelope,
  FaSms,
  FaPhoneAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";

/**
 * Icon and colours for each QR type (lib/qr/qrTypes.js): `accent` for the icon tile on the create page,
 * `chip` for the type badge in lists. Kept here because Tailwind only reads class names under components/ and pages/.
 */
export const QR_TYPE_VISUALS = {
  website: { icon: FaGlobe, accent: "bg-sky-50 text-sky-600", chip: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  links: { icon: FaLink, accent: "bg-violet-50 text-violet-600", chip: "bg-violet-50 text-violet-700 ring-violet-600/20" },
  wifi: { icon: FaWifi, accent: "bg-cyan-50 text-cyan-600", chip: "bg-cyan-50 text-cyan-700 ring-cyan-600/20" },
  whatsapp: { icon: FaWhatsapp, accent: "bg-emerald-50 text-emerald-600", chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  instagram: { icon: FaInstagram, accent: "bg-pink-50 text-pink-600", chip: "bg-pink-50 text-pink-700 ring-pink-600/20" },
  social: { icon: FaShareAlt, accent: "bg-indigo-50 text-indigo-600", chip: "bg-indigo-50 text-indigo-700 ring-indigo-600/20" },
  facebook: { icon: FaFacebook, accent: "bg-blue-50 text-blue-600", chip: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  email: { icon: FaEnvelope, accent: "bg-red-50 text-red-500", chip: "bg-red-50 text-red-700 ring-red-600/20" },
  sms: { icon: FaSms, accent: "bg-sky-50 text-sky-700", chip: "bg-sky-50 text-sky-800 ring-sky-700/20" },
  phone: { icon: FaPhoneAlt, accent: "bg-green-50 text-green-600", chip: "bg-green-50 text-green-700 ring-green-600/20" },
  location: { icon: FaMapMarkerAlt, accent: "bg-orange-50 text-orange-600", chip: "bg-orange-50 text-orange-700 ring-orange-600/20" },
  business: { icon: FaBuilding, accent: "bg-slate-100 text-slate-700", chip: "bg-slate-100 text-slate-700 ring-slate-600/20" },
  vcard: { icon: FaAddressCard, accent: "bg-fuchsia-50 text-fuchsia-600", chip: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20" },
  coupon: { icon: FaTicketAlt, accent: "bg-amber-50 text-amber-600", chip: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  menu: { icon: FaUtensils, accent: "bg-orange-50 text-orange-600", chip: "bg-orange-50 text-orange-700 ring-orange-600/20" },
  apps: { icon: FaMobileAlt, accent: "bg-teal-50 text-teal-600", chip: "bg-teal-50 text-teal-700 ring-teal-600/20" },
  video: { icon: FaVideo, accent: "bg-rose-50 text-rose-600", chip: "bg-rose-50 text-rose-700 ring-rose-600/20" },
  images: { icon: FaImages, accent: "bg-lime-50 text-lime-700", chip: "bg-lime-50 text-lime-700 ring-lime-600/20" },
  mp3: { icon: FaMusic, accent: "bg-yellow-50 text-yellow-700", chip: "bg-yellow-50 text-yellow-700 ring-yellow-600/20" },
};

const FALLBACK = { icon: FaQrcode, accent: "bg-indigo-50 text-indigo-600", chip: "bg-gray-50 text-gray-700 ring-gray-500/20" };

export const qrTypeVisual = (id) => QR_TYPE_VISUALS[id] || FALLBACK;
