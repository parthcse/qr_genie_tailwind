import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaEye, FaEyeSlash, FaLock, FaCheckCircle } from 'react-icons/fa';

// Custom hook for form state management
const useResetPasswordForm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let strength = 0;
    if (hasMinLength) strength++;
    if (hasNumber) strength++;
    if (hasLetter) strength++;
    if (hasSpecialChar) strength++;

    return { strength };
  };

  // Form validation
  const { strength } = checkPasswordStrength(password);
  const errors = {
    password: touched.password && !password ? 'Password is required' : 
               touched.password && password && strength < 3 ? 'Password is too weak' : '',
    confirmPassword: touched.confirmPassword && !confirmPassword ? 'Please confirm your password' :
                     touched.confirmPassword && password && confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''
  };

  const isFormValid = password && confirmPassword && password === confirmPassword && strength >= 3 && !isSubmitting;

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    setError,
    success,
    setSuccess,
    isSubmitting,
    setIsSubmitting,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    touched,
    setTouched,
    errors,
    strength,
    isFormValid
  };
};

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const passwordRef = useRef(null);
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    setError,
    success,
    setSuccess,
    isSubmitting,
    setIsSubmitting,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    touched,
    setTouched,
    errors,
    strength,
    isFormValid
  } = useResetPasswordForm();

  // Focus password input on mount
  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  // Check if token is valid on mount
  useEffect(() => {
    if (token && router.isReady) {
      // Token will be validated on submit
    }
  }, [token, router.isReady]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    // Mark fields as touched to show validation errors
    setTouched({ password: true, confirmPassword: true });
    
    if (!isFormValid) return;

    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token,
          password: password.trim(),
          confirmPassword: confirmPassword.trim()
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        switch (response.status) {
          case 400:
            throw new Error(data.error || 'Invalid request');
          case 401:
            throw new Error('Invalid or expired reset token. Please request a new password reset link.');
          default:
            throw new Error(data.error || 'Failed to reset password. Please try again.');
        }
      }

      // Success - show success message and redirect after delay
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
      
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'password') setPassword(value);
    if (name === 'confirmPassword') setConfirmPassword(value);
    if (error) setError('');
    if (success) setSuccess(false);
  };

  // Handle input blur
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  if (!router.isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-md sm:rounded-2xl sm:px-10 text-center">
            <p className="text-sm text-slate-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter your new password below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-md sm:rounded-2xl sm:px-10">
          {/* Success Message */}
          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaCheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Password reset successfully! Redirecting to login...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!success ? (
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  New Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    ref={passwordRef}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`appearance-none block w-full pl-10 pr-10 py-2 border ${
                      errors.password ? 'border-red-300' : 'border-slate-300'
                    } rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-slate-400 hover:text-slate-500" />
                    ) : (
                      <FaEye className="h-5 w-5 text-slate-400 hover:text-slate-500" />
                    )}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="grid grid-cols-4 gap-2 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 rounded-full ${
                            i <= strength
                              ? strength < 2
                                ? 'bg-red-500'
                                : strength < 4
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-slate-200'
                          }`}
                        ></div>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500">
                      {strength < 2 && 'Weak - '}
                      {strength === 2 && 'Fair - '}
                      {strength === 3 && 'Good - '}
                      {strength === 4 && 'Strong - '}
                      {!password
                        ? 'Enter a password'
                        : strength < 2
                        ? 'Add more characters, numbers, or symbols'
                        : strength < 4
                        ? 'Good, but could be stronger'
                        : 'Great password!'}
                    </div>
                  </div>
                )}

                {errors.password && touched.password && (
                  <p className="mt-2 text-sm text-red-600" id="password-error">
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm New Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`appearance-none block w-full pl-10 pr-10 py-2 border ${
                      errors.confirmPassword ? 'border-red-300' : 'border-slate-300'
                    } rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-slate-400 hover:text-slate-500" />
                    ) : (
                      <FaEye className="h-5 w-5 text-slate-400 hover:text-slate-500" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600" id="confirm-password-error">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isFormValid && !isSubmitting
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-indigo-400 cursor-not-allowed'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting password...
                    </>
                  ) : (
                    'Reset password'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-sm text-slate-600">Redirecting to login page...</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

