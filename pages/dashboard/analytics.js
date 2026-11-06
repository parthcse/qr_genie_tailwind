// pages/dashboard/analytics.js
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { QR_TYPES } from "@/lib/qr/qrTypes";
import { AnimatedBar, BarList, CountUp, SegmentedControl, countryName } from "@/components/dashboard/DashboardUi";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useReducedMotion } from "motion/react";
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
  const { getUserFromRequest, accountRedirect } = await import("@/lib/auth");
  const user = await getUserFromRequest(context.req);
  // Signed out -> login; email not confirmed yet -> verification page
  const redirect = accountRedirect(user);
  if (redirect) return redirect;
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
// Charts take colours as plain values: these are brand.primary.light and brand.secondary.light from tailwind.config.js and tints
const SCANS_COLOR = "#6366f1";
const UNIQUE_COLOR = "#a855f7";
const AXIS_COLOR = "#64748b";
const GRID_COLOR = "rgba(99, 102, 241, 0.1)";
const DEVICE_COLORS = { Mobile: SCANS_COLOR, Desktop: UNIQUE_COLOR, Tablet: "#0ea5e9", Unknown: "#cbd5e1" };
const TYPE_LABELS = Object.fromEntries(QR_TYPES.map((type) => [type.id, type.label]));

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

