// pages/dashboard/analytics.js
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#0f172a", "#38bdf8", "#22c55e", "#f97316", "#e11d48"];

export default function AnalyticsPage() {
  const [days, setDays] = useState(7);
  const [selectedQrId, setSelectedQrId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const loadAnalytics = async (opts = {}) => {
    const d = opts.days ?? days;
    const qr = opts.qrId !== undefined ? opts.qrId : selectedQrId;

    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    params.set("days", String(d));
    if (qr) params.set("qrId", qr);

    const res = await fetch(`/api/analytics/overview?${params.toString()}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to load analytics.");
      setLoading(false);
      return;
    }

    const body = await res.json();
    setData(body);
    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDaysChange = (newDays) => {
    setDays(newDays);
    loadAnalytics({ days: newDays });
  };

  const handleQrChange = (e) => {
    const val = e.target.value;
    setSelectedQrId(val);
    loadAnalytics({ qrId: val });
  };

  const dailyData = data?.daily || [];
  const osData = data?.osStats || [];

  return (
    <DashboardLayout
      title="Analytics"
      description="See how your QR codes are performing over time."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Period</span>
          <div className="inline-flex rounded-full border border-slate-200 bg-white">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDaysChange(d)}
                className={[
                  "px-3 py-1 text-[11px] rounded-full",
                  days === d
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100",
                ].join(" ")}
              >
                Last {d} days
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-600">QR code</span>
          <select
            value={selectedQrId}
            onChange={handleQrChange}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-900 outline-none hover:border-slate-300 focus:border-slate-900"
          >
            <option value="">All QR codes</option>
            {(data?.qrCodes || []).map((q) => (
              <option key={q.id} value={q.id}>
                {q.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="mb-3 text-[11px] text-red-500">
          {error}
        </p>
      )}

      {loading && !data && (
        <p className="text-[11px] text-slate-600">Loading analytics…</p>
      )}

      {data && (
        <div className="space-y-4">
          {/* Top summary cards */}
          <div className="grid gap-3 md:grid-cols-3 text-[11px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-slate-500">Total QR codes</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {data.totalQrCodes}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-slate-500">Total scans</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {data.totalScans}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-slate-500">Average scans / day</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {dailyData.length
                  ? (data.totalScans / dailyData.length).toFixed(1)
                  : 0}
              </p>
            </div>
          </div>

          {/* Main chart + OS pie */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-[11px] font-medium text-slate-800">
                QR code scan activity
              </p>
              {dailyData.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  No scans recorded in this period yet.
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#0f172a"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-[11px] font-medium text-slate-800">
                Scans by operating system
              </p>
              {osData.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  No data yet.
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={osData}
                        dataKey="count"
                        nameKey="os"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                      >
                        {osData.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.os}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
