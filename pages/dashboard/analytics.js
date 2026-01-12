// pages/dashboard/analytics.js
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

const COLORS = ["#0f172a", "#38bdf8", "#22c55e", "#f97316", "#e11d48", "#8b5cf6", "#ec4899", "#14b8a6"];

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
  const hourlyData = data?.hourly || [];
  const osData = data?.osStats || [];
  const deviceData = data?.deviceStats || [];
  const countryData = data?.countryStats || [];
  const cityData = data?.cityStats || [];
  const qrPerformance = data?.qrPerformance || [];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatHour = (hour) => {
    return `${hour}:00`;
  };

  const averageScansPerDay = dailyData.length
    ? (data?.totalScans / dailyData.length).toFixed(1)
    : 0;

  return (
    <DashboardLayout
      title="Analytics"
      description="Track and analyze your QR code performance in real-time."
    >
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Time Period</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white shadow-sm">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDaysChange(d)}
                className={[
                  "px-4 py-1.5 text-xs font-medium transition-colors",
                  days === d
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">QR Code</span>
          <select
            value={selectedQrId}
            onChange={handleQrChange}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
          >
            <option value="">All QR Codes</option>
            {(data?.qrCodes || []).map((q) => (
              <option key={q.id} value={q.id}>
                {q.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-medium text-red-800">{error}</p>
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-600">Loading analytics data...</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Scans</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {data.totalScans.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-100 p-3">
                  <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Unique Scans</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {data.uniqueScans?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-100 p-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Avg. Scans/Day</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {averageScansPerDay}
                  </p>
                </div>
                <div className="rounded-lg bg-green-100 p-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Total QR Codes</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {data.totalQrCodes}
                  </p>
                </div>
                <div className="rounded-lg bg-purple-100 p-3">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1: Daily Activity & Hourly Distribution */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Scan Activity Over Time</h3>
              {dailyData.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-xs text-slate-500">No scans recorded in this period.</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickFormatter={formatDate}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        labelFormatter={(label) => formatDate(label)}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#0f172a"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#0f172a" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Scans by Hour of Day</h3>
              {hourlyData.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-xs text-slate-500">No hourly data available.</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickFormatter={formatHour}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        labelFormatter={(label) => formatHour(label)}
                      />
                      <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Charts Row 2: OS & Device Distribution */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Scans by Operating System</h3>
              {osData.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-xs text-slate-500">No OS data available.</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={osData}
                        dataKey="count"
                        nameKey="os"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        label={({ os, percent }) => `${os} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {osData.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.os}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Scans by Device Type</h3>
              {deviceData.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-xs text-slate-500">No device data available.</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deviceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis
                        dataKey="device"
                        type="category"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" fill="#0f172a" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Geographic Data */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Top Countries</h3>
              {countryData.length === 0 ? (
                <p className="text-xs text-slate-500">No country data available.</p>
              ) : (
                <div className="space-y-3">
                  {countryData.map((item, index) => {
                    const percentage = ((item.count / data.totalScans) * 100).toFixed(1);
                    return (
                      <div key={item.country} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">
                            {index + 1}. {item.country}
                          </span>
                          <span className="text-slate-600">
                            {item.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-900 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Top Cities</h3>
              {cityData.length === 0 ? (
                <p className="text-xs text-slate-500">No city data available.</p>
              ) : (
                <div className="space-y-3">
                  {cityData.map((item, index) => {
                    const percentage = ((item.count / data.totalScans) * 100).toFixed(1);
                    return (
                      <div key={item.city} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">
                            {index + 1}. {item.city}
                          </span>
                          <span className="text-slate-600">
                            {item.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-900 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* QR Code Performance Table */}
          {qrPerformance.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">QR Code Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-3 text-left font-semibold text-slate-700">Rank</th>
                      <th className="pb-3 text-left font-semibold text-slate-700">QR Code Name</th>
                      <th className="pb-3 text-right font-semibold text-slate-700">Total Scans</th>
                      <th className="pb-3 text-right font-semibold text-slate-700">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qrPerformance.map((item, index) => {
                      const percentage = ((item.scans / data.totalScans) * 100).toFixed(1);
                      return (
                        <tr key={item.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 text-slate-600">#{index + 1}</td>
                          <td className="py-3 font-medium text-slate-900">{item.name}</td>
                          <td className="py-3 text-right text-slate-600">{item.scans.toLocaleString()}</td>
                          <td className="py-3 text-right text-slate-600">{percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
