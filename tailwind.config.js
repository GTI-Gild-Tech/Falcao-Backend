/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#2196f3',
          500: '#1e88e5',
          600: '#1976d2',
          700: '#1565c0',
          800: '#0d47a1',
          900: '#08274a',
          950: '#042645',
        },
        'background-light': '#f5f8f7',
        'background-dark': '#102219',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      screens: {
        'xs': '480px',
        'custom': '760px',
      },
    },
  },
  plugins: [],
};
