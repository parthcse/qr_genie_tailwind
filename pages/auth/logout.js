// pages/auth/logout.js
import { useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { FaLock, FaHome, FaSignInAlt } from 'react-icons/fa';

export default function LogoutPage() {
  // Clear any remaining client-side auth state
  useEffect(() => {
    // Clear any localStorage/sessionStorage if used
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Head>
        <title>Logged Out | QR-Genie</title>
        <meta name="description" content="You have been successfully logged out of QR-Genie" />
      </Head>

      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
              <FaLock className="w-10 h-10 text-green-600" />
            </div>
          </div>

          {/* Main Content */}
          <div className="mt-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              You've been logged out
            </h1>
            <p className="mt-4 text-base text-gray-600">
              Your session has ended successfully. You can safely close this window or log in again.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            {/* Primary CTA - Log In Again */}
            <Link
              href="/auth/login"
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              <FaSignInAlt className="w-5 h-5 mr-2" />
              Log in again
            </Link>

            {/* Secondary CTA - Back to Home */}
            <Link
              href="/"
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              <FaHome className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
          </div>

          {/* Security Reassurance */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gray-50 rounded-full">
              <FaLock className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">
                For your security, your session was ended.
              </span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-xs text-gray-400">
              Need help? Contact our{' '}
              <Link href="/support" className="text-indigo-600 hover:text-indigo-500">
                support team
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto py-6 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} QR-Genie. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}