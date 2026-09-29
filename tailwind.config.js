
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },

      colors: {
        // Brand colors matching landing page
        brand: {
          primary: {
            DEFAULT: '#4f46e5', // indigo-600
            light: '#6366f1', // indigo-500
            dark: '#4338ca', // indigo-700
            lighter: '#818cf8', // indigo-400
            darkest: '#312e81', // indigo-800
          },
          secondary: {
            DEFAULT: '#9333ea', // purple-600
            light: '#a855f7', // purple-500
            dark: '#7e22ce', // purple-700
            lighter: '#c084fc', // purple-400
            darkest: '#6b21a8', // purple-800
          },
          gradient: {
            from: '#4f46e5', // indigo-600
            to: '#9333ea', // purple-600
            fromHover: '#4338ca', // indigo-700
            toHover: '#7e22ce', // purple-700
          },
          background: {
            light: '#eef2ff', // indigo-50
            lighter: '#f5f3ff', // purple-50
            subtle: '#f8fafc', // slate-50
          },
          surface: {
            DEFAULT: '#ffffff',
            hover: '#f9fafb', // gray-50
            border: '#e5e7eb', // gray-200
            borderLight: '#f3f4f6', // gray-100
          },
          text: {
            primary: '#111827', // gray-900
            secondary: '#374151', // gray-700
            tertiary: '#6b7280', // gray-500
            muted: '#9ca3af', // gray-400
            inverse: '#ffffff',
          },
        },
      },

      // One content width for the whole site: header, footer, landing sections and dashboard
      maxWidth: {
        site: '84rem',
      },

      // Used by PaymentResultModal
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'modal-pop': {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.95)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'badge-pop': {
          '0%': { transform: 'scale(0)' },
          '70%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)' },
        },
        'draw-check': {
          from: { strokeDashoffset: '34' },
          to: { strokeDashoffset: '0' },
        },
        'confetti-fall': {
          from: { transform: 'translateY(-20px) rotate(0deg)', opacity: '1' },
          to: { transform: 'translateY(170px) rotate(600deg)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'modal-pop': 'modal-pop 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'badge-pop': 'badge-pop 0.45s ease-out 0.1s both',
        'draw-check': 'draw-check 0.4s ease-out 0.45s both',
        'confetti-fall': 'confetti-fall 2.4s ease-in 0s 2 both',
      },
    },
  },
  plugins: [],
};
