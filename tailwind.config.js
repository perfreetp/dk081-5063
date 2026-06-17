/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#2563EB",
          600: "#1E3A5F",
          700: "#1E40AF",
          800: "#1E3A8A",
          900: "#1E3A5F",
        },
        success: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
        },
        warning: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
        },
        danger: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
        neutral: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
      },
      fontSize: {
        xs: ["14px", "20px"],
        sm: ["16px", "24px"],
        base: ["18px", "28px"],
        lg: ["20px", "30px"],
        xl: ["24px", "36px"],
        "2xl": ["28px", "40px"],
        "3xl": ["32px", "44px"],
        "4xl": ["40px", "52px"],
      },
      spacing: {
        18: "72px",
        22: "88px",
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        card: "0 4px 20px -4px rgba(0, 0, 0, 0.1)",
        button: "0 2px 8px -2px rgba(0, 0, 0, 0.15)",
      },
    },
  },
  plugins: [],
};
