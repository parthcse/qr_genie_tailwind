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

  return {
    redirect: {
      destination: qr.targetUrl,
      permanent: false,
    },
  };
}

export default function RedirectPage({ expired }) {
  if (!expired) return null;

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
          href="https://qr-genie.co"
          className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
        >
          Create your own QR codes
        </a>
      </div>
    </div>
  );
}
