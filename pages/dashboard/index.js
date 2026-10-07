import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import QrOverviewModal from "@/components/qr/QrOverviewModal";
import QrDownloadModal from "@/components/qr/QrDownloadModal";
import DesignedQRCode from "@/components/qr/DesignedQRCode";
import FolderHeader from "@/components/dashboard/FolderHeader";
import { TRIAL_QR_LIMIT } from "@/lib/billing/subscription";
import {
  FaQrcode,
  FaDownload,
  FaTrash,
  FaEllipsisH,
  FaSearch,
  FaFolder,
  FaFolderOpen,
  FaFolderPlus,
  FaPen,
  FaPause,
  FaPlay,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaTimes,
  FaCheck,
  FaRegClone,
  FaGlobe,
  FaWifi,
  FaWhatsapp,
  FaInstagram,
  FaEye,
  FaPlus,
  FaLink,
  FaChartLine,
  FaCheckCircle,
  FaPauseCircle,
  FaExternalLinkAlt,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaLock,
} from "react-icons/fa";

export async function getServerSideProps(context) {
  const { getUserFromRequest, accountRedirect } = await import("@/lib/auth");
  const user = await getUserFromRequest(context.req);
  // Signed out -> login; email not confirmed yet -> verification page
  const redirect = accountRedirect(user);
  if (redirect) return redirect;
  return { props: {} };
}