function Card({ title, icon: Icon, action, children, className = "", order = 0 }) {
  return (
    <section className={`glass dash-rise rounded-2xl p-4 sm:p-5 ${className}`} style={{ "--i": order }}>
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

function Trend({ trend }) {
  if (!trend) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
        trend.tone === "up" ? "bg-emerald-50 text-emerald-700" : trend.tone === "down" ? "bg-rose-50 text-rose-700" : "bg-indigo-950/[0.06] text-gray-600"
      }`}
    >
      {trend.tone === "up" && <FaArrowUp className="h-2.5 w-2.5" />}
      {trend.tone === "down" && <FaArrowDown className="h-2.5 w-2.5" />}
      {trend.label}
    </span>
  );
}

/** One of the smaller numbers beside the headline number */
function Metric({ icon: Icon, iconClass, label, value, sub, trend }) {
  return (
    <div className="group flex min-w-0 cursor-pointer items-start gap-3 rounded-xl p-2 transition hover:bg-white/60">
      <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transform-none ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-600">{label}</p>
        <p className="truncate font-sans text-lg font-bold leading-tight text-gray-900">{value}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-gray-600">
          <Trend trend={trend} />
          {sub && <span className="truncate">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong dash-tooltip rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-gray-900">{dayLabel(label, true)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-gray-600">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold tabular-nums text-gray-900">{fmt(p.value)}</span>
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
                <span className="pr-2 text-right text-[11px] leading-5 text-gray-600">{WEEKDAYS[d]}</span>
                {row.map((count, h) => (
                  <span
                    key={h}
                    title={`${WEEKDAYS[d]} ${hourLabel(h)}: ${count} scan${count === 1 ? "" : "s"}`}
                    className="h-5 cursor-pointer rounded-[4px] transition-transform duration-150 hover:scale-125 motion-reduce:transform-none"
                    style={{ background: count ? `rgba(99, 102, 241, ${0.15 + 0.85 * (count / max)})` : "rgba(79, 70, 229, 0.05)" }}
                  />
                ))}
              </div>
            ))}
            <span />
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="text-center text-[10px] text-gray-600">
                {h % 3 === 0 ? hourLabel(h).replace(" ", "") : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
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
    <div className="space-y-4" aria-label="Loading analytics">
      <div className="glass grid gap-6 rounded-3xl p-4 sm:p-6 xl:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="dash-skeleton h-16" />
          <div className="dash-skeleton h-14" />
          <div className="dash-skeleton h-14" />
          <div className="dash-skeleton h-14" />
        </div>
        <div className="dash-skeleton h-72" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <div className="dash-skeleton h-52" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage({ initialQrId }) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  // Each new set of numbers redraws the chart from the left
  const [chartVersion, setChartVersion] = useState(0);
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
        setChartVersion((version) => version + 1);
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
  const hasNoCodes = !!data && (data.qrCodes || []).length === 0;

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
        hasNoCodes ? null : (
        <button
          type="button"
          onClick={exportCsv}
          disabled={!data || !totals?.scans}
          aria-label="Export CSV"
          className="btn-shine btn-shine-soft dash-field inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
        >
          <FaDownload className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
        )
      }
    >
      {/* Filters */}
      {!hasNoCodes && (
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <SegmentedControl
          label="Time period"
          className="w-full sm:w-auto"
          options={PERIODS.map((p) => ({ value: p.days, label: p.label }))}
          value={days}
          onChange={setDays}
        />
        <label className="relative inline-flex w-full sm:w-72">
          <span className="sr-only">QR code</span>
          <FaQrcode className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <select
            value={qrId}
            onChange={(e) => setQrId(e.target.value)}
            className="dash-field h-10 w-full cursor-pointer appearance-none truncate rounded-xl pl-9 pr-9 text-sm font-medium text-gray-700 transition hover:border-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
          <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
        </label>
      </div>
      )}

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
      ) : hasNoCodes ? (
        <div className="glass dash-rise rounded-3xl px-6 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
            <FaChartLine className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-gray-900">No QR codes yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-600">Create a dynamic QR code and its scans will show up here.</p>
          <Link
            href="/dashboard/create-qr"
            className="btn-shine mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold !text-white shadow-lg shadow-indigo-500/25"
          >
            <FaPlus className="h-3.5 w-3.5" />
            Create your first QR code
          </Link>
        </div>
      ) : data ? (
        <div className={`space-y-4 transition-opacity duration-300 ${loading ? "opacity-60" : ""}`}>
          {/* The headline: total scans beside their line, with the other numbers under it */}
          <section className="glass dash-rise grid gap-5 rounded-3xl p-4 sm:p-6 xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-8" style={{ "--i": 0 }}>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-600">Total scans</p>
              <p className="mt-1 font-sans text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                <CountUp value={totals.scans} format={fmt} />
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <Trend trend={trendOf(totals.scans, totals.previousScans)} />
                <span>{trendOf(totals.scans, totals.previousScans) ? previousLabel : `in the last ${period.label}`}</span>
              </div>
              <div className="-mx-2 mt-4 grid grid-cols-1 gap-1 border-t border-indigo-950/[0.06] pt-3 sm:grid-cols-3 xl:grid-cols-1">
                <Metric
                  icon={FaUsers}
                  iconClass="bg-sky-100/80 text-sky-700"
                  label="Unique scanners"
                  value={<CountUp value={totals.unique} format={fmt} />}
                  trend={trendOf(totals.unique, totals.previousUnique)}
                  sub={trendOf(totals.unique, totals.previousUnique) ? previousLabel : "different people"}
                />
                <Metric
                  icon={FaCalendarDay}
                  iconClass="bg-emerald-100/80 text-emerald-700"
                  label="Daily average"
                  value={<CountUp value={totals.scans / days} decimals={1} format={(n) => n.toLocaleString("en-US", { maximumFractionDigits: 1 })} />}
                  sub="scans per day"
                />
                <Metric
                  icon={FaFire}
                  iconClass="bg-amber-100/80 text-amber-700"
                  label="Busiest day"
                  value={totals.busiestDay ? dayLabel(totals.busiestDay.date) : "—"}
                  sub={totals.busiestDay ? `${fmt(totals.busiestDay.scans)} scans` : "no scans yet"}
                />
              </div>
            </div>

            {totals.scans === 0 ? (
              <div className="flex min-h-[16rem] min-w-0 flex-col items-center justify-center rounded-2xl bg-white/40 px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FaChartLine className="h-5 w-5" />
                </span>
                <h2 className="mt-4 font-semibold text-gray-900">No scans in the last {period.label}</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">
                  {selectedCode?.linkType === "STATIC"
                    ? "This is a static code: it holds its content directly, so its scans can't be counted."
                    : "Once people scan your dynamic codes, you'll see when, where and on which devices here. Try a longer period, or scan one of your codes with your phone to test."}
                </p>
              </div>
            ) : (
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-gray-900">{longRange ? "Scans per week" : "Scans per day"}</h2>
                  <span className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: SCANS_COLOR }} />
                      Scans
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: UNIQUE_COLOR }} />
                      Unique scanners
                    </span>
                  </span>
                </div>
                <div className="h-64 sm:h-72 xl:h-[22rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart key={chartVersion} data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scansFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SCANS_COLOR} stopOpacity={0.32} />
                          <stop offset="100%" stopColor={SCANS_COLOR} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke={GRID_COLOR} />
                      <XAxis dataKey="date" tickFormatter={(v) => dayLabel(v)} tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={false} tickLine={false} minTickGap={28} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#c7d2fe" }} animationDuration={160} isAnimationActive={!reducedMotion} />
                      <Area
                        type="monotone"
                        dataKey="scans"
                        name="Scans"
                        stroke={SCANS_COLOR}
                        strokeWidth={2.5}
                        fill="url(#scansFill)"
                        activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                        isAnimationActive={!reducedMotion}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      />
                      <Area
                        type="monotone"
                        dataKey="unique"
                        name="Unique scanners"
                        stroke={UNIQUE_COLOR}
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        fill="none"
                        activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                        isAnimationActive={!reducedMotion}
                        animationDuration={1200}
                        animationBegin={150}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </section>

          {totals.scans > 0 && (
            <>
              {/* Devices, systems, browsers */}
              <div className="grid gap-4 lg:grid-cols-3">
                <Card title="Devices" icon={FaMobileAlt} order={1}>
                  <div className="flex flex-col items-center gap-5">
                    <div className="relative h-36 w-36 flex-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            key={chartVersion}
                            data={data.devices}
                            dataKey="count"
                            nameKey="name"
                            innerRadius="72%"
                            outerRadius="100%"
                            paddingAngle={2}
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                            isAnimationActive={!reducedMotion}
                            animationDuration={1000}
                          >
                            {data.devices.map((d) => (
                              <Cell key={d.name} fill={DEVICE_COLORS[d.name] || "#94a3b8"} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <CountUp value={deviceTotal} format={fmt} className="text-lg font-bold text-gray-900" />
                        <span className="text-xs text-gray-600">scans</span>
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
                <Card title="Operating systems" order={2}>
                  <BarList items={data.operatingSystems} total={totals.scans} color="bg-indigo-500" />
                </Card>
                <Card title="Browsers" order={3}>
                  <BarList items={data.browsers} total={totals.scans} color="bg-purple-500" />
                </Card>
              </div>

              {/* Where */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card title="Top countries" icon={FaGlobeAmericas} order={4}>
                  <BarList items={data.countries} total={totals.scans} formatName={countryName} color="bg-sky-500" />
                </Card>
                <Card title="Top cities" icon={FaGlobeAmericas} order={5}>
                  <BarList items={data.cities} total={totals.scans} formatName={cityName} color="bg-emerald-500" />
                </Card>
              </div>

              {/* When */}
              <Card title="When people scan" icon={FaClock} order={6}>
                <Heatmap grid={data.heatmap} />
              </Card>

              {/* Per code */}
              {!qrId && (
                <Card title="QR code performance" icon={FaQrcode} order={7}>
                  <div className="-mx-4 overflow-x-auto sm:-mx-5">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="border-b border-indigo-950/[0.06] text-left text-xs font-medium text-gray-600">
                          <th className="px-4 pb-3 font-medium sm:px-5">QR code</th>
                          <th className="px-3 pb-3 font-medium">Scans</th>
                          <th className="px-3 pb-3 text-right font-medium">Unique</th>
                          <th className="px-3 pb-3 text-right font-medium">Share</th>
                          <th className="px-3 pb-3 text-right font-medium">Last scan</th>
                          <th className="px-4 pb-3 sm:px-5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-950/[0.05]">
                        {data.codePerformance.map((c) => {
                          const top = data.codePerformance[0]?.scans || 1;
                          return (
                            <tr key={c.id} className="group transition-colors hover:bg-white/60">
                              <td className="px-4 py-3 sm:px-5">
                                <button type="button" onClick={() => setQrId(c.id)} className="block max-w-[16rem] truncate text-left font-medium text-gray-900 hover:text-indigo-700">
                                  {c.name}
                                </button>
                                <span className="text-xs text-gray-600">
                                  {TYPE_LABELS[c.type] || c.type}
                                  {c.status === "DELETED" ? " · deleted" : c.status === "PAUSED" ? " · paused" : ""}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  <span className="w-12 font-semibold tabular-nums text-gray-900">{fmt(c.scans)}</span>
                                  <AnimatedBar percent={Math.max(4, (c.scans / top) * 100)} className="bg-gradient-to-r from-indigo-500 to-purple-500" trackClassName="hidden h-1.5 w-24 bg-indigo-950/[0.06] sm:block" />
                                </div>
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums text-gray-700">{fmt(c.unique)}</td>
                              <td className="px-3 py-3 text-right tabular-nums text-gray-700">{Math.round((c.scans / totals.scans) * 100)}%</td>
                              <td className="whitespace-nowrap px-3 py-3 text-right text-gray-600">{timeAgo(c.lastScanAt)}</td>
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
            <p className="flex items-start gap-2 text-xs text-gray-600">
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
