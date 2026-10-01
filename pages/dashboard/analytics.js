// pages/dashboard/analytics.js
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  FaChartLine,
  FaUsers,
  FaCalendarDay,
  FaFire,
  FaArrowUp,
  FaArrowDown,
  FaDownload,
  FaChevronDown,
  FaQrcode,
  FaMobileAlt,
  FaGlobeAmericas,
  FaClock,
  FaPlus,
  FaInfoCircle,
  FaExclamationTriangle,
  FaChevronRight,
} from "react-icons/fa";

export async function getServerSideProps(context) {
  const { getUserFromRequest } = await import("../../lib/auth");
  const user = await getUserFromRequest(context.req);
  if (!user) {
    return { redirect: { destination: "/auth/login", permanent: false } };
  }
  const initialQrId = (context.query.qrId && String(context.query.qrId).trim()) || null;
  return { props: { initialQrId } };
}

const PERIODS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "12 months" },
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEVICE_COLORS = { Mobile: "#6366f1", Desktop: "#a855f7", Tablet: "#0ea5e9", Unknown: "#cbd5e1" };
const TYPE_LABELS = { website: "Website", wifi: "WiFi", whatsapp: "WhatsApp", instagram: "Instagram", pdf: "PDF", vcard: "vCard" };

const fmt = (n) => (n || 0).toLocaleString("en-US");
const dayLabel = (key, withYear = false) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}) });
const hourLabel = (h) => (h === 0 ? "12 am" : h < 12 ? `${h} am` : h === 12 ? "12 pm" : `${h - 12} pm`);

