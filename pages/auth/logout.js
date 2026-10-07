// pages/auth/logout.js
import { useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { FaLock, FaHome, FaSignInAlt } from 'react-icons/fa';
import PublicLayout from '@/components/layout/PublicLayout';

export default function LogoutPage() {
  // Clear any remaining client-side auth state
  useEffect(() => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  }, []);

  return (
    <PublicLayout>
      <Head>
        <title>Logged Out | QR-Genie</title>
        <meta name="description" content="You have been successfully logged out of QR-Genie" />
      </Head>

      <div className="mx-auto w-full max-w-md px-4 sm:px-0">
        <div className="rounded-2xl border border-indigo-100 bg-white/90 px-6 py-10 text-center shadow-xl sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
            <FaLock className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">You&apos;ve been logged out</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Your session has ended. You can close this window or log in again.
          </p>

          <div className="mt-8 space-y-3">
            <Link
              href="/auth/login"
              className="btn-shine flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold !text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
            >
              <FaSignInAlt className="h-4 w-4" />
              Log in again
            </Link>
            <Link
              href="/"
              className="btn-shine btn-shine-soft flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold !text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-200"
            >
              <FaHome className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