// How each QR type is labelled and coloured in the list
const TYPE_META = {
  website: { label: "Website", icon: FaGlobe, chip: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  wifi: { label: "WiFi", icon: FaWifi, chip: "bg-cyan-50 text-cyan-700 ring-cyan-600/20" },
  whatsapp: { label: "WhatsApp", icon: FaWhatsapp, chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  instagram: { label: "Instagram", icon: FaInstagram, chip: "bg-pink-50 text-pink-700 ring-pink-600/20" },
};
const typeMeta = (type) =>
  TYPE_META[type?.toLowerCase()] || { label: type || "QR code", icon: FaQrcode, chip: "bg-gray-50 text-gray-700 ring-gray-500/20" };

const STATUS_FILTERS = ["All", "Active", "Paused"];
const SORTS = ["Most Recent", "Oldest", "Most Scans", "Name A-Z", "Name Z-A"];
const PAGE_SIZES = [10, 20, 50, 100];
const EXPIRED_REASONS = ["TRIAL_EXPIRED", "SUBSCRIPTION_EXPIRED"];
const JSON_HEADERS = { "Content-Type": "application/json" };
const BADGE = "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset";

const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const withoutProtocol = (url) => url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
const countLabel = (n) => (n === 1 ? "1 QR code" : `${n} QR codes`);
const displayName = (code) => code.name || `QR code ${code.slug}`;

function metaOf(code) {
  if (code.meta && typeof code.meta === "object") return code.meta;
  try {
    return JSON.parse(code.meta || "{}") || {};
  } catch {
    return {};
  }
}

/** Saved design, falling back to the plain colours older codes were created with */
function designFor(code) {
  const design = { ...(code.designConfig || metaOf(code).designConfig || {}) };
  if (!design.patternColor && code.qrColor) {
    design.patternColor = code.qrColor;
    design.qrColor = code.qrColor;
  }
  if (!design.bgColor && code.bgColor) design.bgColor = code.bgColor;
  return design;
}

/** Human-readable "where does this code go" line */
function destinationOf(code) {
  const meta = metaOf(code);
  const href = /^https?:\/\//i.test(code.targetUrl || "") ? code.targetUrl : null;
  switch (code.type) {
    case "wifi":
      return { label: meta.ssid ? `Network: ${meta.ssid}` : "Wi-Fi network", href: null };
    case "instagram":
      return { label: meta.username ? `@${meta.username}` : withoutProtocol(code.targetUrl || ""), href };
    case "whatsapp":
      return { label: meta.phone ? `${meta.countryCode || ""} ${meta.phone}`.trim() : "WhatsApp chat", href };
    default:
      return { label: href ? withoutProtocol(href) : "No destination", href };
  }
}

const SORTERS = {
  "Most Recent": (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  Oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  "Most Scans": (a, b) => (b.scanCount || 0) - (a.scanCount || 0),
  "Name A-Z": (a, b) => displayName(a).localeCompare(displayName(b)),
  "Name Z-A": (a, b) => displayName(b).localeCompare(displayName(a)),
};

/** Page numbers to show: first, last and the neighbours of the current page */
function pageList(current, total) {
  return [...new Set([1, total, current - 1, current, current + 1])].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

// The dashboard card uses backdrop-blur, which would trap fixed overlays inside it; render them on <body>
function Portal({ children }) {
  return typeof document === "undefined" ? null : createPortal(children, document.body);
}

function StatCard({ icon: Icon, label, value, hint, iconClass }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{value}</p>
        </div>
        <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      {hint && <p className="mt-1.5 text-xs leading-snug text-gray-500">{hint}</p>}
    </div>
  );
}

function StatusBadge({ code }) {
  if (code.status === "PAUSED") {
    const expired = EXPIRED_REASONS.includes(code.deactivatedReason);
    return expired ? (
      <span className={`${BADGE} bg-rose-50 text-rose-700 ring-rose-600/20`} title="Your trial or subscription ended. Renew to switch this code back on.">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Expired
      </span>
    ) : (
      <span className={`${BADGE} bg-amber-50 text-amber-700 ring-amber-600/20`} title="Paused by you. Scans show a paused page.">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Paused
      </span>
    );
  }
  return (
    <span className={`${BADGE} bg-emerald-50 text-emerald-700 ring-emerald-600/20`}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  );
}

function SelectBox({ label, value, onChange, children, className = "" }) {
  return (
    <label className={`relative inline-flex ${className}`}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-9 text-sm font-medium text-gray-700 shadow-sm transition hover:border-indigo-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        {children}
      </select>
      <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
    </label>
  );
}

function FolderChip({ icon: Icon, label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex max-w-[16rem] flex-none items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
        active
          ? "border-transparent bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25"
          : "border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700"
      }`}
    >
      <Icon className={`h-4 w-4 flex-none ${active ? "text-white" : "text-indigo-500"}`} />
      <span className="truncate">{label}</span>
      <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
        {count}
      </span>
    </button>
  );
}

function MenuItem({ icon: Icon, children, onClick, danger, disabled, hint }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
        disabled
          ? "cursor-not-allowed text-gray-400"
          : danger
            ? "text-red-600 hover:bg-red-50"
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <Icon className={`mt-0.5 h-3.5 w-3.5 flex-none ${danger && !disabled ? "" : disabled ? "text-gray-300" : "text-gray-400"}`} />
      <span className="min-w-0">
        {children}
        {hint && <span className="mt-0.5 block text-xs leading-snug text-gray-400">{hint}</span>}
      </span>
    </button>
  );
}

const MENU_HEIGHT = 300; // px, enough for every item; used to decide whether the menu opens up or down

/** Places the actions menu next to its button, flipping upwards when there's no room below */
function useMenuPosition(open, triggerRef) {
  const [position, setPosition] = useState(null);
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const right = Math.max(8, window.innerWidth - rect.right);
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < MENU_HEIGHT && rect.top > spaceBelow;
      setPosition(openUp ? { right, bottom: window.innerHeight - rect.top + 8 } : { right, top: rect.bottom + 8 });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, triggerRef]);
  return position;
}

function QrRow({ code, design, origin, selected, onToggleSelect, menuOpen, onToggleMenu, canDownload, edit, actions }) {
  const menuButtonRef = useRef(null);
  const menuPosition = useMenuPosition(menuOpen, menuButtonRef);
  const type = typeMeta(code.type);
  const TypeIcon = type.icon;
  const isDynamic = (code.linkType || "DYNAMIC") === "DYNAMIC";
  const isPaused = code.status === "PAUSED";
  const shortLink = `${origin.replace(/\/$/, "")}/r/${code.slug}`;
  // Dynamic codes encode the short link (tracked); static ones encode the destination itself
  const qrValue = isDynamic ? shortLink : code.targetUrl || shortLink;
  const destination = destinationOf(code);
  const updated = code.updatedAt && formatDate(code.updatedAt) !== formatDate(code.createdAt) ? formatDate(code.updatedAt) : null;
  const DestinationIcon = destination.href ? FaExternalLinkAlt : TypeIcon;

  return (
    <li
      className={`relative rounded-2xl border p-4 transition sm:p-5 ${
        selected
          ? "border-indigo-300 bg-indigo-50/40 ring-2 ring-indigo-500/20"
          : "border-gray-200/80 bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(code.id)}
            aria-label={`Select ${displayName(code)}`}
            className="mt-1 h-4 w-4 flex-none cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />

          <button
            type="button"
            onClick={() => actions.preview(code)}
            title="Preview"
            className="group/thumb relative flex-none rounded-lg transition hover:ring-2 hover:ring-indigo-400 hover:ring-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <div className={isPaused ? "opacity-40 grayscale" : ""}>
              <DesignedQRCode value={qrValue} designData={design} size={64} showFrame={false} />
            </div>
            <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-900/0 text-white opacity-0 transition group-hover/thumb:bg-gray-900/45 group-hover/thumb:opacity-100">
              <FaEye className="h-4 w-4" />
            </span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`${BADGE} ${type.chip}`}>
                <TypeIcon className="h-3 w-3" />
                {type.label}
              </span>
              <span
                className={`${BADGE} ${isDynamic ? "bg-indigo-50 text-indigo-700 ring-indigo-600/20" : "bg-gray-50 text-gray-600 ring-gray-500/20"}`}
                title={isDynamic ? "Destination can be changed after printing; scans are tracked" : "Destination is fixed; scans aren't tracked"}
              >
                {isDynamic ? "Dynamic" : "Static"}
              </span>
              <StatusBadge code={code} />
              {code.hasPassword && (
                <span className={`${BADGE} bg-violet-50 text-violet-700 ring-violet-600/20`} title="Scanners must enter a password first">
                  <FaLock className="h-2.5 w-2.5" />
                  Protected
                </span>
              )}
            </div>

            {edit.editingId === code.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  edit.save(code.id);
                }}
                className="mt-1.5 flex max-w-md items-center gap-1.5"
              >
                <input
                  value={edit.value}
                  onChange={(e) => edit.change(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && edit.cancel()}
                  autoFocus
                  maxLength={100}
                  disabled={edit.saving}
                  aria-label="QR code name"
                  className="min-w-0 flex-1 rounded-lg border border-indigo-300 px-2.5 py-1.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button
                  type="submit"
                  disabled={edit.saving}
                  aria-label="Save name"
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  <FaCheck className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={edit.cancel}
                  disabled={edit.saving}
                  aria-label="Cancel"
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
                >
                  <FaTimes className="h-3 w-3" />
                </button>
              </form>
            ) : (
              <div className="group/name mt-1.5 flex min-w-0 items-center gap-1">
                <h3 className="line-clamp-2 break-words text-base font-semibold text-gray-900 sm:line-clamp-1 sm:break-all">{displayName(code)}</h3>
                <button
                  type="button"
                  onClick={() => edit.start(code)}
                  aria-label="Rename"
                  title="Rename"
                  className="flex-none rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-indigo-600 focus:opacity-100 sm:opacity-0 sm:group-hover/name:opacity-100"
                >
                  <FaPen className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
              <span className="flex min-w-0 max-w-full items-center gap-1.5 sm:max-w-[18rem]">
                <DestinationIcon className="h-3 w-3 flex-none text-gray-400" />
                {destination.href ? (
                  <a
                    href={destination.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={destination.href}
                    className="truncate !text-gray-600 hover:!text-indigo-600 hover:underline"
                  >
                    {destination.label}
                  </a>
                ) : (
                  <span className="truncate">{destination.label}</span>
                )}
              </span>
              {isDynamic && (
                <button
                  type="button"
                  onClick={() => actions.copyLink(code)}
                  title="Copy short link"
                  className="inline-flex items-center gap-1.5 text-gray-500 transition hover:text-indigo-600"
                >
                  <FaLink className="h-3 w-3" />
                  {withoutProtocol(shortLink)}
                </button>
              )}
              <span className="flex items-center gap-1.5">
                <FaFolder className="h-3 w-3 text-gray-400" />
                {code.folder?.name || "No folder"}
              </span>
              <span title={updated ? `Last updated ${updated}` : undefined}>Created {formatDate(code.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3 lg:justify-end lg:border-0 lg:pt-0">
          <div
            className="lg:w-24 lg:border-x lg:border-gray-100 lg:px-3 lg:text-center"
            title={isDynamic ? "Total scans" : "Static codes aren't tracked"}
          >
            <p className="text-lg font-bold leading-tight tabular-nums text-gray-900">
              {isDynamic ? (code.scanCount || 0).toLocaleString() : "—"}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Scans</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => actions.download(code)}
              disabled={!canDownload}
              title={canDownload ? "Download" : "Renew your plan to download"}
              className="btn-shine btn-shine-soft inline-flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-700"
            >
              <FaDownload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <Link
              href={`/dashboard/qrs/${code.id}`}
              className="btn-shine btn-shine-soft inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 text-sm font-semibold !text-indigo-700 transition hover:bg-indigo-100"
            >
              Details
              <FaChevronRight className="h-2.5 w-2.5" />
            </Link>
            <div className="qr-menu relative">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => onToggleMenu(code.id)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="More actions"
                className={`flex h-9 w-9 items-center justify-center rounded-xl border bg-white shadow-sm transition ${
                  menuOpen ? "border-indigo-300 text-indigo-700" : "border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-700"
                }`}
              >
                <FaEllipsisH className="h-3.5 w-3.5" />
              </button>
              {/* Rendered on <body> so the page card can't cut it off */}
              {menuOpen && menuPosition && (
                <Portal>
                  <div
                    role="menu"
                    style={menuPosition}
                    className="qr-menu fixed z-[55] w-56 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5"
                  >
                    <MenuItem icon={FaEye} onClick={() => actions.preview(code)}>Preview</MenuItem>
                    {isDynamic && <MenuItem icon={FaLink} onClick={() => actions.copyLink(code)}>Copy short link</MenuItem>}
                    <MenuItem icon={FaRegClone} onClick={() => actions.duplicate(code)}>Duplicate</MenuItem>
                    <MenuItem icon={FaFolderOpen} onClick={() => actions.move([code])}>Move to folder</MenuItem>
                    {isPaused ? (
                      <MenuItem icon={FaPlay} onClick={() => actions.setPaused([code], false)}>Resume</MenuItem>
                    ) : isDynamic ? (
                      <MenuItem icon={FaPause} onClick={() => actions.setPaused([code], true)}>Pause</MenuItem>
                    ) : (
                      <MenuItem icon={FaPause} disabled hint="Static codes hold the link itself, so they can't be paused.">
                        Pause
                      </MenuItem>
                    )}
                    <div className="my-1 border-t border-gray-100" />
                    <MenuItem icon={FaTrash} danger onClick={() => actions.remove([code])}>Delete</MenuItem>
                  </div>
                </Portal>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function RowSkeleton() {
  return (
    <li className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5">
      <div className="h-[82px] w-[82px] flex-none animate-pulse rounded-lg bg-gray-100" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-56 max-w-full animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-72 max-w-full animate-pulse rounded bg-gray-100" />
      </div>
    </li>
  );
}

function Modal({ title, icon: Icon, danger, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        className="fixed inset-0 z-[60] flex items-end justify-center bg-gray-900/40 p-4 backdrop-blur-sm sm:items-center"
      >
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            {Icon && (
              <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${danger ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"}`}>
                <Icon className="h-4 w-4" />
              </span>
            )}
            <h3 className="min-w-0 flex-1 text-base font-semibold text-gray-900">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
          <div className="px-5 py-5">{children}</div>
        </div>
      </div>
    </Portal>
  );
}

function BulkButton({ icon: Icon, label, onClick, danger, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`btn-shine btn-shine-soft inline-flex h-9 flex-none items-center gap-2 rounded-xl px-3 text-sm font-medium transition disabled:opacity-50 ${
        danger ? "text-rose-300 hover:bg-rose-500/15 hover:text-rose-200" : "text-gray-200 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const folderParam = typeof router.query.folder === "string" ? router.query.folder : null;

  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [origin, setOrigin] = useState(process.env.NEXT_PUBLIC_BASE_URL || "");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("Most Recent");
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [previewCode, setPreviewCode] = useState(null);
  const [downloadCode, setDownloadCode] = useState(null);
  const [moveTargets, setMoveTargets] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const status = subscriptionStatus?.status;
  const hasExpiredAccess = !!status && !["TRIAL_ACTIVE", "SUBSCRIPTION_ACTIVE"].includes(status);

  const showToast = (message, tone = "success") => setToast({ message, tone, id: Date.now() });

  const request = async (url, options = {}) => {
    try {
      const res = await fetch(url, { credentials: "include", ...options });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: false, status: 0, data: { error: "Network error. Please try again." } };
    }
  };

  const loadCodes = async () => {
    const res = await request("/api/my-qr-codes");
    if (res.status === 401) {
      router.push("/auth/login");
      return;
    }
    if (res.ok) setCodes(res.data.codes || []);
    setLoading(false);
  };

  const loadFolders = async () => {
    const res = await request("/api/folders");
    if (res.ok) setFolders(res.data.folders || []);
  };

  useEffect(() => {
    setOrigin(window.location.origin);
    loadCodes();
    loadFolders();
    request("/api/auth/me").then((res) => {
      const subscription = res.ok ? res.data.subscriptionStatus || { status: "NONE" } : { status: "NONE" };
      setSubscriptionStatus(subscription);
      // /api/auth/me pauses the codes of an ended plan; reload so the list shows them as paused
      if (!["TRIAL_ACTIVE", "SUBSCRIPTION_ACTIVE"].includes(subscription.status)) loadCodes();
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  // Close the actions menu on outside click or Escape
  useEffect(() => {
    if (!openMenuId) return;
    const onDown = (e) => !e.target.closest(".qr-menu") && setOpenMenuId(null);
    const onKey = (e) => e.key === "Escape" && setOpenMenuId(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenuId]);

  // ---- Derived data
  const liveCodes = useMemo(() => codes.filter((c) => c.status !== "DELETED"), [codes]);
  const designs = useMemo(() => new Map(liveCodes.map((c) => [c.id, designFor(c)])), [liveCodes]);
  const stats = useMemo(
    () => ({
      total: liveCodes.length,
      active: liveCodes.filter((c) => c.status === "ACTIVE").length,
      paused: liveCodes.filter((c) => c.status === "PAUSED").length,
      scans: liveCodes.reduce((sum, c) => sum + (c.scanCount || 0), 0),
    }),
    [liveCodes]
  );
  const folderCounts = useMemo(() => {
    const counts = {};
    for (const c of liveCodes) if (c.folderId) counts[c.folderId] = (counts[c.folderId] || 0) + 1;
    return counts;
  }, [liveCodes]);
  const typesInUse = useMemo(() => [...new Set(liveCodes.map((c) => c.type).filter(Boolean))], [liveCodes]);

  const activeFolder = folders.find((f) => f.id === folderParam) || null;
  const activeFolderId = activeFolder?.id || null;

  const query = searchQuery.trim().toLowerCase();
  const scoped = liveCodes.filter((c) => {
    if (activeFolderId && c.folderId !== activeFolderId) return false;
    if (typeFilter && c.type !== typeFilter) return false;
    if (!query) return true;
    return [displayName(c), c.type, c.slug, destinationOf(c).label].some((v) => (v || "").toLowerCase().includes(query));
  });
  const statusCounts = {
    All: scoped.length,
    Active: scoped.filter((c) => c.status === "ACTIVE").length,
    Paused: scoped.filter((c) => c.status === "PAUSED").length,
  };
  const filteredCodes = scoped
    .filter((c) => statusFilter === "All" || c.status === (statusFilter === "Active" ? "ACTIVE" : "PAUSED"))
    .sort(SORTERS[sortBy]);
  const totalPages = Math.max(1, Math.ceil(filteredCodes.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const pageCodes = filteredCodes.slice(startIndex, startIndex + pageSize);
  const hasFilters = !!query || !!typeFilter || statusFilter !== "All";

  const selectedCodes = liveCodes.filter((c) => selectedIds.has(c.id));
  const allOnPageSelected = pageCodes.length > 0 && pageCodes.every((c) => selectedIds.has(c.id));
  const someOnPageSelected = pageCodes.some((c) => selectedIds.has(c.id));

  // New filters or page: start from page 1 and a clean selection, so bulk actions never touch hidden codes
  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, typeFilter, sortBy, pageSize, activeFolderId]);
  useEffect(() => {
    setSelectedIds(new Set());
  }, [query, statusFilter, typeFilter, sortBy, pageSize, activeFolderId, page]);

  // ---- Actions
  const canDownload = (code) => !hasExpiredAccess && !(code.status === "PAUSED" && EXPIRED_REASONS.includes(code.deactivatedReason));

  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSelectPage = () => setSelectedIds(allOnPageSelected ? new Set() : new Set(pageCodes.map((c) => c.id)));

  const selectFolder = (id) => router.push(id ? `/dashboard?folder=${id}` : "/dashboard", undefined, { shallow: true });

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("");
    setStatusFilter("All");
  };

  const afterBulk = async () => {
    setOpenMenuId(null);
    setSelectedIds(new Set());
    await loadCodes();
  };

  const actions = {
    preview: (code) => {
      setOpenMenuId(null);
      setPreviewCode(code);
    },
    download: (code) => {
      setOpenMenuId(null);
      if (!canDownload(code)) {
        showToast("Your plan has ended. Renew it to download QR codes again.", "error");
        return;
      }
      setDownloadCode(code);
    },
    copyLink: async (code) => {
      setOpenMenuId(null);
      const link = `${origin.replace(/\/$/, "")}/r/${code.slug}`;
      try {
        await navigator.clipboard.writeText(link);
        showToast("Short link copied");
      } catch {
        showToast(link);
      }
    },
    duplicate: async (code) => {
      setOpenMenuId(null);
      const res = await request("/api/duplicate-qr", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ id: code.id }) });
      if (!res.ok) return showToast(res.data.error || "Couldn't duplicate the QR code.", "error");
      showToast("QR code duplicated");
      loadCodes();
    },
    move: (targets) => {
      setOpenMenuId(null);
      setMoveTargets(targets);
    },
    setPaused: async (targets, pause) => {
      const eligible = targets.filter((c) =>
        pause ? c.status === "ACTIVE" && (c.linkType || "DYNAMIC") === "DYNAMIC" : c.status === "PAUSED"
      );
      if (eligible.length === 0) return;
      setBusy(true);
      const results = await Promise.all(eligible.map((c) => request(`/api/qrs/${c.id}/${pause ? "pause" : "resume"}`, { method: "POST" })));
      setBusy(false);
      const failed = results.find((r) => !r.ok);
      if (failed) showToast(failed.data.error || "Some QR codes couldn't be updated.", "error");
      else showToast(`${countLabel(eligible.length)} ${pause ? "paused" : "resumed"}`);
      afterBulk();
    },
    remove: (targets) => {
      setOpenMenuId(null);
      setConfirmDelete(targets);
    },
  };

  const deleteCodes = async () => {
    const targets = confirmDelete || [];
    setBusy(true);
    const results = await Promise.all(targets.map((c) => request(`/api/delete-qr?id=${encodeURIComponent(c.id)}`, { method: "DELETE" })));
    setBusy(false);
    setConfirmDelete(null);
    const failed = results.filter((r) => !r.ok).length;
    if (failed) showToast(`${failed} of ${targets.length} couldn't be deleted.`, "error");
    else showToast(`${countLabel(targets.length)} deleted`);
    afterBulk();
  };

  const moveTo = async (folderId) => {
    const targets = moveTargets || [];
    setBusy(true);
    const results = await Promise.all(
      targets.map((c) =>
        request("/api/move-to-folder", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ qrCodeId: c.id, folderId }) })
      )
    );
    setBusy(false);
    setMoveTargets(null);
    const failed = results.find((r) => !r.ok);
    if (failed) showToast(failed.data.error || "Some QR codes couldn't be moved.", "error");
    else showToast(folderId ? `Moved to ${folders.find((f) => f.id === folderId)?.name || "folder"}` : "Removed from folder");
    afterBulk();
  };

  const createFolder = async (e) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    setCreatingFolder(true);
    const res = await request("/api/folders", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ name }) });
    setCreatingFolder(false);
    if (!res.ok) return showToast(res.data.error || "Couldn't create the folder.", "error");
    setNewFolderName("");
    setShowCreateFolder(false);
    showToast(`Folder "${name}" created`);
    loadFolders();
  };

  const edit = {
    editingId,
    value: editingName,
    saving: savingName,
    start: (code) => {
      setEditingId(code.id);
      setEditingName(code.name || "");
    },
    change: setEditingName,
    cancel: () => {
      setEditingId(null);
      setEditingName("");
    },
    save: async (id) => {
      if (savingName) return;
      setSavingName(true);
      const res = await request("/api/update-qr-name", { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify({ id, name: editingName.trim() }) });
      setSavingName(false);
      if (!res.ok) return showToast(res.data.error || "Couldn't rename the QR code.", "error");
      setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, name: res.data.qrCode?.name ?? c.name } : c)));
      setEditingId(null);
      setEditingName("");
    },
  };

  const handleFolderUpdated = (updated) => setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  const handleFolderDeleted = (deletedId) => {
    setFolders((prev) => prev.filter((f) => f.id !== deletedId));
    loadCodes();
  };

  const trialLeft = Math.max(0, TRIAL_QR_LIMIT - stats.total);
  const totalHint =
    status === "TRIAL_ACTIVE"
      ? `${trialLeft} of ${TRIAL_QR_LIMIT} left on your free trial`
      : status === "SUBSCRIPTION_ACTIVE"
        ? "Unlimited on Basic"
        : null;
  const expiredTitle =
    status === "TRIAL_EXPIRED" ? "Your free trial has ended" : status === "SUBSCRIPTION_EXPIRED" ? "Your subscription has ended" : "No active plan";
  const canBulkPause = selectedCodes.some((c) => c.status === "ACTIVE" && (c.linkType || "DYNAMIC") === "DYNAMIC");
  const canBulkResume = selectedCodes.some((c) => c.status === "PAUSED");

  return (
    <DashboardLayout
      title="My QR codes"
      description="Manage, organise and track every QR code you've created."
      actions={
        <Link
          href="/dashboard/create-qr"
          className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold !text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
        >
          <FaPlus className="h-3.5 w-3.5" />
          New QR code
        </Link>
      }
    >
      {hasExpiredAccess && (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <FaExclamationTriangle className="h-4 w-4" />
            </span>
            <div>
              <p className="font-semibold text-amber-900">{expiredTitle}</p>
              <p className="mt-0.5 text-sm text-amber-800">
                Your QR codes are paused: scans show a paused page and downloads are off. Nothing is deleted, so subscribing switches
                them straight back on.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/billing"
            className="btn-shine inline-flex flex-none items-center justify-center rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold !text-white shadow-sm transition hover:bg-amber-700"
          >
            View plans
          </Link>
        </div>
      )}

      {!loading && liveCodes.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard
            icon={FaQrcode}
            label="QR codes"
            value={stats.total}
            hint={totalHint}
            iconClass="bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25"
          />
          <StatCard icon={FaCheckCircle} label="Active" value={stats.active} hint="Redirecting normally" iconClass="bg-emerald-50 text-emerald-600" />
          <StatCard icon={FaPauseCircle} label="Paused" value={stats.paused} hint="Showing a paused page" iconClass="bg-amber-50 text-amber-600" />
          <StatCard icon={FaChartLine} label="Total scans" value={stats.scans.toLocaleString()} hint="All dynamic codes" iconClass="bg-indigo-50 text-indigo-600" />
        </div>
      )}

      <section className="mb-6" aria-labelledby="folders-heading">
        <h2 id="folders-heading" className="mb-3 text-sm font-semibold text-gray-900">
          Folders
        </h2>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
          <FolderChip icon={FaQrcode} label="All QR codes" count={stats.total} active={!activeFolderId} onClick={() => selectFolder(null)} />
          {folders.map((folder) => (
            <FolderChip
              key={folder.id}
              icon={activeFolderId === folder.id ? FaFolderOpen : FaFolder}
              label={folder.name}
              count={folderCounts[folder.id] || 0}
              active={activeFolderId === folder.id}
              onClick={() => selectFolder(activeFolderId === folder.id ? null : folder.id)}
            />
          ))}
          <button
            type="button"
            onClick={() => setShowCreateFolder(true)}
            className="btn-shine btn-shine-soft inline-flex flex-none items-center gap-2 whitespace-nowrap rounded-xl border border-dashed border-indigo-300 px-3.5 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-400 hover:bg-indigo-50"
          >
            <FaFolderPlus className="h-4 w-4" />
            New folder
          </button>
        </div>
      </section>

      {activeFolder && (
        <FolderHeader
          folder={{ ...activeFolder, qrCodes: undefined, _count: { qrCodes: folderCounts[activeFolder.id] || 0 } }}
          onFolderUpdated={handleFolderUpdated}
          onFolderDeleted={handleFolderDeleted}
        />
      )}

      {liveCodes.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, link or type"
              aria-label="Search QR codes"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 hover:border-indigo-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div role="tablist" aria-label="Filter by status" className="inline-flex rounded-xl bg-gray-100 p-1">
              {STATUS_FILTERS.map((s) => {
                const active = statusFilter === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStatusFilter(s)}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      active ? "bg-white font-semibold text-indigo-700 shadow-sm" : "font-medium text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {s}
                    <span className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-indigo-50 text-indigo-700" : "bg-gray-200/70 text-gray-500"}`}>
                      {statusCounts[s]}
                    </span>
                  </button>
                );
              })}
            </div>
            <SelectBox label="QR type" value={typeFilter} onChange={setTypeFilter}>
              <option value="">All types</option>
              {typesInUse.map((t) => (
                <option key={t} value={t}>
                  {typeMeta(t).label}
                </option>
              ))}
            </SelectBox>
            <SelectBox label="Sort by" value={sortBy} onChange={setSortBy}>
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectBox>
          </div>
        </div>
      )}

      {loading ? (
        <ul className="space-y-3" aria-label="Loading QR codes">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </ul>
      ) : liveCodes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 px-6 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
            <FaQrcode className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-gray-900">Create your first QR code</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-600">
            Point it at a website, Wi-Fi network, WhatsApp chat or Instagram profile. Dynamic codes can be changed any time after printing.
          </p>
          <Link
            href="/dashboard/create-qr"
            className="btn-shine mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold !text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-purple-700"
          >
            <FaPlus className="h-3.5 w-3.5" />
            New QR code
          </Link>
        </div>
      ) : filteredCodes.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
            <FaSearch className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-semibold text-gray-900">
            {activeFolder && !hasFilters ? `No QR codes in "${activeFolder.name}" yet` : "No QR codes match your filters"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeFolder && !hasFilters ? "Use “Move to folder” on any QR code to add it here." : "Try a different search, or clear the filters."}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="btn-shine btn-shine-soft mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              <FaTimes className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-gray-600">
              <input
                type="checkbox"
                checked={allOnPageSelected}
                ref={(el) => el && (el.indeterminate = someOnPageSelected && !allOnPageSelected)}
                onChange={toggleSelectPage}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Select all
            </label>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{filteredCodes.length}</span> {filteredCodes.length === 1 ? "QR code" : "QR codes"}
            </p>
          </div>

          <ul className="space-y-3">
            {pageCodes.map((code) => (
              <QrRow
                key={code.id}
                code={code}
                design={designs.get(code.id)}
                origin={origin}
                selected={selectedIds.has(code.id)}
                onToggleSelect={toggleSelect}
                menuOpen={openMenuId === code.id}
                onToggleMenu={(id) => setOpenMenuId(openMenuId === id ? null : id)}
                canDownload={canDownload(code)}
                edit={edit}
                actions={actions}
              />
            ))}
          </ul>

          <div className="mt-6 flex flex-col-reverse items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">
                {startIndex + 1}–{Math.min(startIndex + pageSize, filteredCodes.length)}
              </span>{" "}
              of <span className="font-medium text-gray-700">{filteredCodes.length}</span>
            </p>
            <div className="flex items-center gap-3">
              {filteredCodes.length > PAGE_SIZES[0] && (
                <SelectBox label="QR codes per page" value={pageSize} onChange={(v) => setPageSize(Number(v))}>
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n} per page
                    </option>
                  ))}
                </SelectBox>
              )}
              {totalPages > 1 && (
                <nav aria-label="Pagination" className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page - 1)}
                    disabled={page === 1}
                    aria-label="Previous page"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <FaChevronLeft className="h-3 w-3" />
                  </button>
                  {pageList(page, totalPages).map((p, i, list) => (
                    <span key={p} className="flex items-center gap-1">
                      {i > 0 && p - list[i - 1] > 1 && <span className="px-1 text-sm text-gray-400">…</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        aria-current={p === page ? "page" : undefined}
                        className={`h-9 min-w-[2.25rem] rounded-lg px-2 text-sm font-medium tabular-nums transition ${
                          p === page
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page + 1)}
                    disabled={page === totalPages}
                    aria-label="Next page"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <FaChevronRight className="h-3 w-3" />
                  </button>
                </nav>
              )}
            </div>
          </div>
        </>
      )}

      {/* Room for the floating selection bar */}
      {selectedCodes.length > 0 && <div className="h-20" aria-hidden="true" />}

      {selectedCodes.length > 0 && (
        <Portal>
          <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 sm:bottom-6">
            <div className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl bg-gray-900 p-1.5 pl-4 text-white shadow-2xl shadow-gray-900/30 ring-1 ring-white/10">
              <span className="whitespace-nowrap pr-2 text-sm font-semibold">{selectedCodes.length} selected</span>
              <span className="h-6 w-px flex-none bg-white/15" aria-hidden="true" />
              <BulkButton icon={FaFolderOpen} label="Move" disabled={busy} onClick={() => actions.move(selectedCodes)} />
              {canBulkPause && <BulkButton icon={FaPause} label="Pause" disabled={busy} onClick={() => actions.setPaused(selectedCodes, true)} />}
              {canBulkResume && <BulkButton icon={FaPlay} label="Resume" disabled={busy} onClick={() => actions.setPaused(selectedCodes, false)} />}
              {selectedCodes.length === 1 && (
                <BulkButton icon={FaDownload} label="Download" disabled={busy} onClick={() => actions.download(selectedCodes[0])} />
              )}
              <BulkButton icon={FaTrash} label="Delete" danger disabled={busy} onClick={() => actions.remove(selectedCodes)} />
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                aria-label="Clear selection"
                className="ml-1 flex h-9 w-9 flex-none items-center justify-center rounded-xl text-gray-400 transition hover:bg-white/10 hover:text-white"
              >
                <FaTimes className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Portal>
      )}

      {moveTargets && (
        <Modal title="Move to folder" icon={FaFolderOpen} onClose={() => setMoveTargets(null)}>
          <p className="mb-4 text-sm text-gray-600">
            {moveTargets.length === 1 ? (
              <>
                Choose where to put <span className="font-medium text-gray-900">{displayName(moveTargets[0])}</span>.
              </>
            ) : (
              <>Choose where to put {countLabel(moveTargets.length)}.</>
            )}
          </p>
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {[{ id: null, name: "No folder" }, ...folders].map((folder) => {
              const current = moveTargets.length === 1 && (moveTargets[0].folderId || null) === folder.id;
              return (
                <button
                  key={folder.id || "none"}
                  type="button"
                  disabled={busy}
                  onClick={() => moveTo(folder.id)}
                  className={`btn-shine btn-shine-soft flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition disabled:opacity-50 ${
                    current ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/50"
                  }`}
                >
                  <FaFolder className={`h-4 w-4 ${folder.id ? "text-indigo-500" : "text-gray-400"}`} />
                  <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                  {current && <FaCheck className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
          {folders.length === 0 && (
            <p className="mt-3 text-xs text-gray-500">You don't have any folders yet. Create one with "New folder" on the page.</p>
          )}
        </Modal>
      )}

      {showCreateFolder && (
        <Modal
          title="New folder"
          icon={FaFolderPlus}
          onClose={() => {
            setShowCreateFolder(false);
            setNewFolderName("");
          }}
        >
          <form onSubmit={createFolder}>
            <label htmlFor="new-folder-name" className="mb-2 block text-sm font-medium text-gray-700">
              Folder name
            </label>
            <input
              id="new-folder-name"
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Restaurant menus"
              maxLength={60}
              autoFocus
              className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-2 text-xs text-gray-500">Group codes by campaign, location or client.</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName("");
                }}
                className="btn-shine btn-shine-soft rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingFolder || !newFolderName.trim()}
                className="btn-shine rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingFolder ? "Creating…" : "Create folder"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          title={confirmDelete.length === 1 ? "Delete this QR code?" : `Delete ${countLabel(confirmDelete.length)}?`}
          icon={FaTrash}
          danger
          onClose={() => !busy && setConfirmDelete(null)}
        >
          <p className="text-sm text-gray-600">
            {confirmDelete.length === 1 ? (
              <>
                <span className="font-medium text-gray-900">{displayName(confirmDelete[0])}</span> will stop working. Anyone who scans a
                printed copy will see a "not found" page.
              </>
            ) : (
              <>These QR codes will stop working. Anyone who scans a printed copy will see a "not found" page.</>
            )}{" "}
            This can't be undone.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              disabled={busy}
              className="btn-shine btn-shine-soft rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={deleteCodes}
              disabled={busy}
              className="btn-shine rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}

      {previewCode && (
        <Portal>
          <QrOverviewModal qrCode={previewCode} onClose={() => setPreviewCode(null)} />
        </Portal>
      )}

      {downloadCode && (
        <Portal>
          <QrDownloadModal qrCode={downloadCode} onClose={() => setDownloadCode(null)} />
        </Portal>
      )}

      {toast && (
        <Portal>
          <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4" role="status" aria-live="polite">
            <div
              key={toast.id}
              className={`flex max-w-md items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-xl ${
                toast.tone === "error" ? "bg-red-600" : "bg-gray-900"
              }`}
            >
              {toast.tone === "error" ? <FaExclamationCircle className="h-4 w-4 flex-none" /> : <FaCheckCircle className="h-4 w-4 flex-none text-emerald-400" />}
              <span className="break-words">{toast.message}</span>
            </div>
          </div>
        </Portal>
      )}
    </DashboardLayout>
  );
}
