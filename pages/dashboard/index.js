import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardLayout";
import { FaQrcode, FaDownload, FaTrash, FaEllipsisH } from "react-icons/fa";
import Head from "next/head";
import { FaChartLine, FaUsers } from "react-icons/fa";

// This function runs on the server side
export async function getServerSideProps(context) {
  const { getUserFromRequest } = await import('../../lib/auth');
  const user = await getUserFromRequest(context.req);
  if (!user) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
  // You can fetch user-specific data here if needed
  // const codes = await fetchUserQRCodes(user.id);
  
  return {
    props: {
      // user: JSON.parse(JSON.stringify(user)), // Serialize user data
      // codes: JSON.parse(JSON.stringify(codes || [])),
    },
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/my-qr-codes", {
        credentials: 'include' // Important for sending cookies
      });
      
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      
      const data = await res.json();
      setCodes(data.codes || []);
    } catch (error) {
      console.error("Failed to load QR codes:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadCodes();
  }, []);
  // Mock stats - replace with real data
  const stats = [
    { name: 'Total QR Codes', value: codes.length.toString(), change: '+0%', changeType: 'positive' },
    { name: 'Scans (30d)', value: '0', change: '0%', changeType: 'neutral' },
    { name: 'Active Now', value: '0', change: '0%', changeType: 'neutral' },
  ];
  return (
    <DashboardLayout 
      title="Dashboard" 
      description="Welcome back! Here's what's happening with your QR codes."
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <div key={index} className="overflow-hidden bg-white rounded-lg shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-md bg-indigo-100 text-indigo-600">
                    <FaQrcode className="w-6 h-6" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 
                        stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* QR Codes Section */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">My QR Codes</h2>
            <p className="mt-1 text-sm text-gray-500">
              {codes.length} {codes.length === 1 ? 'code' : 'codes'} in total
            </p>
          </div>
          <Link
            href="/dashboard/create-qr"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaQrcode className="w-4 h-4 mr-2" />
            New QR Code
          </Link>
        </div>
        {/* QR Codes List */}
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            // Loading state
            <div className="p-6 text-center text-gray-500">
              Loading your QR codes...
            </div>
          ) : codes.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {codes.map((code) => (
                <li key={code.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {code.name || `QR Code #${code.id}`}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            className="bg-white rounded-full flex text-gray-400 hover:text-gray-600 focus:outline-none"
                            id="options-menu"
                            aria-expanded="true"
                            aria-haspopup="true"
                          >
                            <span className="sr-only">Open options</span>
                            <FaEllipsisH className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {code.scanCount || 0} scans
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <span>
                          Created on{' '}
                          {new Date(code.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end space-x-3">
                      <a
                        href={`/api/qr-image/${code.slug}`}
                        download
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FaDownload className="w-4 h-4 mr-1" />
                        Download
                      </a>
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        onClick={() => {
                          // Implement delete functionality
                          if (confirm('Are you sure you want to delete this QR code?')) {
                            // Call delete API
                            console.log('Delete QR code:', code.id);
                          }
                        }}
                      >
                        <FaTrash className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            // Empty state
            <div className="text-center p-12">
              <FaQrcode className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No QR codes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new QR code.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/create-qr"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FaQrcode className="-ml-1 mr-2 h-5 w-5" />
                  New QR Code
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}