import {
  FaBehance,
  FaDiscord,
  FaDribbble,
  FaFacebook,
  FaGithub,
  FaGlobe,
  FaInstagram,
  FaLinkedin,
  FaPinterest,
  FaSnapchat,
  FaSpotify,
  FaTelegram,
  FaThreads,
  FaTiktok,
  FaTwitch,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

/** Icon and brand colours (tile background, icon) for each platform in lib/qr/socialPlatforms.js */
export const BRAND_ICONS = {
  instagram: { icon: FaInstagram, bg: "linear-gradient(45deg, #f59e0b, #e1306c 45%, #833ab4)", fg: "#ffffff" },
  facebook: { icon: FaFacebook, bg: "#1877f2", fg: "#ffffff" },
  tiktok: { icon: FaTiktok, bg: "#000000", fg: "#ffffff" },
  youtube: { icon: FaYoutube, bg: "#ff0000", fg: "#ffffff" },
  x: { icon: FaXTwitter, bg: "#000000", fg: "#ffffff" },
  linkedin: { icon: FaLinkedin, bg: "#0a66c2", fg: "#ffffff" },
  whatsapp: { icon: FaWhatsapp, bg: "#25d366", fg: "#ffffff" },
  telegram: { icon: FaTelegram, bg: "#229ed9", fg: "#ffffff" },
  threads: { icon: FaThreads, bg: "#000000", fg: "#ffffff" },
  snapchat: { icon: FaSnapchat, bg: "#fffc00", fg: "#111111" },
  pinterest: { icon: FaPinterest, bg: "#e60023", fg: "#ffffff" },
  spotify: { icon: FaSpotify, bg: "#1db954", fg: "#ffffff" },
  github: { icon: FaGithub, bg: "#181717", fg: "#ffffff" },
  twitch: { icon: FaTwitch, bg: "#9146ff", fg: "#ffffff" },
  discord: { icon: FaDiscord, bg: "#5865f2", fg: "#ffffff" },
  behance: { icon: FaBehance, bg: "#1769ff", fg: "#ffffff" },
  dribbble: { icon: FaDribbble, bg: "#ea4c89", fg: "#ffffff" },
  website: { icon: FaGlobe, bg: "#4f46e5", fg: "#ffffff" },
};

/** Small round tile with the platform's icon in its brand colours */
export function BrandTile({ platform, className = "h-9 w-9" }) {
  const brand = BRAND_ICONS[platform] || BRAND_ICONS.website;
  const Icon = brand.icon;
  return (
    <span className={`flex flex-none items-center justify-center rounded-full ${className}`} style={{ background: brand.bg, color: brand.fg }} aria-hidden="true">
      <Icon className="h-[45%] w-[45%]" />
    </span>
  );
}
