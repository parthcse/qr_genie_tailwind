import { useEffect, useState } from "react";
import { useRouter } from "next/router";

/**
 * The site's loading look: shimmering outlines shaped like the page that's coming. Plain markup and CSS (.site-skeleton,
 * .dash-skeleton in styles/globals.css), because RouteSkeleton is on every page of the site.
 * - RouteSkeleton (pages/_app.js) covers the page while moving to another one.
 * - DashboardLayout shows DashboardContentSkeleton in its content area when moving between dashboard pages.
 * - Pages use the *Skeleton parts below while their own data loads, so the outline carries on seamlessly.
 */

// Waits this long before showing anything, so quick page changes don't flash a skeleton
const SHOW_AFTER_MS = 120;

export const SIDEBAR_PIN_KEY = "qrgenie.sidebarPinned";

const pathOf = (url) => url.split(/[?#]/)[0] || "/";
const isDashboard = (path) => path === "/dashboard" || path.startsWith("/dashboard/");

/** The address being moved to, once it has taken longer than a moment; otherwise null */
export function useRouteTarget() {
  const router = useRouter();
  const [target, setTarget] = useState(null);
  useEffect(() => {
    let timer;
    const start = (url, { shallow } = {}) => {
      if (shallow) return;
      clearTimeout(timer);
      timer = setTimeout(() => setTarget(pathOf(url)), SHOW_AFTER_MS);
    };
    const stop = () => {
      clearTimeout(timer);
      setTarget(null);
    };
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", stop);
    router.events.on("routeChangeError", stop);
    return () => {
      clearTimeout(timer);
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", stop);
      router.events.off("routeChangeError", stop);
    };
  }, [router.events]);
  return target;
}

const repeat = (count) => Array.from({ length: count }, (_, i) => i);
const G = ({ className = "" }) => <div className={`dash-skeleton ${className}`} />;
const P = ({ className = "" }) => <div className={`site-skeleton ${className}`} />;

/* ---- Dashboard: bones on glass ---- */

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading analytics">
      <div className="glass grid gap-5 rounded-3xl p-4 sm:p-6 xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-8">
        <div>
          <G className="h-4 w-24 !rounded" />
          <G className="mt-3 h-14 w-44 !rounded-xl" />
          <G className="mt-3 h-4 w-40 !rounded" />
          <div className="mt-5 grid gap-4 border-t border-indigo-950/[0.06] pt-4 sm:grid-cols-3 xl:grid-cols-1">
            {repeat(3).map((i) => (
              <div key={i} className="flex items-center gap-3">
                <G className="h-9 w-9 flex-none !rounded-xl" />
                <div className="flex-1 space-y-2">
                  <G className="h-3 w-20 !rounded" />
                  <G className="h-5 w-14 !rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <G className="h-64 sm:h-72 xl:h-[22rem]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass flex flex-col items-center gap-4 rounded-2xl p-5">
          <G className="h-4 w-24 self-start !rounded" />
          <G className="h-32 w-32 !rounded-full" />
        </div>
        {repeat(2).map((i) => (
          <div key={i} className="glass space-y-4 rounded-2xl p-5">
            <G className="h-4 w-32 !rounded" />
            {repeat(4).map((row) => (
              <div key={row} className="space-y-2">
                <G className="h-3 w-full !rounded" />
                <G className="h-1.5 w-full !rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterBones() {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <G className="h-10 w-full !rounded-[0.625rem] sm:w-80" />
      <G className="h-10 w-full !rounded-xl sm:w-72" />
    </div>
  );
}

export function CodeRowSkeleton() {
  return (
    <li className="glass flex items-center gap-4 rounded-2xl p-5">
      <G className="h-[82px] w-[82px] flex-none !rounded-lg" />
      <div className="min-w-0 flex-1 space-y-3">
        <G className="h-3 w-40 !rounded" />
        <G className="h-4 w-56 max-w-full !rounded" />
        <G className="h-3 w-72 max-w-full !rounded" />
      </div>
      <G className="hidden h-9 w-40 flex-none !rounded-xl sm:block" />
    </li>
  );
}

export function CodesSkeleton() {
  return (
    <div role="status" aria-label="Loading QR codes">
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {repeat(4).map((i) => (
          <div key={i} className="glass flex items-start justify-between gap-3 rounded-2xl p-4 sm:p-5">
            <div className="flex-1 space-y-2.5">
              <G className="h-3 w-20 !rounded" />
              <G className="h-8 w-16 !rounded-lg" />
              <G className="h-3 w-28 max-w-full !rounded" />
            </div>
            <G className="h-10 w-10 flex-none !rounded-xl" />
          </div>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {["w-36", "w-44", "w-40", "w-32"].map((width) => (
          <G key={width} className={`h-10 !rounded-xl ${width}`} />
        ))}
      </div>
      <div className="glass mb-4 flex flex-col gap-3 rounded-2xl p-3 xl:flex-row">
        <G className="h-10 flex-1 !rounded-xl" />
        <G className="h-10 !rounded-xl xl:w-[34rem]" />
      </div>
      <ul className="space-y-3">
        {repeat(4).map((i) => (
          <CodeRowSkeleton key={i} />
        ))}
      </ul>
    </div>
  );
}

function PhoneBones() {
  return <G className="mx-auto aspect-[320/693] w-full max-w-[16rem] !rounded-[2.5rem]" />;
}

export function CreateSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]" role="status" aria-label="Loading">
      <div className="min-w-0 space-y-4">
        <div className="glass grid grid-cols-3 gap-1.5 rounded-2xl p-1.5">
          {repeat(3).map((i) => (
            <G key={i} className="h-14 !rounded-xl" />
          ))}
        </div>
        <div className="glass dash-type-box rounded-2xl p-3 sm:p-4">
          <G className="h-5 w-64 max-w-full !rounded" />
          <div className="dash-type-grid mt-3">
            {repeat(20).map((i) => (
              <G key={i} className="!rounded-xl" />
            ))}
          </div>
        </div>
      </div>
      <div className="glass hidden rounded-2xl p-4 lg:block lg:w-[19rem]">
        <PhoneBones />
        <G className="mt-3 h-10 !rounded-xl" />
      </div>
    </div>
  );
}

export function DetailsSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:items-start" role="status" aria-label="Loading">
      <div className="min-w-0 space-y-4">
        <div className="glass space-y-4 rounded-2xl p-4 sm:p-6">
          <G className="h-5 w-24 !rounded" />
          <div className="grid grid-cols-2 gap-4">
            {repeat(8).map((i) => (
              <div key={i} className="space-y-2">
                <G className="h-3 w-14 !rounded" />
                <G className="h-4 w-24 max-w-full !rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="glass space-y-3 rounded-2xl p-4 sm:p-6">
          <G className="h-5 w-36 !rounded" />
          <G className="h-4 w-full !rounded" />
        </div>
      </div>
      <div className="min-w-0 space-y-4">
        <G className="h-10 w-64 !rounded-[0.625rem]" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {repeat(3).map((i) => (
            <div key={i} className="glass space-y-3 rounded-2xl p-4 sm:p-5">
              <G className="h-3 w-20 !rounded" />
              <G className="h-8 w-16 !rounded-lg" />
            </div>
          ))}
        </div>
        <div className="glass rounded-2xl p-4 sm:p-6">
          <G className="h-64 sm:h-72" />
        </div>
      </div>
    </div>
  );
}

export function BillingSkeleton() {
  return (
    <div className="w-full space-y-10" role="status" aria-label="Loading">
      <div className="glass space-y-4 rounded-3xl p-6 sm:p-8">
        <G className="h-6 w-20 !rounded-full" />
        <G className="h-10 w-56 !rounded-xl" />
        <G className="h-4 w-96 max-w-full !rounded" />
        <div className="grid gap-5 border-t border-indigo-950/[0.08] pt-6 sm:grid-cols-3">
          {repeat(3).map((i) => (
            <div key={i} className="space-y-2">
              <G className="h-3 w-16 !rounded" />
              <G className="h-5 w-28 !rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
        {repeat(3).map((i) => (
          <div key={i} className="glass space-y-4 rounded-3xl p-7">
            <G className="h-6 w-24 !rounded-lg" />
            <G className="h-12 w-36 !rounded-xl" />
            <G className="h-4 w-44 max-w-full !rounded" />
            <G className="mt-8 h-12 !rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AccountSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading your account">
      <G className="h-10 w-full !rounded-[0.625rem] sm:w-96" />
      <div className="glass rounded-2xl p-4 sm:p-7">
        <div className="flex items-center gap-4">
          <G className="h-11 w-11 flex-none !rounded-xl" />
          <div className="flex-1 space-y-2">
            <G className="h-5 w-48 !rounded" />
            <G className="h-3 w-72 max-w-full !rounded" />
          </div>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {repeat(6).map((i) => (
            <div key={i} className="space-y-2">
              <G className="h-3 w-20 !rounded" />
              <G className="h-11 !rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The content area of a dashboard page, by its address */
export function DashboardContentSkeleton({ path }) {
  if (path.startsWith("/dashboard/analytics")) {
    return (
      <>
        <FilterBones />
        <AnalyticsSkeleton />
      </>
    );
  }
  if (path.startsWith("/dashboard/create-qr")) return <CreateSkeleton />;
  if (path.startsWith("/dashboard/qrs")) return <DetailsSkeleton />;
  if (path.startsWith("/dashboard/billing")) return <BillingSkeleton />;
  if (path.startsWith("/dashboard/account")) return <AccountSkeleton />;
  return <CodesSkeleton />;
}

/** A whole dashboard page, when arriving from outside the dashboard (after logging in, say) */
function DashboardPageSkeleton({ path }) {
  let pinned = false;
  try {
    pinned = window.localStorage.getItem(SIDEBAR_PIN_KEY) === "1";
  } catch {
    // Blocked storage only means the sidebar is drawn closed
  }
  return (
    <>
      <div className="dash-backdrop" aria-hidden="true">
        <span className="dash-finder dash-finder-a" />
        <span className="dash-finder dash-finder-b" />
        <span className="dash-finder dash-finder-c" />
      </div>
      <div className="dash-rail glass hidden flex-col gap-2 px-2 py-3 md:flex" data-open={pinned}>
        <G className="mx-2 h-10 w-10 flex-none !rounded-xl" />
        {repeat(6).map((i) => (
          <G key={i} className="mx-2 mt-1 h-10 w-10 flex-none !rounded-xl" />
        ))}
      </div>
      <div className="dash-main" data-pinned={pinned}>
        <div className="glass flex h-16 items-center gap-3 px-4 sm:px-6 md:mt-3 md:rounded-xl md:px-4">
          <div className="flex-1 space-y-2">
            <G className="h-4 w-40 !rounded" />
            <G className="hidden h-3 w-72 max-w-full !rounded lg:block" />
          </div>
          <G className="h-10 w-10 !rounded-xl sm:w-32" />
          <G className="h-9 w-9 !rounded-full" />
        </div>
        <div className="px-4 pt-4 sm:px-6 md:px-0 md:pt-3">
          <DashboardContentSkeleton path={path} />
        </div>
      </div>
    </>
  );
}

/* ---- Public pages: bones on white ---- */

function PublicHeaderBones() {
  return (
    <div className="border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-site items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
        <P className="h-10 w-40 !rounded-xl" />
        <div className="hidden items-center gap-6 lg:flex">
          {repeat(7).map((i) => (
            <P key={i} className="h-3.5 w-16 !rounded" />
          ))}
        </div>
        <P className="h-10 w-24 !rounded-xl" />
      </div>
    </div>
  );
}

const container = "mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8";

function TextBones({ lines = 3 }) {
  return (
    <div className="space-y-3">
      {repeat(lines).map((i) => (
        <P key={i} className={`h-3.5 !rounded ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

function BannerBones() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 sm:py-16">
      <div className={container}>
        <P className="h-11 w-3/4 max-w-2xl !rounded-xl" />
        <P className="mt-4 h-5 w-1/2 max-w-md !rounded-lg" />
      </div>
    </div>
  );
}

function CardsBones({ count = 3, columns = "sm:grid-cols-2 lg:grid-cols-3" }) {
  return (
    <div className={`${container} py-10 sm:py-14`}>
      <div className={`grid gap-5 ${columns}`}>
        {repeat(count).map((i) => (
          <div key={i} className="rounded-2xl p-5 ring-1 ring-slate-100 sm:p-6">
            <P className="h-11 w-11 !rounded-xl" />
            <P className="mt-5 h-5 w-2/3 !rounded" />
            <div className="mt-4">
              <TextBones />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeBones() {
  return (
    <div className={`${container} grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20`}>
      <div>
        <P className="h-7 w-48 !rounded-full" />
        <P className="mt-6 h-14 w-full max-w-xl !rounded-xl" />
        <P className="mt-3 h-14 w-4/5 max-w-lg !rounded-xl" />
        <P className="mt-6 h-5 w-3/4 max-w-md !rounded-lg" />
        <div className="mt-8 flex gap-3">
          <P className="h-12 w-40 !rounded-xl" />
          <P className="h-12 w-36 !rounded-xl" />
        </div>
      </div>
      <P className="mx-auto hidden aspect-[320/693] w-64 !rounded-[2.5rem] lg:block" />
    </div>
  );
}

function ArticleBones() {
  return (
    <>
      <BannerBones />
      <div className={`${container} grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_18rem]`}>
        <div>
          <P className="aspect-[16/8] w-full !rounded-2xl" />
          <div className="mt-8">
            <TextBones lines={6} />
          </div>
        </div>
        <div className="hidden space-y-4 lg:block">
          <P className="h-44" />
          <P className="h-44" />
        </div>
      </div>
    </>
  );
}

function DocumentBones() {
  return (
    <>
      <BannerBones />
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        {repeat(3).map((i) => (
          <div key={i}>
            <P className="mb-4 h-6 w-1/2 !rounded" />
            <TextBones lines={4} />
          </div>
        ))}
      </div>
    </>
  );
}

function FormBones() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-20">
      <P className="h-9 w-2/3 !rounded-lg" />
      <P className="mt-3 h-4 w-full !rounded" />
      <div className="mt-8 space-y-5">
        {repeat(3).map((i) => (
          <div key={i} className="space-y-2">
            <P className="h-3 w-20 !rounded" />
            <P className="h-11 !rounded-xl" />
          </div>
        ))}
        <P className="h-12 !rounded-xl" />
      </div>
    </div>
  );
}

function PublicPageSkeleton({ path }) {
  let body;
  if (path === "/") body = <HomeBones />;
  else if (path.startsWith("/auth/")) body = <FormBones />;
  else if (path === "/pricing") {
    body = (
      <>
        <BannerBones />
        <CardsBones columns="md:grid-cols-3" />
      </>
    );
  } else if (/^\/blog\/(?!page\/|category\/)/.test(path)) body = <ArticleBones />;
  else if (path === "/blog" || path.startsWith("/blog/")) {
    body = (
      <>
        <BannerBones />
        <CardsBones count={8} columns="sm:grid-cols-2 lg:grid-cols-4" />
      </>
    );
  } else if (["/privacy", "/terms", "/refund-policy"].includes(path)) body = <DocumentBones />;
  else if (path === "/contact") body = <FormBones />;
  else {
    body = (
      <>
        <BannerBones />
        <CardsBones count={6} />
      </>
    );
  }
  return (
    <>
      <PublicHeaderBones />
      {body}
    </>
  );
}

/** Covers the page while moving to another one, keeping the old page underneath in case the move fails */
export default function RouteSkeleton() {
  const router = useRouter();
  const target = useRouteTarget();
  if (!target) return null;
  const toDashboard = isDashboard(target);
  // Between dashboard pages the sidebar and top bar stay: DashboardLayout shows the outline in its content area
  if (toDashboard && isDashboard(router.pathname)) return null;
  return (
    <div
      data-route-skeleton
      role="status"
      aria-label="Loading page"
      className={`fixed inset-0 z-[80] overflow-hidden motion-safe:animate-fade-in ${toDashboard ? "dash-shell" : "bg-white"}`}
    >
      {toDashboard ? <DashboardPageSkeleton path={target} /> : <PublicPageSkeleton path={target} />}
    </div>
  );
}
