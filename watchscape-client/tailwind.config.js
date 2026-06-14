export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in':        'fadeIn 0.4s ease-out',
        'fade-in-up':     'fadeInUp 0.5s ease-out',
        'fade-in-down':   'fadeInDown 0.4s ease-out',
        'scale-in':       'scaleIn 0.3s ease-out',
        'heart-beat':     'heartBeat 0.4s ease-in-out',
        'float':          'float 3s ease-in-out infinite',
        'spin-slow':      'spin-slow 8s linear infinite',
        'gradient-x':     'gradient-x 4s ease infinite',
        'shimmer':        'shimmer 1.5s infinite linear',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeInUp:  { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeInDown:{ from: { opacity: '0', transform: 'translateY(-20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        heartBeat: {
          '0%':   { transform: 'scale(1)' },
          '25%':  { transform: 'scale(1.3)' },
          '50%':  { transform: 'scale(1.1)' },
          '75%':  { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
        float:     { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'spin-slow':{ from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      boxShadow: {
        'brand': '0 4px 24px -4px rgba(124, 58, 237, 0.4)',
        'brand-lg': '0 8px 40px -8px rgba(124, 58, 237, 0.5)',
        'dark': '0 4px 24px rgba(0,0,0,0.4)',
        'dark-lg': '0 8px 40px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
