// pages/r/[slug].js
import prisma from "../../lib/prisma";

function detectOS(ua = "") {
  const s = ua.toLowerCase();
  if (s.includes("iphone") || s.includes("ipad") || s.includes("ipod")) return "iOS";
  if (s.includes("android")) return "Android";
  if (s.includes("windows")) return "Windows";
  if (s.includes("mac os") || s.includes("macintosh")) return "macOS";
  if (s.includes("linux")) return "Linux";
  return "Other";
}

export async function getServerSideProps({ params, req }) {
  const { slug } = params;

  const qr = await prisma.qRCode.findUnique({
    where: { slug },
    include: { user: true },
  });

  if (!qr) return { notFound: true };

  if (qr.isActive === false) {
    return { props: { inactive: true } };
  }

  const user = qr.user;
  const now = new Date();

  let expired = false;
  if (
    user &&
    user.plan === "free" &&
    user.trialEndsAt &&
    user.trialEndsAt < now
  ) {
    expired = true;
  }

  if (expired) {
    return { props: { expired: true } };
  }

  // --- Log scan event ---
  const ua = req.headers["user-agent"] || "";
  const ipHeader = req.headers["x-forwarded-for"] || "";
  const ip =
    (typeof ipHeader === "string" && ipHeader.split(",")[0].trim()) ||
    req.socket?.remoteAddress ||
    null;

  const os = detectOS(ua);

  try {
    await prisma.scanEvent.create({
      data: {
        qrCodeId: qr.id,
        userAgent: ua || null,
        ip,
        os,
      },
    });
  } catch (e) {
    // don't block redirect on analytics errors
    console.error("ScanEvent create error:", e);
  }

  // Increment aggregate counter
  await prisma.qRCode.update({
    where: { slug },
    data: { scanCount: qr.scanCount + 1 },
  });

  // For WiFi QR codes, targetUrl contains the raw WiFi string
  // We'll show a page with WiFi connection info instead of redirecting
  if (qr.type === "wifi") {
    const meta = qr.meta ? JSON.parse(qr.meta) : {};
    return {
      props: {
        wifiInfo: {
          ssid: meta.ssid || "Wi-Fi Network",
          security: meta.security || "WPA",
          hidden: meta.hidden || false,
        },
      },
    };
  }

  // Ensure targetUrl exists and is valid
  if (!qr.targetUrl || qr.targetUrl.trim() === "") {
    console.error(`QR code ${qr.slug} has no targetUrl`);
    return {
      redirect: {
        destination: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "/",
        permanent: false,
      },
    };
  }

  // Validate that targetUrl is a proper URL
  let destinationUrl = qr.targetUrl.trim();
  
  // If targetUrl doesn't start with http:// or https://, add https://
  if (!destinationUrl.match(/^https?:\/\//i)) {
    destinationUrl = `https://${destinationUrl}`;
  }

  return {
    redirect: {
      destination: destinationUrl,
      permanent: false,
    },
  };
}

export default function RedirectPage({ expired, inactive, wifiInfo }) {
  if (inactive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold text-slate-900">
            This QR code is inactive or expired.
          </h1>
          <p className="mb-4 text-sm text-slate-600">
            It is no longer redirecting. Please contact the owner or upgrade to reactivate.
          </p>
          <a
            href={process.env.NEXT_PUBLIC_APP_URL || "/"}
            className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
          >
            Go to QR-Genie
          </a>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold text-slate-900">
            This QR code has expired
          </h1>
          <p className="mb-4 text-sm text-slate-600">
            The free 7-day access period for this QR code is over.
          </p>
          <a
            href={process.env.NEXT_PUBLIC_APP_URL || "/"}
            className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
          >
            Create your own QR codes
          </a>
        </div>
      </div>
    );
  }

  if (wifiInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-indigo-100 bg-white p-8 shadow-xl">
          {/* WiFi Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
          </div>
          
          {/* Question Text */}
          <div className="text-center mb-8">
            <p className="text-lg font-medium text-gray-900">
              Join the "{wifiInfo.ssid}" Wi-fi network?
            </p>
            {wifiInfo.hidden && (
              <p className="text-xs text-gray-500 mt-2">Hidden network</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Security: {wifiInfo.security}</p>
          </div>
          
          {/* Info Message */}
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800 text-center">
              Scan this QR code with your phone's camera to connect automatically.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              onClick={() => window.close()}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
