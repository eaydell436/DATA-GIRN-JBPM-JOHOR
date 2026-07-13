/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bomba: {
          50: '#FFF5F5',
          100: '#FFE0E0',
          200: '#FFB3B3',
          300: '#FF8080',
          400: '#FF4D4D',
          500: '#E60000',
          600: '#CC0000',
          700: '#B30000',
          800: '#990000',
          900: '#800000',
          950: '#4D0000',
        },
        gold: {
          400: '#FFD54F',
          500: '#FFCA28',
          600: '#FFC107',
          700: '#FFB300',
          800: '#FFA000',
        },
        maroon: {
          800: '#1A0A0A',
          900: '#120606',
          950: '#0A0202',
        },
        silver: {
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
        },
      },      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite',
        'fire-flicker': 'fire-flicker 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(204, 0, 0, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(204, 0, 0, 0.8), 0 0 60px rgba(255, 193, 7, 0.3)' },
        },
        'fire-flicker': {
          '0%, 100%': { opacity: '1' },
          '25%': { opacity: '0.85' },
          '50%': { opacity: '1' },
          '75%': { opacity: '0.9' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'hex-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23cc0000' fill-opacity='0.03'%3E%3Cpath d='M20 0l17.32 10v20L20 40 2.68 30V10L20 0z'/%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};