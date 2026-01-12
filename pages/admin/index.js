
import { useEffect, useState } from "react";

export default function Admin() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/summary");
      if (res.status === 403 || res.status === 401) {
        alert("You must be an admin to view this page.");
        window.location.href = "/";
        return;
      }
      const json = await res.json();
      setData(json);
    };
    load();
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <p className="text-[11px]">Loading admin dashboard…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-2xl border border-slate-300 text-[10px] font-semibold">
              QR
            </div>
            <span className="text-xs font-semibold tracking-tight">QR-Genie Admin</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <section className="mb-8 grid gap-4 text-xs sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-1 text-[11px] text-slate-500">Users</p>
            <p className="text-xl font-semibold">{data.users}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-1 text-[11px] text-slate-500">QR codes</p>
            <p className="text-xl font-semibold">{data.qrCodes}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-1 text-[11px] text-slate-500">Total scans</p>
            <p className="text-xl font-semibold">{data.totalScans}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Latest QR codes</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white text-[11px]">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-3 py-2 font-medium text-slate-600">Slug</th>
                  <th className="px-3 py-2 font-medium text-slate-600">User</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Destination</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Scans</th>
                </tr>
              </thead>
              <tbody>
                {data.latestQrs.map((qr) => (
                  <tr
                    key={qr.id}
                    className="border-t border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                  >
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-700">
                      {qr.slug}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-700">
                      {qr.user?.email || "—"}
                    </td>
                    <td className="px-3 py-2 max-w-xs truncate text-[11px] text-slate-700">
                      {qr.targetUrl}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-700">
                      {qr.scanCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
