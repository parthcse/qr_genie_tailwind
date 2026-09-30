import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardLayout";
import { FaUser, FaEnvelope, FaPhone, FaGlobe, FaEye, FaEyeSlash, FaCheckCircle, FaBuilding, FaLock } from "react-icons/fa";

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

// Sections are open blocks divided by a rule on phones (no card-in-card), cards from sm up
const sectionClass =
  "border-t border-gray-100 pt-8 first:border-t-0 first:pt-0 sm:rounded-2xl sm:border sm:border-indigo-100 sm:bg-white sm:p-6 sm:shadow-lg sm:first:border-t sm:first:pt-6";

export default function AccountPage({ user: initialUser }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(router.query.tab === "billing" ? "billing" : "general");
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    if (router.query.tab === "billing") setActiveTab("billing");
  }, [router.query.tab]);
  const [loading, setLoading] = useState(false);
  
  // Personal Information Form
  const [personalInfo, setPersonalInfo] = useState({
    firstName: (user?.name || '').split(' ')[0] || '',
    lastName: (user?.name || '').split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    company: user?.company || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    country: user?.country || '',
  });
  
  // Password Form
  const [passwordInfo, setPasswordInfo] = useState({
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  // Current password, asked for only when the email address is being changed
  const [emailChangePassword, setEmailChangePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Language
  const [language, setLanguage] = useState(user?.language || 'English');
  
  // Billing Information Form
  const [billingInfo, setBillingInfo] = useState({
    billingName: user?.billingName || '',
    billingCompany: user?.billingCompany || '',
    billingAddress: user?.billingAddress || '',
    billingCity: user?.billingCity || '',
    billingState: user?.billingState || '',
    billingZipCode: user?.billingZipCode || '',
    billingCountry: user?.billingCountry || '',
    taxId: user?.taxId || '',
  });
  
  // Success/Error Messages
  const [personalInfoSuccess, setPersonalInfoSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [languageSuccess, setLanguageSuccess] = useState(false);
  const [billingSuccess, setBillingSuccess] = useState(false);
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
            setPersonalInfo({
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: data.user.email || '',
              telephone: data.user.telephone || '',
              company: data.user.company || '',
              address: data.user.address || '',
              city: data.user.city || '',
              state: data.user.state || '',
              zipCode: data.user.zipCode || '',
              country: data.user.country || '',
            });
            setLanguage(data.user.language || 'English');
            setBillingInfo({
              billingName: data.user.billingName || '',
              billingCompany: data.user.billingCompany || '',
              billingAddress: data.user.billingAddress || '',
              billingCity: data.user.billingCity || '',
              billingState: data.user.billingState || '',
              billingZipCode: data.user.billingZipCode || '',
              billingCountry: data.user.billingCountry || '',
              taxId: data.user.taxId || '',
            });
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
    setPasswordError('');
  };

  const emailChanged =
    !!user?.email && personalInfo.email.trim().toLowerCase() !== user.email.toLowerCase();

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPersonalInfoSuccess(false);

    try {
      const res = await fetch('/api/account/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: personalInfo.firstName,
          lastName: personalInfo.lastName,
          email: personalInfo.email,
          telephone: personalInfo.telephone,
          company: personalInfo.company,
          address: personalInfo.address,
          city: personalInfo.city,
          state: personalInfo.state,
          zipCode: personalInfo.zipCode,
          country: personalInfo.country,
          language: language,
          currentPassword: emailChanged ? emailChangePassword : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update personal information');
        return;
      }

      // Update local user state
      if (data.user) {
        setUser(prev => ({ ...prev, ...data.user }));
        setPersonalInfo(prev => ({ ...prev, email: data.user.email }));
      }
      setEmailChangePassword('');

      setPersonalInfoSuccess(true);
      setTimeout(() => setPersonalInfoSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating personal information:', err);
      setError('Failed to update personal information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPasswordError('');
    setPasswordSuccess(false);

    if (!passwordInfo.currentPassword) {
      setPasswordError('Enter your current password.');
      setLoading(false);
      return;
    }

    if (passwordInfo.password !== passwordInfo.confirmPassword) {
      setPasswordError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordInfo.password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/account/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordInfo.currentPassword,
          password: passwordInfo.password,
          confirmPassword: passwordInfo.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || 'Failed to update password');
        return;
      }

      setPasswordSuccess(true);
      setPasswordInfo({ currentPassword: '', password: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBillingInfoChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: value }));
    setBillingSuccess(false);
    setError('');
  };

  const handleBillingInfoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBillingSuccess(false);

    try {
      const res = await fetch('/api/account/billing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(billingInfo),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update billing information');
        return;
      }

      // Update local user state
      if (data.user) {
        setUser(prev => ({ ...prev, ...data.user }));
      }

      setBillingSuccess(true);
      setTimeout(() => setBillingSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating billing information:', err);
      setError('Failed to update billing information. Please try again.');
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
      const res = await fetch('/api/account/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          language: language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update language');
        return;
      }

      setLanguageSuccess(true);
      setTimeout(() => setLanguageSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating language:', err);
      setError('Failed to update language. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="My Account"
      description="Manage your personal details, password and billing information."
    >

      {/* Tabs: full-width segmented control on phones */}
      <div role="tablist" aria-label="Account sections" className="mb-8 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 sm:mb-6 sm:w-fit sm:self-start">
        {[
          { id: 'general', label: 'General information' },
          { id: 'billing', label: 'Billing information' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              activeTab === tab.id
                ? 'bg-white font-semibold text-indigo-700 shadow-sm'
                : 'font-medium text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="space-y-8 sm:space-y-6">
          {/* Personal Information Section */}
          <div className={sectionClass}>
            <h3 className="text-lg font-semibold text-gray-900 mb-5">Personal information</h3>
            
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
              <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-6 sm:gap-y-6">
                {/* First Name */}
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First name
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
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="First Name"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last name
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
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Last Name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="col-span-2 md:col-span-1">
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
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Email"
                    />
                  </div>
                </div>

                {/* Telephone */}
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
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
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="E.g. 6555123"
                    />
                  </div>
                </div>

                {/* Company */}
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBuilding className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={personalInfo.company}
                      onChange={handlePersonalInfoChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Company Name"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={personalInfo.address}
                    onChange={handlePersonalInfoChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Street Address"
                  />
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={personalInfo.city}
                    onChange={handlePersonalInfoChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="City"
                  />
                </div>

                {/* State */}
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State / province
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={personalInfo.state}
                    onChange={handlePersonalInfoChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="State/Province"
                  />
                </div>

                {/* Zip Code */}
                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP / postal code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={personalInfo.zipCode}
                    onChange={handlePersonalInfoChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Zip/Postal Code"
                  />
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={personalInfo.country}
                    onChange={handlePersonalInfoChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Country"
                  />
                </div>

                {/* Changing the sign-in email needs the current password */}
                {emailChanged && (
                  <div className="col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <label htmlFor="emailChangePassword" className="block text-sm font-medium text-amber-900 mb-2">
                      Current password
                    </label>
                    <p className="mb-3 text-xs text-amber-800">
                      You're changing the email you sign in with. Enter your current password to confirm.
                    </p>
                    <div className="relative md:max-w-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        id="emailChangePassword"
                        name="emailChangePassword"
                        autoComplete="current-password"
                        value={emailChangePassword}
                        onChange={(e) => { setEmailChangePassword(e.target.value); setError(''); }}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Current password"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex sm:justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Section */}
          <div className={sectionClass}>
            <h3 className="text-lg font-semibold text-gray-900">Change password</h3>
            <p className="mt-1 mb-5 text-sm text-gray-500">
              Use at least 8 characters. Changing it signs you out on your other devices.
            </p>

            {passwordError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-sm text-red-700">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded flex items-center">
                <FaCheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                <p className="text-sm text-green-700">Password updated. You've been signed out on your other devices.</p>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 sm:gap-6">
                {/* Current Password */}
                <div className="md:col-span-2 md:max-w-[calc(50%-0.75rem)]">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Current password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    autoComplete="current-password"
                    value={passwordInfo.currentPassword}
                    onChange={handlePasswordChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter current password"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      autoComplete="new-password"
                      value={passwordInfo.password}
                      onChange={handlePasswordChange}
                      className="block w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={passwordInfo.confirmPassword}
                      onChange={handlePasswordChange}
                      className="block w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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

              <div className="mt-8 flex sm:justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving…' : 'Update password'}
                </button>
              </div>
            </form>
          </div>

          {/* Language Section */}
          <div className={sectionClass}>
            <h3 className="text-lg font-semibold text-gray-900 mb-5">Language</h3>

            {languageSuccess && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded flex items-center">
                <FaCheckCircle className="h-5 w-5 text-green-400 mr-3" />
                <p className="text-sm text-green-700">Language preference updated successfully!</p>
              </div>
            )}

            <form onSubmit={handleLanguageSubmit}>
              <div className="max-w-md">
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                  Display language
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGlobe className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
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

              <div className="mt-8 flex sm:justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving…' : 'Save language'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-8 sm:space-y-6">
          {/* Billing Information Section */}
          <div className={sectionClass}>
            <h3 className="text-lg font-semibold text-gray-900 mb-5">Billing information</h3>
            
            {error && (
              <div className="mb-3 sm:mb-4 bg-red-50 border-l-4 border-red-400 p-3 sm:p-4 rounded">
                <p className="text-xs sm:text-sm text-red-700">{error}</p>
              </div>
            )}

            {billingSuccess && (
              <div className="mb-3 sm:mb-4 bg-green-50 border-l-4 border-green-400 p-3 sm:p-4 rounded flex items-center">
                <FaCheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mr-2 sm:mr-3 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-green-700">Billing information updated successfully!</p>
              </div>
            )}

            <form onSubmit={handleBillingInfoSubmit}>
              <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-6 sm:gap-y-6">
                {/* Billing Name */}
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="billingName" className="block text-sm font-medium text-gray-700 mb-2">
                    Billing name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="billingName"
                      name="billingName"
                      value={billingInfo.billingName}
                      onChange={handleBillingInfoChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Billing Name"
                    />
                  </div>
                </div>

                {/* Billing Company */}
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="billingCompany" className="block text-sm font-medium text-gray-700 mb-2">
                    Billing company
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBuilding className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="billingCompany"
                      name="billingCompany"
                      value={billingInfo.billingCompany}
                      onChange={handleBillingInfoChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Billing Company"
                    />
                  </div>
                </div>

                {/* Billing Address */}
                <div className="col-span-2">
                  <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    Billing address
                  </label>
                  <input
                    type="text"
                    id="billingAddress"
                    name="billingAddress"
                    value={billingInfo.billingAddress}
                    onChange={handleBillingInfoChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Street Address"
                  />
                </div>

                {/* Billing City */}
                <div>
                  <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="billingCity"
                    name="billingCity"
                    value={billingInfo.billingCity}
                    onChange={handleBillingInfoChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="City"
                  />
                </div>

                {/* Billing State */}
                <div>
                  <label htmlFor="billingState" className="block text-sm font-medium text-gray-700 mb-2">
                    State / province
                  </label>
                  <input
                    type="text"
                    id="billingState"
                    name="billingState"
                    value={billingInfo.billingState}
                    onChange={handleBillingInfoChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="State/Province"
                  />
                </div>

                {/* Billing Zip Code */}
                <div>
                  <label htmlFor="billingZipCode" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP / postal code
                  </label>
                  <input
                    type="text"
                    id="billingZipCode"
                    name="billingZipCode"
                    value={billingInfo.billingZipCode}
                    onChange={handleBillingInfoChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Zip/Postal Code"
                  />
                </div>

                {/* Billing Country */}
                <div>
                  <label htmlFor="billingCountry" className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    id="billingCountry"
                    name="billingCountry"
                    value={billingInfo.billingCountry}
                    onChange={handleBillingInfoChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Country"
                  />
                </div>

                {/* Tax ID */}
                <div className="col-span-2">
                  <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID / VAT number
                  </label>
                  <input
                    type="text"
                    id="taxId"
                    name="taxId"
                    value={billingInfo.taxId}
                    onChange={handleBillingInfoChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Tax ID / VAT Number (Optional)"
                  />
                </div>
              </div>

              <div className="mt-8 flex sm:justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving…' : 'Save billing details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
