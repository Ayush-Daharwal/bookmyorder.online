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
          600: '#F25C05',
          700: '#D84315',
        },
        sand: {
          50: '#FAF7F2',
          100: '#F3EFE6',
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