function timeAgo(date) {
  if (!date) return "—";
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Country codes (from the scan's IP) as names, e.g. "IN" -> "India"
let regionNames = null;
function countryName(code) {
  if (!code || code === "Unknown" || code.length !== 2) return code || "Unknown";
  try {
    regionNames = regionNames || new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
}
const cityName = (value) => {
  const [city, code] = value.split(", ");
  return code ? `${city}, ${countryName(code)}` : city;
};

/** Change vs the previous period: "+12%", "New" or nothing */
function trendOf(current, previous) {
  if (!current && !previous) return null;
  if (!previous) return { label: "New", tone: "up" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { label: "0%", tone: "flat" };
  return { label: `${pct > 0 ? "+" : ""}${pct}%`, tone: pct > 0 ? "up" : "down" };
}

function Card({ title, icon: Icon, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            {Icon && <Icon className="h-3.5 w-3.5 text-indigo-500" />}
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function KpiCard({ icon: Icon, iconClass, label, value, sub, trend, previousLabel }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-1 truncate text-2xl font-bold tabular-nums text-gray-900">{value}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {trend && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold ${
              trend.tone === "up" ? "bg-emerald-50 text-emerald-700" : trend.tone === "down" ? "bg-rose-50 text-rose-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            {trend.tone === "up" && <FaArrowUp className="h-2.5 w-2.5" />}
            {trend.tone === "down" && <FaArrowDown className="h-2.5 w-2.5" />}
            {trend.label}
          </span>
        )}
        <span className="truncate text-gray-500">{trend ? previousLabel : sub}</span>
      </div>
    </div>
  );
}

/** Horizontal bars with counts and shares */
function BarList({ items, total, formatName = (v) => v, color = "bg-indigo-500", empty = "No data yet" }) {
  if (!items.length) return <p className="py-6 text-center text-sm text-gray-400">{empty}</p>;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.name}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-gray-700">{formatName(item.name)}</span>
            <span className="flex-none tabular-nums text-gray-500">
              <span className="font-semibold text-gray-900">{fmt(item.count)}</span>
              <span className="ml-1.5 text-xs">{Math.round((item.count / total) * 100)}%</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(3, (item.count / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-gray-900">{dayLabel(label, true)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-gray-600">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-gray-900">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function Heatmap({ grid }) {
  const max = Math.max(1, ...grid.flat());
  let peak = null;
  grid.forEach((row, d) => row.forEach((count, h) => {
    if (count > 0 && (!peak || count > peak.count)) peak = { d, h, count };
  }));

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-[3px]">
            {grid.map((row, d) => (
              <div key={WEEKDAYS[d]} className="contents">
                <span className="pr-2 text-right text-[11px] leading-5 text-gray-400">{WEEKDAYS[d]}</span>
                {row.map((count, h) => (
                  <span
                    key={h}
                    title={`${WEEKDAYS[d]} ${hourLabel(h)}: ${count} scan${count === 1 ? "" : "s"}`}
                    className="h-5 rounded-[4px]"
                    style={{ background: count ? `rgba(99, 102, 241, ${0.15 + 0.85 * (count / max)})` : "#f3f4f6" }}
                  />
                ))}
              </div>
            ))}
            <span />
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="text-center text-[10px] text-gray-400">
                {h % 3 === 0 ? hourLabel(h).replace(" ", "") : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <p>
          {peak ? (
            <>
              Busiest time: <span className="font-semibold text-gray-800">{WEEKDAYS[peak.d]}, {hourLabel(peak.h)}–{hourLabel((peak.h + 1) % 24)}</span> (
              {fmt(peak.count)} scans). Times are in your time zone.
            </>
          ) : (
            "No scans yet."
          )}
        </p>
        <span className="flex items-center gap-1.5">
          Fewer
          {[0.15, 0.4, 0.65, 1].map((a) => (
            <span key={a} className="h-3 w-3 rounded-[3px]" style={{ background: `rgba(99, 102, 241, ${a})` }} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5" aria-label="Loading analytics">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[118px] animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-gray-100" />
      <div className="grid gap-5 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage({ initialQrId }) {
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [qrId, setQrId] = useState(initialQrId || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ days: String(days), tz: String(new Date().getTimezoneOffset()) });
      if (qrId) params.set("qrId", qrId);
      try {
        const res = await fetch(`/api/analytics/overview?${params}`, { credentials: "include" });
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 404 && qrId) {
          setQrId("");
          return;
        }
        if (!res.ok) throw new Error(body.error || "Couldn't load analytics.");
        setData(body);
      } catch (e) {
        if (!cancelled) setError(e.message || "Couldn't load analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [days, qrId, reloadKey]);

  // Keep the chosen code in the address bar so the view can be bookmarked or shared
  useEffect(() => {
    const current = typeof router.query.qrId === "string" ? router.query.qrId : "";
    if (current !== qrId) router.replace(qrId ? `/dashboard/analytics?qrId=${qrId}` : "/dashboard/analytics", undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrId]);

  const totals = data?.totals;
  const period = PERIODS.find((p) => p.days === days) || PERIODS[1];
  const previousLabel = `vs previous ${period.label}`;
  const selectedCode = data?.qrCodes?.find((c) => c.id === qrId);
  const staticCodes = (data?.qrCodes || []).filter((c) => c.linkType === "STATIC").length;
  const deviceTotal = (data?.devices || []).reduce((sum, d) => sum + d.count, 0);
  const longRange = days > 90;

  const chartData = useMemo(() => {
    const daily = data?.daily || [];
    if (!longRange) return daily;
    // 12 months: one point per week keeps the chart readable. Weeks are counted back from today,
    // so the newest point is a full week and the line doesn't dip at the end.
    const weeks = [];
    for (let end = daily.length; end > 0; end -= 7) {
      const slice = daily.slice(Math.max(0, end - 7), end);
      weeks.unshift({ date: slice[0].date, scans: slice.reduce((s, d) => s + d.scans, 0), unique: slice.reduce((s, d) => s + d.unique, 0) });
    }
    return weeks;
  }, [data, longRange]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [["Date", "Scans", "Unique scanners"], ...data.daily.map((d) => [d.date, d.scans, d.unique])];
    rows.push([], ["QR code", "Type", "Scans", "Unique scanners", "Last scan"]);
    for (const c of data.codePerformance) {
      rows.push([c.name, TYPE_LABELS[c.type] || c.type, c.scans, c.unique, c.lastScanAt ? new Date(c.lastScanAt).toISOString() : ""]);
    }
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-genie-analytics-${selectedCode ? selectedCode.name.replace(/[^\w-]+/g, "-").toLowerCase() + "-" : ""}${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout
      title="Analytics"
      description="See how often your QR codes are scanned, where and on which devices."
      actions={
        <button
          type="button"
          onClick={exportCsv}
          disabled={!data || !totals?.scans}
          className="btn-shine btn-shine-soft inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaDownload className="h-3.5 w-3.5" />
          Export CSV
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Time period" className="inline-flex w-full rounded-xl bg-gray-100 p-1 sm:w-auto">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              role="tab"
              aria-selected={days === p.days}
              onClick={() => setDays(p.days)}
              className={`h-8 flex-1 whitespace-nowrap rounded-lg px-3 text-sm transition sm:flex-none ${
                days === p.days ? "bg-white font-semibold text-indigo-700 shadow-sm" : "font-medium text-gray-600 hover:text-gray-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className="relative inline-flex w-full sm:w-72">
          <span className="sr-only">QR code</span>
          <FaQrcode className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <select
            value={qrId}
            onChange={(e) => setQrId(e.target.value)}
            className="h-10 w-full cursor-pointer appearance-none truncate rounded-xl border border-gray-200 bg-white pl-9 pr-9 text-sm font-medium text-gray-700 shadow-sm transition hover:border-indigo-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All QR codes</option>
            {(data?.qrCodes || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.linkType === "STATIC" ? " (static, not tracked)" : ""}
                {c.status === "DELETED" ? " (deleted)" : ""}
              </option>
            ))}
          </select>
          <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
        </label>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          <FaExclamationTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {loading && !data ? (
        <Skeleton />
      ) : data && (data.qrCodes || []).length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 px-6 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
            <FaChartLine className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-gray-900">No QR codes yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-600">Create a dynamic QR code and its scans will show up here.</p>
          <Link
            href="/dashboard/create-qr"
            className="btn-shine mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold !text-white shadow-lg shadow-indigo-500/25"
          >
            <FaPlus className="h-3.5 w-3.5" />
            New QR code
          </Link>
        </div>
      ) : data ? (
        <div className={`space-y-5 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {/* Headline numbers */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <KpiCard
              icon={FaChartLine}
              iconClass="bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25"
              label="Total scans"
              value={fmt(totals.scans)}
              trend={trendOf(totals.scans, totals.previousScans)}
              previousLabel={previousLabel}
              sub={`in the last ${period.label}`}
            />
            <KpiCard
              icon={FaUsers}
              iconClass="bg-sky-50 text-sky-600"
              label="Unique scanners"
              value={fmt(totals.unique)}
              trend={trendOf(totals.unique, totals.previousUnique)}
              previousLabel={previousLabel}
              sub="different people"
            />
            <KpiCard
              icon={FaCalendarDay}
              iconClass="bg-emerald-50 text-emerald-600"
              label="Daily average"
              value={(totals.scans / days).toLocaleString("en-US", { maximumFractionDigits: 1 })}
              sub="scans per day"
            />
            <KpiCard
              icon={FaFire}
              iconClass="bg-amber-50 text-amber-600"
              label="Busiest day"
              value={totals.busiestDay ? dayLabel(totals.busiestDay.date) : "—"}
              sub={totals.busiestDay ? `${fmt(totals.busiestDay.scans)} scans` : "no scans yet"}
            />
          </div>

          {totals.scans === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                <FaChartLine className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">No scans in the last {period.label}</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                {selectedCode?.linkType === "STATIC"
                  ? "This is a static code: it holds its content directly, so its scans can't be counted."
                  : "Once people scan your dynamic codes, you'll see when, where and on which devices here. Try a longer period, or scan one of your codes with your phone to test."}
              </p>
            </div>
          ) : (
            <>
              {/* Scans over time */}
              <Card
                title={longRange ? "Scans per week" : "Scans per day"}
                icon={FaChartLine}
                action={
                  <span className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      Scans
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-400" />
                      Unique scanners
                    </span>
                  </span>
                }
              >
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scansFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tickFormatter={(v) => dayLabel(v)} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} minTickGap={28} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#c7d2fe" }} />
                      <Area type="monotone" dataKey="scans" name="Scans" stroke="#6366f1" strokeWidth={2.5} fill="url(#scansFill)" activeDot={{ r: 5 }} animationDuration={700} />
                      <Area type="monotone" dataKey="unique" name="Unique scanners" stroke="#c084fc" strokeWidth={2} strokeDasharray="5 4" fill="none" activeDot={{ r: 4 }} animationDuration={700} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Devices, systems, browsers */}
              <div className="grid gap-5 lg:grid-cols-3">
                <Card title="Devices" icon={FaMobileAlt}>
                  <div className="flex flex-col items-center gap-5">
                    <div className="relative h-36 w-36 flex-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data.devices} dataKey="count" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none">
                            {data.devices.map((d) => (
                              <Cell key={d.name} fill={DEVICE_COLORS[d.name] || "#94a3b8"} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold tabular-nums text-gray-900">{fmt(deviceTotal)}</span>
                        <span className="text-[10px] uppercase tracking-wide text-gray-400">scans</span>
                      </span>
                    </div>
                    <ul className="w-full space-y-2">
                      {data.devices.map((d) => (
                        <li key={d.name} className="flex items-center justify-between gap-2 text-sm">
                          <span className="flex min-w-0 items-center gap-2 text-gray-700">
                            <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: DEVICE_COLORS[d.name] || "#94a3b8" }} />
                            <span>{d.name}</span>
                          </span>
                          <span className="font-semibold tabular-nums text-gray-900">{Math.round((d.count / deviceTotal) * 100)}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
                <Card title="Operating systems">
                  <BarList items={data.operatingSystems} total={totals.scans} color="bg-indigo-500" />
                </Card>
                <Card title="Browsers">
                  <BarList items={data.browsers} total={totals.scans} color="bg-purple-500" />
                </Card>
              </div>

              {/* Where */}
              <div className="grid gap-5 lg:grid-cols-2">
                <Card title="Top countries" icon={FaGlobeAmericas}>
                  <BarList items={data.countries} total={totals.scans} formatName={countryName} color="bg-sky-500" />
                </Card>
                <Card title="Top cities" icon={FaGlobeAmericas}>
                  <BarList items={data.cities} total={totals.scans} formatName={cityName} color="bg-emerald-500" />
                </Card>
              </div>

              {/* When */}
              <Card title="When people scan" icon={FaClock}>
                <Heatmap grid={data.heatmap} />
              </Card>

              {/* Per code */}
              {!qrId && (
                <Card title="QR code performance" icon={FaQrcode}>
                  <div className="-mx-4 overflow-x-auto sm:-mx-5">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                          <th className="px-4 pb-3 font-medium sm:px-5">QR code</th>
                          <th className="px-3 pb-3 font-medium">Scans</th>
                          <th className="px-3 pb-3 text-right font-medium">Unique</th>
                          <th className="px-3 pb-3 text-right font-medium">Share</th>
                          <th className="px-3 pb-3 text-right font-medium">Last scan</th>
                          <th className="px-4 pb-3 sm:px-5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {data.codePerformance.map((c) => {
                          const top = data.codePerformance[0]?.scans || 1;
                          return (
                            <tr key={c.id} className="group hover:bg-gray-50/70">
                              <td className="px-4 py-3 sm:px-5">
                                <button type="button" onClick={() => setQrId(c.id)} className="block max-w-[16rem] truncate text-left font-medium text-gray-900 hover:text-indigo-700">
                                  {c.name}
                                </button>
                                <span className="text-xs text-gray-400">
                                  {TYPE_LABELS[c.type] || c.type}
                                  {c.status === "DELETED" ? " · deleted" : c.status === "PAUSED" ? " · paused" : ""}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  <span className="w-12 font-semibold tabular-nums text-gray-900">{fmt(c.scans)}</span>
                                  <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 sm:block">
                                    <span className="block h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${Math.max(4, (c.scans / top) * 100)}%` }} />
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums text-gray-700">{fmt(c.unique)}</td>
                              <td className="px-3 py-3 text-right tabular-nums text-gray-700">{Math.round((c.scans / totals.scans) * 100)}%</td>
                              <td className="whitespace-nowrap px-3 py-3 text-right text-gray-500">{timeAgo(c.lastScanAt)}</td>
                              <td className="px-4 py-3 text-right sm:px-5">
                                {c.status !== "DELETED" && (
                                  <Link href={`/dashboard/qrs/${c.id}`} className="inline-flex items-center gap-1 text-xs font-semibold !text-indigo-600 hover:!text-indigo-800">
                                    Details
                                    <FaChevronRight className="h-2.5 w-2.5" />
                                  </Link>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}

          {staticCodes > 0 && !selectedCode && (
            <p className="flex items-start gap-2 text-xs text-gray-500">
              <FaInfoCircle className="mt-0.5 h-3 w-3 flex-none" />
              {staticCodes === 1 ? "1 of your codes is static" : `${staticCodes} of your codes are static`}: static codes hold their content
              directly, so their scans can't be counted. Only dynamic codes appear here.
            </p>
          )}
        </div>
      ) : null}
    </DashboardLayout>
  );
}
