import Head from "next/head";
import Link from "next/link";
import PublicLayout from "../components/PublicLayout";

export default function NotFoundPage() {
  return (
    <PublicLayout>
      <Head>
        <title>Page not found | QR-Genie</title>
      </Head>
      <div className="mx-auto w-full max-w-lg px-4 text-center sm:px-0">
        <p className="text-6xl font-bold tracking-tight text-indigo-600 tabular-nums">404</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">We can&apos;t find that page</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          The link may be old or mistyped. If you were scanning a QR code, ask its owner for a new one.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold !text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700"
          >
            Go to the home page
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold !text-gray-700 transition hover:bg-gray-50"
          >
            Open your dashboard
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
