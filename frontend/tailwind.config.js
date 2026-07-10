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
        bgDark: '#0A0A0A',
        surfaceDark: '#161616',
        surfaceLight: '#1C1C1E',
        accentBlue: '#3B82F6',
        borderLight: 'rgba(255, 255, 255, 0.08)',
        textPrimary: '#FAFAFA',
        textSecondary: '#A1A1A6'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 15px rgba(59, 130, 246, 0.15)',
      }
    },
  },
  plugins: [],
}
