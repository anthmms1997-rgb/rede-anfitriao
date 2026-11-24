/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#061021',
          900: '#0B1D3A',
          800: '#12294D',
          700: '#1B3A6B',
        },
        gold: {
          400: '#E5C158',
          500: '#D4AF37',
          600: '#B59226',
        }
      }
    },
  },
  plugins: [],
}