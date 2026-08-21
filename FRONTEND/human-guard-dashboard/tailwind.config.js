/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        main: "var(--bg-main)",
        card: "var(--bg-card)",
        "text-main": "var(--text-main)",
        muted: "var(--text-muted)",
        "theme-border": "var(--border-color)",
        accent: "var(--accent)",
      },
    },
  },
  plugins: [],
};