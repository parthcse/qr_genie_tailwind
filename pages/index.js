// pages/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { FaCheck, FaQrcode, FaChartLine, FaUsers, FaLock } from "react-icons/fa";

// Reusable auth hook for checking authentication state
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on client side
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include' // Important for sending cookies
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { user, loading };
}

// Server-side auth check
export async function getServerSideProps(context) {
  const { getUserFromRequest } = await import('../lib/auth');
  const user = await getUserFromRequest(context.req);
  
  return {
    props: {
      // Pass initial auth state from server to avoid flashing
      initialUser: user ? JSON.parse(JSON.stringify(user)) : null,
    },
  };
}

const features = [
  {
    icon: <FaQrcode className="h-5 w-5" />,
    title: "Dynamic QR Codes",
    description: "Update your QR code destinations anytime without reprinting."
  },
  {
    icon: <FaChartLine className="h-5 w-5" />,
    title: "Real-time Analytics",
    description: "Track scans, locations, and devices in real-time."
  },
  {
    icon: <FaUsers className="h-5 w-5" />,
    title: "Team Collaboration",
    description: "Share access with your team members easily."
  }
];

const testimonials = [
  {
    name: "Sarah K.",
    role: "Marketing Director",
    content: "QR-Genie has transformed how we manage our print campaigns. So easy to use!",
    avatar: "/avatar1.jpg"
  },
  {
    name: "Michael T.",
    role: "Restaurant Owner",
    content: "Updating our menu QR codes has never been easier. Great customer support too!",
    avatar: "/avatar2.jpg"
  }
];

export default function Landing({ initialUser }) {
  // Use auth hook with initial server state
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Use server-provided user initially, then update with client state
  const currentUser = user || initialUser;
  const isAuthenticated = !!currentUser;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Always send the user to the logout confirmation page
      router.push('/auth/logout');
    }
  };

  // Dynamic CTA component to avoid layout shift
  const CallToAction = () => {
    if (loading) {
      // Show placeholder with same height to prevent layout shift
      return (
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div className="w-full h-12 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      );
    }

    if (isAuthenticated) {
      // Logged in: Show Dashboard button
      return (
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div className="rounded-md shadow">
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      );
    }

    // Not logged in: Show Get Started and How it works buttons
    return (
      <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
        <div className="rounded-md shadow">
          <Link
            href="/auth/register"
            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
          >
            Get Started
          </Link>
        </div>
        <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
          <Link
            href="#how-it-works"
            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
          >
            How it works
          </Link>
        </div>
      </div>
    );
  };

  // Dynamic Navigation component
  const Navigation = () => {
    if (loading) {
      return (
        <div className="flex items-center space-x-4">
          <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      );
    }

    if (isAuthenticated) {
      return (
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
          >
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
          >
            Logout
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/auth/login"
          className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
        >
          Log in
        </Link>
        <Link
          href="/auth/register"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          Get Started
        </Link>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Head>
        <title>QR-Genie | Dynamic QR Code Solution</title>
        <meta name="description" content="Create and manage dynamic QR codes with QR-Genie. Update your links anytime without reprinting." />
      </Head>

      {/* Navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <FaQrcode className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold">QR-Genie</span>
              </div>
              <nav className="hidden md:ml-10 md:flex space-x-8">
                <a href="#features" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium">Features</a>
                <a href="#how-it-works" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium">How It Works</a>
                <a href="#pricing" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium">Pricing</a>
              </nav>
            </div>
            <Navigation />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">QR Codes That Work</span>
            <span className="block text-indigo-600">For Your Business</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Create, manage, and track dynamic QR codes. Update your links anytime without reprinting.
          </p>
          
          {/* Dynamic CTA buttons based on auth state */}
          <CallToAction />
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold uppercase text-gray-500 tracking-wide">
            Trusted by businesses worldwide
          </p>
          <div className="mt-6 grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-5">
            {/* Add your logo images here */}
            <div className="col-span-1 flex justify-center">Logo 1</div>
            <div className="col-span-1 flex justify-center">Logo 2</div>
            <div className="col-span-1 flex justify-center">Logo 3</div>
            <div className="col-span-1 flex justify-center">Logo 4</div>
            <div className="col-span-1 flex justify-center">Logo 5</div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to succeed
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              {features.map((feature, index) => (
                <div key={index} className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    {feature.icon}
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{feature.title}</h3>
                    <p className="mt-2 text-base text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">How it works</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Get started in minutes
            </p>
          </div>
          <div className="mt-10">
            <div className="relative">
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mt-12 lg:mt-0 lg:col-span-1">
                  <div className="space-y-10">
                    {[
                      {
                        number: '1',
                        title: 'Create an account',
                        description: 'Sign up for free and verify your email address.'
                      },
                      {
                        number: '2',
                        title: 'Generate QR codes',
                        description: 'Create unlimited dynamic QR codes in seconds.'
                      },
                      {
                        number: '3',
                        title: 'Track & analyze',
                        description: 'Monitor scans and update destinations anytime.'
                      }
                    ].map((item, index) => (
                      <div key={index} className="relative">
                        <div className="absolute flex items-center justify-center h-12 w-12 rounded-full bg-indigo-500 text-white">
                          {item.number}
                        </div>
                        <div className="ml-16">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">{item.title}</h3>
                          <p className="mt-2 text-base text-gray-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Testimonials</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              What our customers say
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-gray-600">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section - Only show if not authenticated */}
      {!isAuthenticated && !loading && (
        <div className="bg-indigo-700">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block">Start your free trial today.</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-indigo-200">
              No credit card required. Cancel anytime.
            </p>
            <Link
              href="/auth/register"
              className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto"
            >
              Sign up for free
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                About
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Blog
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Contact
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Privacy
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Terms
              </a>
            </div>
          </nav>
          <p className="mt-8 text-center text-base text-gray-400">
            &copy; {new Date().getFullYear()} QR-Genie. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}