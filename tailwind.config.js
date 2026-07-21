/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          600: 'var(--brand-600)',
          500: 'var(--brand-500)',
          400: 'var(--brand-400)',
        },
        indigo: {
          600: 'var(--indigo-600)',
          500: 'var(--indigo-500)',
        },
        slate: {
          50: 'var(--slate-50)',
          100: 'var(--slate-100)',
          200: 'var(--slate-200)',
          300: 'var(--slate-300)',
          400: 'var(--slate-400)',
          500: 'var(--slate-500)',
          600: 'var(--slate-600)',
          700: 'var(--slate-700)',
          800: 'var(--slate-800)',
          850: 'var(--slate-850)',
          900: 'var(--slate-900)',
          950: 'var(--slate-950)',
        },
        emerald: {
          500: 'var(--emerald-500)',
        },
        amber: {
          500: 'var(--amber-500)',
        },
        rose: {
          500: 'var(--rose-500)',
        },
        blue: {
          500: 'var(--blue-500)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
      }
    },
  },
  plugins: [],
}
