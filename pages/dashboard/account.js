
import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { FaUser, FaEnvelope, FaPhone, FaGlobe, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";

// Server-side authentication check
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
  return {
    props: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || null,
      },
    },
  };
}

export default function AccountPage({ user: initialUser }) {
  const [activeTab, setActiveTab] = useState('general');
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  
  // Personal Information Form
  const [personalInfo, setPersonalInfo] = useState({
    firstName: (user?.name || '').split(' ')[0] || '',
    lastName: (user?.name || '').split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    telephone: '',
  });
  
  // Password Form
  const [passwordInfo, setPasswordInfo] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Language
  const [language, setLanguage] = useState('English');
  
  // Success/Error Messages
  const [personalInfoSuccess, setPersonalInfoSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [languageSuccess, setLanguageSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            const nameParts = (data.user.name || '').split(' ');
            setPersonalInfo(prev => ({
              ...prev,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: data.user.email || prev.email,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    };
    fetchUserData();
  }, []);

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
    setPersonalInfoSuccess(false);
    setError('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordInfo(prev => ({ ...prev, [name]: value }));
    setPasswordSuccess(false);
    setError('');
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPersonalInfoSuccess(false);

    try {
      // TODO: Create API endpoint for updating user info
      // For now, just show success message
      setPersonalInfoSuccess(true);
      setTimeout(() => setPersonalInfoSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update personal information');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPasswordSuccess(false);

    if (passwordInfo.password !== passwordInfo.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordInfo.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      // TODO: Create API endpoint for updating password
      // For now, just show success message
      setPasswordSuccess(true);
      setPasswordInfo({ password: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLanguageSuccess(false);

    try {
      // TODO: Create API endpoint for updating language preference
      // For now, just show success message
      setLanguageSuccess(true);
      setTimeout(() => setLanguageSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update language');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="My Account"
      description="Manage your personal details, password and billing information."
    >

      {/* Tabs */}
      <div className="mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            General information
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === 'billing'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Billing information
          </button>
        </nav>
      </div>

      {activeTab === 'general' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Personal Information Section */}
          <div className="rounded-xl sm:rounded-2xl border border-indigo-100 bg-white p-4 sm:p-5 md:p-6 shadow-lg">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Personal information</h3>
            
            {error && (
              <div className="mb-3 sm:mb-4 bg-red-50 border-l-4 border-red-400 p-3 sm:p-4 rounded">
                <p className="text-xs sm:text-sm text-red-700">{error}</p>
              </div>
            )}

            {personalInfoSuccess && (
              <div className="mb-3 sm:mb-4 bg-green-50 border-l-4 border-green-400 p-3 sm:p-4 rounded flex items-center">
                <FaCheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mr-2 sm:mr-3 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-green-700">Personal information updated successfully!</p>
              </div>
            )}

            <form onSubmit={handlePersonalInfoSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={personalInfo.firstName}
                      onChange={handlePersonalInfoChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="First Name"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name & Surname
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={personalInfo.lastName}
                      onChange={handlePersonalInfoChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Last Name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={personalInfo.email}
                      onChange={handlePersonalInfoChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Email"
                    />
                  </div>
                </div>

                {/* Telephone */}
                <div>
                  <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telephone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="telephone"
                      name="telephone"
                      value={personalInfo.telephone}
                      onChange={handlePersonalInfoChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="E.g. 6555123"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Section */}
          <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Change password</h3>

            {passwordSuccess && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded flex items-center">
                <FaCheckCircle className="h-5 w-5 text-green-400 mr-3" />
                <p className="text-sm text-green-700">Password updated successfully!</p>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={passwordInfo.password}
                      onChange={handlePasswordChange}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      ) : (
                        <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordInfo.confirmPassword}
                      onChange={handlePasswordChange}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      ) : (
                        <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>

          {/* Language Section */}
          <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Language</h3>

            {languageSuccess && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded flex items-center">
                <FaCheckCircle className="h-5 w-5 text-green-400 mr-3" />
                <p className="text-sm text-green-700">Language preference updated successfully!</p>
              </div>
            )}

            <form onSubmit={handleLanguageSubmit}>
              <div className="max-w-md">
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Language
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGlobe className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Italian">Italian</option>
                    <option value="Portuguese">Portuguese</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Korean">Korean</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing information</h3>
          <p className="text-sm text-gray-600">
            Billing information will be available here. This section will include payment methods, invoices, and subscription details.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
