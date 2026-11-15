/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F172A',
          teal: '#0D9488',
          tealDark: '#0F766E',
          tealLight: '#F0FDFA',
        },
      },
      minHeight: {
        '14': '3.5rem', // 56px
        '16': '4rem',   // 64px
      },
    },
  },
  plugins: [],
}
