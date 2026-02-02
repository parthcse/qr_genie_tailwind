import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

import Link from 'next/link';
import { FaEye, FaEyeSlash, FaExclamationCircle, FaQrcode } from 'react-icons/fa';
// Custom hook for form state management
const useLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  // Validate email format
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Form validation
  const errors = {
    email: touched.email && !email ? 'Email is required' : 
           touched.email && !validateEmail(email) ? 'Please enter a valid email' : '',
    password: touched.password && !password ? 'Password is required' : ''
  };

  const isFormValid = validateEmail(email) && password && !isSubmitting;

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    setError,
    isSubmitting,
    setIsSubmitting,
    showPassword,
    setShowPassword,
    touched,
    setTouched,
    errors,
    isFormValid
  };
};

export default function Login() {
  const router = useRouter();
  const emailRef = useRef(null);
  const errorRef = useRef(null);
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    setError,
    isSubmitting,
    setIsSubmitting,
    showPassword,
    setShowPassword,
    touched,
    setTouched,
    errors,
    isFormValid
  } = useLoginForm();

  // Focus email input on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Mark fields as touched to show validation errors
    setTouched({ email: true, password: true });
    
    if (!isFormValid) return;
    
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password.trim() 
        }),
        credentials: 'same-origin' // Important for cookies
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      if (!response.ok) {
        let errorMessage = 'Login failed. Please try again.';
        
        if (isJson) {
          try {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
            
            switch (response.status) {
              case 400:
                errorMessage = data.error || 'Invalid request';
                break;
              case 401:
                errorMessage = 'Invalid email or password';
                break;
              case 429:
                errorMessage = 'Too many attempts. Please try again later.';
                break;
              default:
                errorMessage = data.error || 'Login failed. Please try again.';
            }
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            errorMessage = `Server error (${response.status}). Please try again later.`;
          }
        } else {
          // Response is HTML (error page) - extract text or use status
          try {
            const text = await response.text();
            console.error('Non-JSON error response:', text.substring(0, 200));
            errorMessage = `Server error (${response.status}). Please contact support if this persists.`;
          } catch (textError) {
            errorMessage = `Server error (${response.status}). Please try again later.`;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Parse successful response
      if (isJson) {
        try {
          const data = await response.json();
          // Success - redirect to dashboard
          router.push('/dashboard');
        } catch (parseError) {
          console.error('Failed to parse success response:', parseError);
          // Even if parsing fails, redirect if status is 200
          if (response.status === 200) {
            router.push('/dashboard');
          } else {
            throw new Error('Unexpected response format');
          }
        }
      } else {
        // Non-JSON success response (shouldn't happen, but handle gracefully)
        console.warn('Received non-JSON success response');
        router.push('/dashboard');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login. Please try again.');
      errorRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input change with trimming
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Handle input blur
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <FaQrcode className="h-7 w-7 text-white" />
            </div>
            <span className="ml-3 text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              QR-Genie
            </span>
          </Link>
          <h2 className="text-4xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <a href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-700">
              create a new account
            </a>
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-indigo-100">
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

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full px-3 py-2 border ${

                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && touched.email && (
                <p className="mt-2 text-sm text-red-600" id="email-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="text-sm">
                  <a href="/auth/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full px-3 py-2 border ${

                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10`}
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

                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  )}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="mt-2 text-sm text-red-600" id="password-error">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}

                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white transition-all duration-200 ${
                  isFormValid && !isSubmitting
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl'
                    : 'bg-indigo-400 cursor-not-allowed'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>


      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}