/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f2f8f4",
          100: "#e0efe5",
          200: "#c2dfcc",
          300: "#96c7a8",
          400: "#63a87f",
          500: "#3f8b60",
          600: "#2d6f4b",
          700: "#24583d",
          800: "#1e4732",
          900: "#193b2a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};