/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB', 50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE',
          300: '#93C5FD', 400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB',
          700: '#1D4ED8', 800: '#1E40AF', 900: '#1E3A8A', 950: '#172554',
        },
        surface: { DEFAULT: '#FFFFFF', muted: '#F8FAFC', subtle: '#F1F5F9' },
        border:  { DEFAULT: '#E2E8F0', strong: '#CBD5E1' },
        text: {
          primary: '#0F172A', secondary: '#475569', muted: '#94A3B8', inverse: '#FFFFFF',
        },
        success: { DEFAULT: '#16A34A', light: '#F0FDF4', text: '#15803D' },
        warning: { DEFAULT: '#D97706', light: '#FFFBEB', text: '#B45309' },
        danger:  { DEFAULT: '#DC2626', light: '#FEF2F2', text: '#B91C1C' },
        info:    { DEFAULT: '#0EA5E9', light: '#F0F9FF', text: '#0284C7' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] },
      fontSize: { '2xs': ['0.625rem', { lineHeight: '0.875rem' }] },
      boxShadow: {
        card:  '0 1px 3px 0 rgba(0,0,0,.08), 0 1px 2px -1px rgba(0,0,0,.06)',
        modal: '0 20px 25px -5px rgba(0,0,0,.10), 0 8px 10px -6px rgba(0,0,0,.10)',
      },
      borderRadius: { xl: '0.75rem', '2xl': '1rem' },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-in-r': 'slideInRight 0.2s ease-out',
        'slide-in-up': 'slideInUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideInRight: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        slideInUp: { from: { transform: 'translateY(8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
