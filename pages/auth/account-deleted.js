import { useEffect } from "react";
import Link from "next/link";
import { FaCheck, FaHome, FaUserPlus } from "react-icons/fa";
import PublicLayout from "@/components/layout/PublicLayout";
import SeoMeta from "@/components/layout/SeoMeta";

/** Shown once an account has been permanently deleted (components/dashboard/DeleteAccountModal.js) */
export default function AccountDeletedPage() {
  // Clear any remaining client-side auth state, as logging out does
  useEffect(() => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
  }, []);

  return (
    <PublicLayout>
      <SeoMeta title="Account Deleted | QR-Genie" description="Your QR-Genie account has been deleted." path="/auth/account-deleted" noindex />

      <div className="mx-auto w-full max-w-md px-4 sm:px-0">
        <div className="rounded-2xl border border-indigo-100 bg-white/90 px-6 py-10 text-center shadow-xl sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
            <FaCheck className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">Your account has been deleted</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Your QR codes, scan history and uploaded files are gone, and you won&apos;t be charged again. We&apos;ve emailed you a
            confirmation. Thank you for using QR-Genie.
          </p>

          <div className="mt-8 space-y-3">
            <Link
              href="/"
              className="btn-shine flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-semibold !text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700"
            >
              <FaHome className="h-4 w-4" />
              Back to home
            </Link>
            <Link
              href="/auth/register"
              className="btn-shine btn-shine-soft flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold !text-gray-700 transition hover:bg-gray-50"
            >
              <FaUserPlus className="h-4 w-4" />
              Create a new account
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
