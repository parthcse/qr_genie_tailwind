import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import DashboardLayout from "../../../components/DashboardLayout";
import { FaQrcode, FaArrowLeft, FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export async function getServerSideProps(context) {
  const { getUserFromRequest } = await import("../../../lib/auth");
  const user = await getUserFromRequest(context.req);
  if (!user) {
    return { redirect: { destination: "/auth/login", permanent: false } };
  }
  const { id } = context.params;
  return { props: { qrId: id } };
}

export default function QrDetailPage({ qrId }) {
  const router = useRouter();
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

  // In browser use current origin so in dev the short link is http://localhost:3000/r/slug
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
      } else {
        alert(data.error || "Failed to update URL");
      }
    } catch (e) {
      alert("An error occurred");
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
      } else {
        alert(data.error || "Failed to update message");
      }
    } catch (e) {
      alert("An error occurred");
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
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !qr) {
    return (
      <DashboardLayout title="QR Code" description="View and edit QR code details.">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-800">{error || "QR code not found"}</p>
          <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:underline">
            <FaArrowLeft /> Back to My QR Codes
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isDynamic = qr.linkType === "DYNAMIC";

  return (
    <DashboardLayout title={qr.name || "QR Code"} description="View and edit QR code details and analytics.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
          >
            <FaArrowLeft /> My QR Codes
          </Link>
        </div>

        {/* Meta card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium text-gray-900">{qr.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Slug</dt>
              <dd className="font-medium text-gray-900 font-mono">{qr.slug}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Type</dt>
              <dd className="font-medium text-gray-900 capitalize">{qr.type || "website"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Link type</dt>
              <dd className="font-medium text-gray-900">{isDynamic ? "Dynamic" : "Static"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    qr.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {qr.status === "PAUSED" ? "Paused" : qr.status === "ACTIVE" ? "Active" : qr.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Folder</dt>
              <dd className="font-medium text-gray-900">{qr.folder?.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Created</dt>
              <dd className="font-medium text-gray-900">{formatDate(qr.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Updated</dt>
              <dd className="font-medium text-gray-900">{formatDate(qr.updatedAt)}</dd>
            </div>
          </dl>
          {isDynamic && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <dt className="text-gray-500 text-sm mb-1">Short link</dt>
              <dd className="flex flex-wrap items-center gap-2">
                <a
                  href={shortLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-indigo-600 hover:underline break-all"
                >
                  {shortLink || "…"}
                </a>
                <a
                  href={shortLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                >
                  Test redirect
                </a>
              </dd>
            </div>
          )}
        </div>

        {/* Target URL (Dynamic only) */}
        {isDynamic && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Destination URL</h2>
            {editingUrl ? (
              <div className="flex flex-wrap gap-2">
                <input
                  type="url"
                  value={editTargetUrl}
                  onChange={(e) => setEditTargetUrl(e.target.value)}
                  className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={handleSaveTargetUrl}
                  disabled={savingUrl}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  <FaCheck className="w-4 h-4" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingUrl(false); setEditTargetUrl(qr.targetUrl); }}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
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
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                >
                  <FaEdit className="w-4 h-4" /> Edit
                </button>
              </div>
            )}
          </div>
        )}

        {/* Paused message (when Paused and Dynamic) */}
        {isDynamic && qr.status === "PAUSED" && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Paused message</h2>
            <p className="text-sm text-gray-500 mb-2">Shown to users when they scan this QR while it is paused.</p>
            {editingPausedMessage ? (
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={editPausedMessage}
                  onChange={(e) => setEditPausedMessage(e.target.value)}
                  className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="This campaign is not active right now."
                />
                <button
                  type="button"
                  onClick={handleSavePausedMessage}
                  disabled={savingPausedMessage}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  <FaCheck className="w-4 h-4" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingPausedMessage(false); setEditPausedMessage(qr.pausedMessage || ""); }}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
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
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                >
                  <FaEdit className="w-4 h-4" /> Edit
                </button>
              </div>
            )}
          </div>
        )}

        {/* Analytics (Dynamic only) */}
        {isDynamic && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Time period</span>
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    days === d
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>

            {analytics && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-indigo-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium text-gray-500">Total scans</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{analytics.totalScans?.toLocaleString() ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-indigo-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium text-gray-500">Unique scanners</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{analytics.uniqueScans?.toLocaleString() ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-indigo-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium text-gray-500">Last scan</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{formatDate(analytics.lastScanAt)}</p>
                  </div>
                </div>

                {analytics.daily?.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Scans over time</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={analytics.daily}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                        <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} name="Scans" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {(analytics.countryStats?.length > 0 || analytics.deviceStats?.length > 0) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {analytics.countryStats?.length > 0 && (
                      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">By country</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 font-medium text-gray-700">Country</th>
                                <th className="text-right py-2 font-medium text-gray-700">Scans</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.countryStats.map(({ country, count }) => (
                                <tr key={country} className="border-b border-gray-100">
                                  <td className="py-2 text-gray-900">{country}</td>
                                  <td className="py-2 text-right text-gray-600">{count.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {analytics.deviceStats?.length > 0 && (
                      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">By device</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 font-medium text-gray-700">Device</th>
                                <th className="text-right py-2 font-medium text-gray-700">Scans</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.deviceStats.map(({ device, count }) => (
                                <tr key={device} className="border-b border-gray-100">
                                  <td className="py-2 text-gray-900">{device}</td>
                                  <td className="py-2 text-right text-gray-600">{count.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
