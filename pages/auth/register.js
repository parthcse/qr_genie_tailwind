import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';

// Custom hook for form state management
const useFormState = (initialState) => {
  const [state, setState] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({ ...prev, [name]: value.trim() }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  return {
    state,
    errors,
    touched,
    isSubmitting,
    submitError,
    setErrors,
    setTouched,
    setIsSubmitting,
    setSubmitError,
    handleChange,
    handleBlur,
  };
};

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

  return {
    strength,
    feedback: {
      minLength: hasMinLength,
      hasNumber,
      hasLetter,
      hasSpecialChar,
    }
  };
};

export default function Register() {
  const router = useRouter();
  const firstErrorRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { 
    state, 
    errors, 
    touched, 
    isSubmitting, 
    submitError,
    setErrors, 
    setTouched,
    setIsSubmitting,
    setSubmitError,
    handleChange, 
    handleBlur 
  } = useFormState({ 
    email: '', 
    name: '', 
    password: '',
    confirmPassword: ''
  });

  // Validate form fields
  useEffect(() => {
    const newErrors = {};
    
    // Email validation
    if (state.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Name validation
    if (state.name && state.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    // Password validation
    if (state.password) {
      const { strength } = checkPasswordStrength(state.password);
      if (strength < 3) {
        newErrors.password = 'Password is too weak';
      }
    }
    
    // Confirm password
    if (state.password && state.confirmPassword && state.password !== state.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
  }, [state, setErrors]);

  // Focus first error on validation
  useEffect(() => {
    if (isMounted && Object.keys(errors).length > 0) {
      const firstError = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstError}"]`);
      if (element) {
        element.focus();
      }
    }
    setIsMounted(true);
  }, [errors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    // Mark all fields as touched to show validation messages
    const allTouched = Object.keys(state).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    // Check for any validation errors
    const hasErrors = Object.keys(errors).some(key => errors[key]);
    if (hasErrors) return;
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: state.email.trim(),
          name: state.name.trim(),
          password: state.password.trim()
        }),
      });
      
      // CRITICAL: Clone response to read it multiple times if needed
      // This prevents "body already consumed" errors
      const responseClone = res.clone();
      
      // CRITICAL: Check Content-Type BEFORE attempting to parse JSON
      // This prevents "Unexpected token 'I'" error when server returns HTML
      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      
      // Helper function to safely extract error message
      const getErrorMessage = async (response, isJsonResponse) => {
        try {
          if (isJsonResponse) {
            // Try to parse as JSON first
            const data = await response.json();
            return data.error || data.message || 'Registration failed. Please try again.';
          } else {
            // Not JSON - read as text (but don't show HTML to user)
            const text = await response.text();
            console.error('Non-JSON error response:', text.substring(0, 200));
            // Return user-friendly message instead of HTML
            return `Server error (${response.status}). Please try again later.`;
          }
        } catch (error) {
          // If parsing fails completely, return generic error
          console.error('Failed to parse error response:', error);
          return `Server error (${response.status}). Please try again later.`;
        }
      };
      
      // If response is not OK, handle error
      if (!res.ok) {
        let errorMessage = 'Registration failed. Please try again.';
        
        try {
          // Use cloned response to safely read the body
          errorMessage = await getErrorMessage(responseClone, isJson);
          
          // Handle specific error cases
          if (res.status === 400 && (errorMessage.includes('already exists') || errorMessage.includes('User already exists'))) {
            setErrors(prev => ({ ...prev, email: 'Email already in use' }));
            return;
          }
        } catch (error) {
          // If everything fails, use status-based message
          console.error('Error handling failed:', error);
          errorMessage = `Server error (${res.status}). Please try again later.`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Response is OK - parse success response
      let responseData = null;
      
      try {
        if (isJson) {
          // Try to parse as JSON
          responseData = await res.json();
        } else {
          // Not JSON - try to read as text (shouldn't happen, but handle gracefully)
          const text = await res.text();
          console.warn('Received non-JSON success response:', text.substring(0, 100));
          // If status is 201, assume success
          if (res.status === 201) {
            router.push('/dashboard');
            return;
          } else {
            throw new Error('Unexpected response format');
          }
        }
        
        // Check if registration was successful
        if (responseData && responseData.success !== false) {
          // Success - redirect to dashboard
          router.push('/dashboard');
        } else {
          // Server returned success status but success: false
          throw new Error(responseData?.error || responseData?.message || 'Registration failed');
        }
      } catch (parseError) {
        // If JSON parsing fails, check if it's a JSON parse error
        if (parseError instanceof SyntaxError || parseError.message.includes('JSON')) {
          console.error('JSON parsing error - server may have returned HTML:', parseError);
          // Try to read as text to see what we got
          try {
            const text = await responseClone.text();
            console.error('Response was:', text.substring(0, 200));
            throw new Error('Server returned invalid response. Please try again later.');
          } catch (textError) {
            throw new Error('Server error. Please try again later.');
          }
        } else {
          // Other error - if status is 201, assume success
          if (res.status === 201) {
            router.push('/dashboard');
          } else {
            throw parseError;
          }
        }
      }
      
    } catch (err) {
      console.error('Registration error:', err);
      
      // Extract user-friendly error message
      let userMessage = 'An error occurred during registration. Please try again.';
      
      if (err.message) {
        // Check if it's a JSON parsing error
        if (err.message.includes('Unexpected token') || err.message.includes('JSON')) {
          userMessage = 'Server returned an invalid response. Please try again later.';
        } else {
          // Use the error message if it's user-friendly
          userMessage = err.message;
        }
      }
      
      // Show user-friendly error message
      setSubmitError(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { strength, feedback } = checkPasswordStrength(state.password);
  const isFormValid = 
    state.email && 
    state.name && 
    state.password && 
    state.password === state.confirmPassword && 
    strength >= 3 &&
    !isSubmitting;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            sign in to your account
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {submitError && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1 relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={state.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
              </div>
              {errors.name && touched.name && (
                <p className="mt-2 text-sm text-red-600" id="name-error">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={state.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={state.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10`}
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
              
              {/* Password strength indicator */}
              {state.password && (
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
                            : 'bg-gray-200'
                        }`}
                      ></div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {strength < 2 && 'Weak - '}
                    {strength === 2 && 'Fair - '}
                    {strength === 3 && 'Good - '}
                    {strength === 4 && 'Strong - '}
                    {!state.password
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={state.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10`}
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
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="mt-2 text-sm text-red-600" id="confirm-password-error">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <a href="/terms" className="text-indigo-600 hover:text-indigo-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-indigo-600 hover:text-indigo-500">
                  Privacy Policy
                </a>
              </label>
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
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}