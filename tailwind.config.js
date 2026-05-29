/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F9FA',
        surface: '#FFFFFF',
        surfaceLight: '#F1F3F5',
        primary: '#F5C518',
        primaryHover: '#D4AA14',
        textMain: '#0F172A',
        textMuted: '#475569',
        borderLine: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
