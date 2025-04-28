/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: {
          900: '#121212', // Replacing #2e2a38 with #121212
          800: '#1e1e1e',
          700: '#2d2d2d',
          600: '#3d3d3d'
        }
      }
    },
  },
  plugins: [],
};
