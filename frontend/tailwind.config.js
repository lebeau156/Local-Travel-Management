/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        usda: {
          blue: '#0033A0',
          green: '#00843D',
          gray: '#54585A',
        }
      }
    },
  },
  plugins: [],
}
