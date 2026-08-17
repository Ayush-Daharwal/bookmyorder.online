/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F2F7F4',
          100: '#E1EFE7',
          500: '#2E6B4E',
          700: '#1B4D36',
          800: '#14382B',
          900: '#0C241B',
        },
        terracotta: {
          500: '#FF5722',
          600: '#D84315',
          700: '#BF360C',
        },
        sand: {
          50: '#FAF8F5',
          100: '#F4EFE6',
          200: '#E8E1D1',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
