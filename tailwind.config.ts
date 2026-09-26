import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neer: {
          navy: "#0B192C",
          "navy-light": "#1E293B",
          dark: "#0F172A",
          accent: "#0284C7",
          "accent-light": "#38BDF8",
          sky: "#E0F2FE",
          danger: "#EF4444",
          warning: "#F59E0B",
          success: "#10B981",
          card: "#FFFFFF",
          "card-muted": "#F8FAFC",
        },
      },
    },
  },
  plugins: [],
};
export default config;
