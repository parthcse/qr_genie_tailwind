import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FaQrcode, FaArrowLeft, FaEdit, FaCheck, FaTimes, FaLock, FaLockOpen, FaEye, FaEyeSlash } from "react-icons/fa";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useReducedMotion } from "motion/react";
import { BarList, CountUp, SegmentedControl, ToastHost, countryName, useToast } from "@/components/dashboard/DashboardUi";
import { DetailsSkeleton } from "@/components/layout/PageSkeleton";
import { isPageType, qrTypeLabel } from "@/lib/qr/qrTypes";
import { contentSummary, contentTitle } from "@/lib/qr/qrContent";

export async function getServerSideProps(context) {
  const { getUserFromRequest, accountRedirect } = await import("@/lib/auth");
  const user = await getUserFromRequest(context.req);
  // Signed out -> login; email not confirmed yet -> verification page
  const redirect = accountRedirect(user);
  if (redirect) return redirect;
  const { id } = context.params;
  return { props: { qrId: id } };
}

/** Turn the scan password on, change it, or remove it */
function PasswordCard({ qr, qrId, onChange }) {
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { tone: "success" | "error", text }

  const save = async (body, successText) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/qrs/${qrId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ tone: "error", text: data.error || "Couldn't save. Please try again." });
        return;
      }
      onChange(!!data.qrCode?.hasPassword);
      setEditing(false);
      setPassword("");
      setMessage({ tone: "success", text: successText });
    } catch {
      setMessage({ tone: "error", text: "Couldn't save. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass dash-rise rounded-2xl p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${qr.hasPassword ? "bg-violet-50 text-violet-600" : "bg-white text-gray-500 shadow-sm"}`}>
            {qr.hasPassword ? <FaLock className="h-4 w-4" /> : <FaLockOpen className="h-4 w-4" />}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Password protection</h2>
            <p className="mt-0.5 text-sm text-gray-600">
              {qr.hasPassword
                ? "On. People who scan this code must enter the password before they're sent on."
                : "Off. Anyone who scans this code goes straight to the destination."}
            </p>
          </div>
        </div>
        {!editing && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setMessage(null);
              }}
              className="btn-shine btn-shine-soft dash-field inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              {qr.hasPassword ? "Change password" : "Add a password"}
            </button>
            {qr.hasPassword && (
              <button
                type="button"
                disabled={saving}
                onClick={() => save({ removePassword: true }, "Password removed. The code now opens without one.")}
                className="btn-shine btn-shine-soft dash-field inline-flex h-9 items-center rounded-xl px-3 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      {editing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save({ password }, qr.hasPassword ? "Password changed." : "Password protection is on.");
          }}
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          <div className="relative min-w-[220px] flex-1">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="new-password"
              minLength={4}
              maxLength={64}
              placeholder={qr.hasPassword ? "New password" : "Password (at least 4 characters)"}
              aria-label="Password"
              className="dash-field h-10 w-full rounded-xl pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400 hover:text-gray-600"
            >
              {show ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={saving || password.length < 4}
            className="btn-shine inline-flex h-10 items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 text-sm font-semibold text-white transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
          >
            <FaCheck className="h-3.5 w-3.5" /> Save
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setPassword("");
            }}
            className="btn-shine btn-shine-soft dash-field inline-flex h-10 items-center gap-1 rounded-xl px-4 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            Cancel
          </button>
        </form>
      )}

      {message && (
        <p className={`mt-3 text-sm ${message.tone === "error" ? "text-red-600" : "text-emerald-700"}`} role="status">
          {message.text}
        </p>
      )}
    </div>
  );
}

// Charts take colours as plain values: brand.primary.light from tailwind.config.js and tints
const SCANS_COLOR = "#6366f1";
const AXIS_COLOR = "#64748b";
const GRID_COLOR = "rgba(99, 102, 241, 0.1)";

function ScansTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong dash-tooltip rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="mb-0.5 font-semibold text-gray-900">{new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
      <p className="text-gray-600">
        Scans: <span className="font-semibold tabular-nums text-gray-900">{payload[0].value.toLocaleString("en-US")}</span>
      </p>
    </div>
  );
}

