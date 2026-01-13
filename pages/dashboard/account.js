import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardLayout";
import { useTranslation } from "../../lib/translations";
import { languages, getLanguageName } from "../../lib/languages";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaGlobe,
  FaInfoCircle,
  FaSignOutAlt,
  FaCheckCircle,
} from "react-icons/fa";

// Server-side authentication check
export async function getServerSideProps(context) {
  const { getUserFromRequest } = await import("../../lib/auth");
  const user = await getUserFromRequest(context.req);
  if (!user) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }
  return {
    props: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || "",
      },
    },
  };
}

export default function AccountPage({ user: initialUser }) {
  const router = useRouter();
  const { t, language, changeLanguage } = useTranslation();

  // Safety check for initialUser
  const user = initialUser || { id: "", email: "", name: "" };

  // Tab state - Tab switching logic
  const [activeTab, setActiveTab] = useState("general");

  // Global success notification state
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // General Information Tab - Personal Information State
  // Initialize with name from database (split into first and last name)
  const initialNameParts = user.name ? user.name.trim().split(" ") : [];
  const [personalInfo, setPersonalInfo] = useState({
    firstName: initialNameParts[0] || "",
    lastName: initialNameParts.slice(1).join(" ") || "",
    email: user.email || "",
    telephone: "",
  });

  // Personal Information Validation State
  const [personalErrors, setPersonalErrors] = useState({});
  const [personalTouched, setPersonalTouched] = useState({});
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalSuccess, setPersonalSuccess] = useState(false);

  // Change Password State
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordTouched, setPasswordTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Language State
  const [languageLoading, setLanguageLoading] = useState(false);
  const [languageSuccess, setLanguageSuccess] = useState(false);

  // Billing Information State
  const [billingType, setBillingType] = useState("company");
  const [billingData, setBillingData] = useState({
    companyName: "",
    taxId: "",
    name: "",
    surname: "",
    email: "",
    address: "",
    postalCode: "",
    city: "",
    country: "India",
  });
  const [billingErrors, setBillingErrors] = useState({});
  const [billingTouched, setBillingTouched] = useState({});
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingSuccess, setBillingSuccess] = useState(false);

  // Load user data on mount - fetch from database
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.name) {
            // Split name into first and last name
            const nameParts = data.user.name.trim().split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";
            
            setPersonalInfo({
              firstName: firstName,
              lastName: lastName,
              email: data.user.email || "",
              telephone: "",
            });
            setBillingData((prev) => ({
              ...prev,
              email: data.user.email || "",
            }));
          } else if (data.user) {
            // User exists but no name set
            setPersonalInfo({
              firstName: "",
              lastName: "",
              email: data.user.email || "",
              telephone: "",
            });
            setBillingData((prev) => ({
              ...prev,
              email: data.user.email || "",
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    fetchUserData();
  }, []);

  // Personal Information Validation Logic
  const validatePersonalInfo = () => {
    const errors = {};
    // First name validation - only check if required
    if (!personalInfo.firstName.trim()) {
      errors.firstName = t("firstNameRequired");
    }
    // Last name validation - only check if required
    if (!personalInfo.lastName.trim()) {
      errors.lastName = t("lastNameRequired");
    }
    return errors;
  };

  const handlePersonalInfoChange = (field, value) => {
    // Telephone validation - only allow numbers and digits
    if (field === "telephone") {
      // Remove any non-digit characters
      const numericValue = value.replace(/\D/g, "");
      setPersonalInfo((prev) => ({ ...prev, [field]: numericValue }));
    } else {
      setPersonalInfo((prev) => ({ ...prev, [field]: value }));
    }
    // Clear error when user starts typing
    if (personalErrors[field]) {
      setPersonalErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setPersonalSuccess(false);
  };

  const handlePersonalInfoBlur = (field) => {
    setPersonalTouched((prev) => ({ ...prev, [field]: true }));
    const errors = validatePersonalInfo();
    if (errors[field]) {
      setPersonalErrors((prev) => ({ ...prev, [field]: errors[field] }));
    }
  };

  const handlePersonalInfoUpdate = async () => {
    // Validate all fields
    const errors = validatePersonalInfo();
    setPersonalErrors(errors);
    setPersonalTouched({
      firstName: true,
      lastName: true,
    });

    if (Object.keys(errors).length > 0) {
      return;
    }

    setPersonalLoading(true);
    setPersonalSuccess(false);

    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: `${personalInfo.firstName} ${personalInfo.lastName}`.trim(),
          telephone: personalInfo.telephone,
        }),
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      setPersonalSuccess(true);
      setShowSuccessBanner(true);
      setTimeout(() => {
        setPersonalSuccess(false);
        setShowSuccessBanner(false);
      }, 3000);
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setPersonalLoading(false);
    }
  };

  // Password Validation Logic
  const validatePassword = () => {
    const errors = {};
    if (!passwordData.password) {
      errors.password = t("passwordTooShort");
    } else if (passwordData.password.length < 8) {
      errors.password = t("passwordTooShort");
    }
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = t("passwordsDoNotMatch");
    } else if (passwordData.password !== passwordData.confirmPassword) {
      errors.confirmPassword = t("passwordsDoNotMatch");
    }
    return errors;
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setPasswordSuccess(false);
  };

  const handlePasswordBlur = (field) => {
    setPasswordTouched((prev) => ({ ...prev, [field]: true }));
    const errors = validatePassword();
    if (errors[field]) {
      setPasswordErrors((prev) => ({ ...prev, [field]: errors[field] }));
    }
  };

  const handlePasswordUpdate = async () => {
    const errors = validatePassword();
    setPasswordErrors(errors);
    setPasswordTouched({
      password: true,
      confirmPassword: true,
    });

    if (Object.keys(errors).length > 0) {
      return;
    }

    setPasswordLoading(true);
    setPasswordSuccess(false);

    try {
      const response = await fetch("/api/user/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: passwordData.password }),
      });

      if (!response.ok) {
        throw new Error("Password update failed");
      }

      setPasswordSuccess(true);
      setShowSuccessBanner(true);
      setPasswordData({ password: "", confirmPassword: "" });
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowSuccessBanner(false);
      }, 3000);
    } catch (error) {
      console.error("Password update failed:", error);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Language Switching Logic
  const handleLanguageChange = (lang) => {
    setLanguageLoading(true);
    // Save to localStorage and update state - this triggers re-render of all components using useTranslation
    changeLanguage(lang);
    setLanguageSuccess(true);
    setShowSuccessBanner(true);
    // Reload page to ensure all content updates with new language
    setTimeout(() => {
      setLanguageLoading(false);
      router.reload();
    }, 500);
  };

  // Billing Information Validation Logic
  const validateBillingInfo = () => {
    const errors = {};
    if (billingType === "company") {
      if (!billingData.companyName.trim()) {
        errors.companyName = t("companyNameRequired");
      }
      if (!billingData.taxId.trim()) {
        errors.taxId = t("taxIdRequired");
      }
    }
    if (!billingData.name.trim()) {
      errors.name = t("nameRequired");
    }
    if (!billingData.surname.trim()) {
      errors.surname = t("surnameRequired");
    }
    if (!billingData.email.trim()) {
      errors.email = t("emailRequired");
    }
    if (!billingData.address.trim()) {
      errors.address = t("addressRequired");
    }
    if (!billingData.postalCode.trim()) {
      errors.postalCode = t("postalCodeRequired");
    }
    if (!billingData.city.trim()) {
      errors.city = t("cityRequired");
    }
    if (!billingData.country.trim()) {
      errors.country = t("countryRequired");
    }
    return errors;
  };

  const handleBillingChange = (field, value) => {
    setBillingData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (billingErrors[field]) {
      setBillingErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setBillingSuccess(false);
  };

  const handleBillingBlur = (field) => {
    setBillingTouched((prev) => ({ ...prev, [field]: true }));
    const errors = validateBillingInfo();
    if (errors[field]) {
      setBillingErrors((prev) => ({ ...prev, [field]: errors[field] }));
    }
  };

  const handleBillingSave = async () => {
    const errors = validateBillingInfo();
    setBillingErrors(errors);
    // Mark all fields as touched
    const allFields = billingType === "company"
      ? ["companyName", "taxId", "name", "surname", "email", "address", "postalCode", "city", "country"]
      : ["name", "surname", "email", "address", "postalCode", "city", "country"];
    const touched = {};
    allFields.forEach((field) => {
      touched[field] = true;
    });
    setBillingTouched(touched);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setBillingLoading(true);
    setBillingSuccess(false);

    try {
      const response = await fetch("/api/user/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: billingType, ...billingData }),
      });

      if (!response.ok) {
        throw new Error("Billing save failed");
      }

      setBillingSuccess(true);
      setShowSuccessBanner(true);
      setTimeout(() => {
        setBillingSuccess(false);
        setShowSuccessBanner(false);
      }, 3000);
    } catch (error) {
      console.error("Billing save failed:", error);
    } finally {
      setBillingLoading(false);
    }
  };

  // Log Out functionality
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.push("/auth/logout");
    }
  };

  const isPersonalInfoValid = !Object.keys(validatePersonalInfo()).length;
  const isPasswordValid = !Object.keys(validatePassword()).length;
  const isBillingValid = !Object.keys(validateBillingInfo()).length;

  return (
    <DashboardLayout title={t("myAccount")} description="">
      {/* Success Notification Banner */}
      {showSuccessBanner && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm font-medium text-green-800">
          <FaCheckCircle className="h-5 w-5 text-green-600" />
          <span>{t("successfullyUpdated")}</span>
        </div>
      )}
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "general"
                ? "bg-white text-indigo-600 shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t("generalInformation")}
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "billing"
                ? "bg-white text-indigo-600 shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t("billingInformation")}
          </button>
        </div>

        {/* General Information Tab */}
        {activeTab === "general" && (
          <div className="space-y-6">
            {/* Personal Information Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                {t("personalInformation")}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* First Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t("firstName")}
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={personalInfo.firstName}
                      onChange={(e) =>
                        handlePersonalInfoChange("firstName", e.target.value)
                      }
                      onBlur={() => handlePersonalInfoBlur("firstName")}
                      className={`w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        personalErrors.firstName && personalTouched.firstName
                          ? "border-red-300"
                          : "border-slate-300"
                      }`}
                      placeholder={t("firstNamePlaceholder")}
                    />
                  </div>
                  {personalErrors.firstName && personalTouched.firstName && (
                    <p className="mt-1 text-xs text-red-600">
                      {personalErrors.firstName}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t("lastName")}
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={personalInfo.lastName}
                      onChange={(e) =>
                        handlePersonalInfoChange("lastName", e.target.value)
                      }
                      onBlur={() => handlePersonalInfoBlur("lastName")}
                      className={`w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        personalErrors.lastName && personalTouched.lastName
                          ? "border-red-300"
                          : "border-slate-300"
                      }`}
                      placeholder={t("lastNamePlaceholder")}
                    />
                  </div>
                  {personalErrors.lastName && personalTouched.lastName && (
                    <p className="mt-1 text-xs text-red-600">
                      {personalErrors.lastName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t("email")}
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={personalInfo.email}
                      disabled
                      readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-3 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Telephone */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t("telephone")}
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={personalInfo.telephone}
                      onChange={(e) =>
                        handlePersonalInfoChange("telephone", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder={t("telephonePlaceholder")}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handlePersonalInfoUpdate}
                  disabled={!isPersonalInfoValid || personalLoading}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-all ${
                    isPersonalInfoValid && !personalLoading
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-slate-300 cursor-not-allowed"
                  }`}
                >
                  {personalLoading ? t("updating") : t("update")}
                </button>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                {t("changePassword")}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t("password")}
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.password}
                      onChange={(e) =>
                        handlePasswordChange("password", e.target.value)
                      }
                      onBlur={() => handlePasswordBlur("password")}
                      className={`w-full rounded-lg border pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        passwordErrors.password && passwordTouched.password
                          ? "border-red-300"
                          : "border-slate-300"
                      }`}
                      placeholder={t("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-4 w-4" />
                      ) : (
                        <FaEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.password && passwordTouched.password && (
                    <p className="mt-1 text-xs text-red-600">
                      {passwordErrors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t("confirmPassword")}
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        handlePasswordChange("confirmPassword", e.target.value)
                      }
                      onBlur={() => handlePasswordBlur("confirmPassword")}
                      className={`w-full rounded-lg border pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        passwordErrors.confirmPassword &&
                        passwordTouched.confirmPassword
                          ? "border-red-300"
                          : "border-slate-300"
                      }`}
                      placeholder={t("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash className="h-4 w-4" />
                      ) : (
                        <FaEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword &&
                    passwordTouched.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handlePasswordUpdate}
                  disabled={!isPasswordValid || passwordLoading}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-all ${
                    isPasswordValid && !passwordLoading
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-slate-300 cursor-not-allowed"
                  }`}
                >
                  {passwordLoading ? t("updating") : t("update")}
                </button>
              </div>
            </div>

            {/* Language Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                {t("language")}
              </h2>
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-xs">
                  <FaGlobe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    disabled={languageLoading}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handleLanguageChange(language)}
                  disabled={languageLoading}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-all ${
                    !languageLoading
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-slate-300 cursor-not-allowed"
                  }`}
                >
                  {languageLoading ? t("updating") : t("update")}
                </button>
              </div>
            </div>

            {/* Log Out Button */}
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-all hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <FaSignOutAlt className="h-4 w-4" />
                {t("logOut")}
              </button>
            </div>
          </div>
        )}

        {/* Billing Information Tab */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            {/* Billing Form Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              {/* Type Selector Pills */}
              <div className="mb-6 flex gap-2">
                <button
                  onClick={() => {
                    setBillingType("company");
                    setBillingErrors({});
                    setBillingSuccess(false);
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    billingType === "company"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t("company")}
                </button>
                <button
                  onClick={() => {
                    setBillingType("private");
                    setBillingErrors({});
                    setBillingSuccess(false);
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    billingType === "private"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t("private")}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Company Name (only for company type) */}
                {billingType === "company" && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        {t("companyName")}
                        <span className="ml-1 text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={billingData.companyName}
                        onChange={(e) =>
                          handleBillingChange("companyName", e.target.value)
                        }
                        onBlur={() => handleBillingBlur("companyName")}
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                          billingErrors.companyName && billingTouched.companyName
                            ? "border-red-300"
                            : "border-slate-300"
                        }`}
                        placeholder={t("companyName")}
                      />
                      {billingErrors.companyName &&
                        billingTouched.companyName && (
                          <p className="mt-1 text-xs text-red-600">
                            {billingErrors.companyName}
                          </p>
                        )}
                    </div>

                    {/* Tax ID */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-700">
                        {t("taxId")}
                        <span className="text-red-500">*</span>
                        <FaInfoCircle className="h-3 w-3 text-slate-400" />
                      </label>
                      <input
                        type="text"
                        value={billingData.taxId}
                        onChange={(e) =>
                          handleBillingChange("taxId", e.target.value)
                        }
                        onBlur={() => handleBillingBlur("taxId")}
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                          billingErrors.taxId && billingTouched.taxId
                            ? "border-red-300"
                            : "border-slate-300"
                        }`}
                        placeholder={t("taxId")}
                      />
                      {billingErrors.taxId && billingTouched.taxId && (
                        <p className="mt-1 text-xs text-red-600">
                          {billingErrors.taxId}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t("name")}
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={billingData.name}
                    onChange={(e) =>
                      handleBillingChange("name", e.target.value)
                    }
                    onBlur={() => handleBillingBlur("name")}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      billingErrors.name && billingTouched.name
                        ? "border-red-300"
                        : "border-slate-300"
                    }`}
                    placeholder={t("name")}
                  />
                  {billingErrors.name && billingTouched.name && (
                    <p className="mt-1 text-xs text-red-600">
                      {billingErrors.name}
                    </p>
                  )}
                </div>

                {/* Surname */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t("surname")}
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={billingData.surname}
                    onChange={(e) =>
                      handleBillingChange("surname", e.target.value)
                    }
                    onBlur={() => handleBillingBlur("surname")}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      billingErrors.surname && billingTouched.surname
                        ? "border-red-300"
                        : "border-slate-300"
                    }`}
                    placeholder={t("surname")}
                  />
                  {billingErrors.surname && billingTouched.surname && (
                    <p className="mt-1 text-xs text-red-600">
                      {billingErrors.surname}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t("email")}
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={billingData.email}
                    onChange={(e) =>
                      handleBillingChange("email", e.target.value)
                    }
                    onBlur={() => handleBillingBlur("email")}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      billingErrors.email && billingTouched.email
                        ? "border-red-300"
                        : "border-slate-300"
                    }`}
                    placeholder={t("email")}
                  />
                  {billingErrors.email && billingTouched.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {billingErrors.email}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t("address")}
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={billingData.address}
                    onChange={(e) =>
                      handleBillingChange("address", e.target.value)
                    }
                    onBlur={() => handleBillingBlur("address")}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      billingErrors.address && billingTouched.address
                        ? "border-red-300"
                        : "border-slate-300"
                    }`}
                    placeholder={t("address")}
                  />
                  {billingErrors.address && billingTouched.address && (
                    <p className="mt-1 text-xs text-red-600">
                      {billingErrors.address}
                    </p>
                  )}
                </div>

                {/* Postal Code */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t("postalCode")}
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={billingData.postalCode}
                    onChange={(e) =>
                      handleBillingChange("postalCode", e.target.value)
                    }
                    onBlur={() => handleBillingBlur("postalCode")}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      billingErrors.postalCode && billingTouched.postalCode
                        ? "border-red-300"
                        : "border-slate-300"
                    }`}
                    placeholder={t("postalCode")}
                  />
                  {billingErrors.postalCode && billingTouched.postalCode && (
                    <p className="mt-1 text-xs text-red-600">
                      {billingErrors.postalCode}
                    </p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t("city")}
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={billingData.city}
                    onChange={(e) =>
                      handleBillingChange("city", e.target.value)
                    }
                    onBlur={() => handleBillingBlur("city")}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      billingErrors.city && billingTouched.city
                        ? "border-red-300"
                        : "border-slate-300"
                    }`}
                    placeholder={t("city")}
                  />
                  {billingErrors.city && billingTouched.city && (
                    <p className="mt-1 text-xs text-red-600">
                      {billingErrors.city}
                    </p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t("country")}
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaGlobe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={billingData.country}
                      onChange={(e) =>
                        handleBillingChange("country", e.target.value)
                      }
                      onBlur={() => handleBillingBlur("country")}
                      className={`w-full appearance-none rounded-lg border pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        billingErrors.country && billingTouched.country
                          ? "border-red-300"
                          : "border-slate-300"
                      }`}
                    >
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="France">France</option>
                      <option value="Germany">Germany</option>
                      <option value="Spain">Spain</option>
                      <option value="Italy">Italy</option>
                      <option value="Japan">Japan</option>
                      <option value="China">China</option>
                      <option value="Brazil">Brazil</option>
                      <option value="Mexico">Mexico</option>
                    </select>
                  </div>
                  {billingErrors.country && billingTouched.country && (
                    <p className="mt-1 text-xs text-red-600">
                      {billingErrors.country}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleBillingSave}
                  disabled={!isBillingValid || billingLoading}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-all ${
                    isBillingValid && !billingLoading
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-slate-300 cursor-not-allowed"
                  }`}
                >
                  {billingLoading ? t("saving") : t("save")}
                </button>
              </div>
            </div>
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}