export default function QrDetailPage({ qrId }) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { toast, showToast } = useToast();
  const [qr, setQr] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);
  const [editingUrl, setEditingUrl] = useState(false);
  const [editTargetUrl, setEditTargetUrl] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);
  const [editingPausedMessage, setEditingPausedMessage] = useState(false);
  const [editPausedMessage, setEditPausedMessage] = useState("");
  const [savingPausedMessage, setSavingPausedMessage] = useState(false);
  const [shortLink, setShortLink] = useState("");

  const loadQr = async () => {
    const res = await fetch(`/api/qrs/${qrId}`, { credentials: "include" });
    if (res.status === 404 || !res.ok) {
      setError("QR code not found");
      setQr(null);
      return;
    }
    const data = await res.json();
    setQr(data.qrCode);
    setEditTargetUrl(data.qrCode?.targetUrl || "");
    setEditPausedMessage(data.qrCode?.pausedMessage || "");
    if (data.qrCode?.slug) {
      const base = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
      setShortLink(`${base}/r/${data.qrCode.slug}`);
    }
  };

  const loadAnalytics = async () => {
    const res = await fetch(`/api/qrs/${qrId}/analytics?days=${days}`, { credentials: "include" });
    if (!res.ok) {
      setAnalytics(null);
      return;
    }
    const data = await res.json();
    setAnalytics(data);
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    loadQr().finally(() => setLoading(false));
  }, [qrId]);

  // In browser use current origin so in dev the short link is http://localhost:3002/r/slug
  useEffect(() => {
    if (qr?.slug && typeof window !== "undefined") {
      setShortLink(`${window.location.origin}/r/${qr.slug}`);
    } else if (qr?.slug) {
      const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
      setShortLink(`${base.replace(/\/$/, "")}/r/${qr.slug}`);
    } else {
      setShortLink("");
    }
  }, [qr?.slug]);

  useEffect(() => {
    if (qr?.linkType === "DYNAMIC") {
      loadAnalytics();
    }
  }, [qrId, qr?.linkType, days]);

  const handleSaveTargetUrl = async () => {
    if (!qr || qr.linkType !== "DYNAMIC") return;
    setSavingUrl(true);
    try {
      const res = await fetch(`/api/qrs/${qrId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetUrl: editTargetUrl.trim() || qr.targetUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setQr((prev) => (prev ? { ...prev, targetUrl: data.qrCode.targetUrl } : null));
        setEditingUrl(false);
        showToast("Destination updated");
      } else {
        showToast(data.error || "Couldn't update the destination.", "error");
      }
    } catch (e) {
      showToast("Couldn't update the destination. Check your connection and try again.", "error");
    } finally {
      setSavingUrl(false);
    }
  };

  const handleSavePausedMessage = async () => {
    if (!qr) return;
    setSavingPausedMessage(true);
    try {
      const res = await fetch(`/api/qrs/${qrId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pausedMessage: editPausedMessage.trim() || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setQr((prev) => (prev ? { ...prev, pausedMessage: data.qrCode?.pausedMessage ?? null } : null));
        setEditingPausedMessage(false);
        showToast("Paused message updated");
      } else {
        showToast(data.error || "Couldn't update the message.", "error");
      }
    } catch (e) {
      showToast("Couldn't update the message. Check your connection and try again.", "error");
    } finally {
      setSavingPausedMessage(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading && !qr) {
    return (
      <DashboardLayout title="QR Code" description="View and edit QR code details.">
        <DetailsSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !qr) {
    return (
      <DashboardLayout title="QR Code" description="View and edit QR code details.">
        <div className="glass rounded-2xl p-8 text-center">
          <p className="font-semibold text-gray-900">{error || "QR code not found"}</p>
          <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 font-medium !text-indigo-700 hover:underline">
            <FaArrowLeft /> Back to My QR Codes
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isDynamic = qr.linkType === "DYNAMIC";
  const isPage = isPageType(qr.type);

  return (
    <DashboardLayout title={qr.name || "QR Code"} description="View and edit QR code details and analytics.">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium !text-gray-700 transition hover:!text-indigo-700"
          >
            <FaArrowLeft /> My QR Codes
          </Link>
        </div>

        {/* Wide screens: the code's settings beside its scans */}
        <div className={`grid gap-4 ${isDynamic ? "xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:items-start" : ""}`}>
        <div className="min-w-0 space-y-4">
        {/* Meta card */}
        <div className="glass dash-rise rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-600">Name</dt>
              <dd className="font-medium text-gray-900">{qr.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Slug</dt>
              <dd className="font-medium text-gray-900 font-mono">{qr.slug}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Type</dt>
              <dd className="font-medium text-gray-900">{qrTypeLabel(qr.type || "website")}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Link type</dt>
              <dd className="font-medium text-gray-900">{isDynamic ? "Dynamic" : "Static"}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Status</dt>
              <dd>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    qr.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {qr.status === "PAUSED" ? "Paused" : qr.status === "ACTIVE" ? "Active" : qr.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-gray-600">Folder</dt>
              <dd className="font-medium text-gray-900">{qr.folder?.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Created</dt>
              <dd className="font-medium text-gray-900">{formatDate(qr.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Updated</dt>
              <dd className="font-medium text-gray-900">{formatDate(qr.updatedAt)}</dd>
            </div>
          </dl>
          {isDynamic && (
            <div className="mt-4 border-t border-indigo-950/[0.06] pt-4">
              <dt className="mb-1 text-sm text-gray-600">Short link</dt>
              <dd className="flex flex-wrap items-center gap-2">
                <a
                  href={shortLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-mono text-sm !text-indigo-700 hover:underline"
                >
                  {shortLink || "…"}
                </a>
                <a
                  href={shortLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-shine btn-shine-soft rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold !text-indigo-700 transition hover:bg-indigo-100"
                >
                  {isPage ? "Open page" : "Test redirect"}
                </a>
              </dd>
            </div>
          )}
        </div>

        {/* Hosted page (list of links, ...): its content is edited on the create page */}
        {isPage && (
          <div className="glass dash-rise rounded-2xl p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900">Page</h2>
                <p className="mt-1 text-sm text-gray-600">What people see when they scan this code. Change it any time; the printed code stays the same.</p>
              </div>
              <Link
                href={`/dashboard/create-qr?edit=${qr.id}`}
                className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold !text-white shadow-md shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-purple-700"
              >
                <FaEdit className="h-3.5 w-3.5" /> Edit page
              </Link>
            </div>
            {qr.content && (
              <p className="mt-4 text-sm text-gray-700">
                <span className="font-medium text-gray-900">{contentTitle(qr.type, qr.content)}</span>
                {contentSummary(qr.type, qr.content) ? <span className="text-gray-600"> · {contentSummary(qr.type, qr.content)}</span> : null}
              </p>
            )}
          </div>
        )}

        {/* Target URL (Dynamic only) */}
        {isDynamic && !isPage && (
          <div className="glass dash-rise rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Destination URL</h2>
            {editingUrl ? (
              <div className="flex flex-wrap gap-2">
                <input
                  type="url"
                  value={editTargetUrl}
                  onChange={(e) => setEditTargetUrl(e.target.value)}
                  className="dash-field min-w-[200px] flex-1 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={handleSaveTargetUrl}
                  disabled={savingUrl}
                  className="btn-shine inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                >
                  <FaCheck className="w-4 h-4" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingUrl(false); setEditTargetUrl(qr.targetUrl); }}
                  className="btn-shine btn-shine-soft dash-field inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  <FaTimes className="w-4 h-4" /> Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-gray-700 break-all">{qr.targetUrl}</p>
                <button
                  type="button"
                  onClick={() => setEditingUrl(true)}
                  className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-indigo-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <FaEdit className="w-4 h-4" /> Edit
                </button>
              </div>
            )}
          </div>
        )}

        {/* Password protection (dynamic codes that open a link) */}
        {isDynamic && qr.type !== "wifi" && !isPage && (
          <PasswordCard qr={qr} qrId={qrId} onChange={(hasPassword) => setQr((prev) => (prev ? { ...prev, hasPassword } : prev))} />
        )}

        {/* Paused message (when Paused and Dynamic) */}
        {isDynamic && qr.status === "PAUSED" && (
          <div className="glass dash-rise rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Paused message</h2>
            <p className="mb-2 text-sm text-gray-600">Shown to people who scan this code while it's paused.</p>
            {editingPausedMessage ? (
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={editPausedMessage}
                  onChange={(e) => setEditPausedMessage(e.target.value)}
                  className="dash-field min-w-[200px] flex-1 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="This campaign is not active right now."
                />
                <button
                  type="button"
                  onClick={handleSavePausedMessage}
                  disabled={savingPausedMessage}
                  className="btn-shine inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                >
                  <FaCheck className="w-4 h-4" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingPausedMessage(false); setEditPausedMessage(qr.pausedMessage || ""); }}
                  className="btn-shine btn-shine-soft dash-field inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  <FaTimes className="w-4 h-4" /> Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-gray-700">{qr.pausedMessage || "Default message (no custom text set)."}</p>
                <button
                  type="button"
                  onClick={() => setEditingPausedMessage(true)}
                  className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-indigo-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <FaEdit className="w-4 h-4" /> Edit
                </button>
              </div>
            )}
          </div>
        )}

        </div>

        {/* Analytics (Dynamic only) */}
        {isDynamic && (
          <div className="min-w-0 space-y-4">
            <SegmentedControl
              label="Time period"
              className="w-full sm:w-auto"
              options={[7, 30, 90].map((d) => ({ value: d, label: `${d} days` }))}
              value={days}
              onChange={setDays}
            />

            {analytics && (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  <div className="glass glass-hover dash-rise rounded-2xl p-4 sm:p-5">
                    <p className="text-xs font-medium text-gray-600">Total scans</p>
                    <p className="mt-1 font-sans text-3xl font-bold text-gray-900">
                      <CountUp value={analytics.totalScans} />
                    </p>
                  </div>
                  <div className="glass glass-hover dash-rise rounded-2xl p-4 sm:p-5" style={{ "--i": 1 }}>
                    <p className="text-xs font-medium text-gray-600">Unique scanners</p>
                    <p className="mt-1 font-sans text-3xl font-bold text-gray-900">
                      <CountUp value={analytics.uniqueScans} />
                    </p>
                  </div>
                  <div className="glass glass-hover dash-rise rounded-2xl p-4 sm:p-5" style={{ "--i": 2 }}>
                    <p className="text-xs font-medium text-gray-600">Last scan</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{formatDate(analytics.lastScanAt)}</p>
                  </div>
                </div>

                {analytics.daily?.length > 0 && (
                  <div className="glass dash-rise rounded-2xl p-4 sm:p-6" style={{ "--i": 3 }}>
                    <h3 className="mb-4 text-sm font-semibold text-gray-900">Scans over time</h3>
                    <div className="h-64 sm:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart key={days} data={analytics.daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="codeScansFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={SCANS_COLOR} stopOpacity={0.3} />
                              <stop offset="100%" stopColor={SCANS_COLOR} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke={GRID_COLOR} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: AXIS_COLOR }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={28}
                            tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={false} tickLine={false} />
                          <Tooltip content={<ScansTooltip />} cursor={{ stroke: "#c7d2fe" }} animationDuration={160} isAnimationActive={!reducedMotion} />
                          <Area
                            type="monotone"
                            dataKey="count"
                            name="Scans"
                            stroke={SCANS_COLOR}
                            strokeWidth={2.5}
                            fill="url(#codeScansFill)"
                            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                            isAnimationActive={!reducedMotion}
                            animationDuration={1200}
                            animationEasing="ease-out"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {(analytics.countryStats?.length > 0 || analytics.deviceStats?.length > 0) && (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {analytics.countryStats?.length > 0 && (
                      <div className="glass dash-rise rounded-2xl p-4 sm:p-6" style={{ "--i": 4 }}>
                        <h3 className="mb-4 text-sm font-semibold text-gray-900">By country</h3>
                        <BarList
                          items={analytics.countryStats.map(({ country, count }) => ({ name: country, count }))}
                          total={analytics.totalScans}
                          formatName={countryName}
                          color="bg-sky-500"
                        />
                      </div>
                    )}
                    {analytics.deviceStats?.length > 0 && (
                      <div className="glass dash-rise rounded-2xl p-4 sm:p-6" style={{ "--i": 5 }}>
                        <h3 className="mb-4 text-sm font-semibold text-gray-900">By device</h3>
                        <BarList items={analytics.deviceStats.map(({ device, count }) => ({ name: device, count }))} total={analytics.totalScans} />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        </div>
      </div>
      <ToastHost toast={toast} />
    </DashboardLayout>
  );
}
