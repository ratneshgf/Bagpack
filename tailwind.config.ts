import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        // TripWise brand palette: black, red, and warm beige
        bg: {
          base: "#0A0A0A",
          surface: "#111111",
          card: "#1A1A1A",
          elevated: "#222222",
          border: "#2E2E2E",
        },
        // Legacy names kept as semantic aliases for existing components
        violet: {
          50: "#FDECEC", 100: "#FBD5D5", 200: "#F8B4B4", 300: "#F58A8A",
          400: "#F87171", 500: "#EF4444", 600: "#DC2626", 700: "#B91C1C",
          800: "#991B1B", 900: "#7F1D1D",
        },
        teal: {
          50: "#FBF5EE", 100: "#F5E6D3", 200: "#E8D5BD", 300: "#D4B896",
          400: "#C6A982", 500: "#A89070", 600: "#8F765A", 700: "#735E48",
          800: "#584735", 900: "#3D3024",
        },
        orange: {
          500: "#EF4444",
          600: "#DC2626",
        },
        // Text
        text: {
          primary: "#F5E6D3",
          secondary: "#D4B896",
          muted: "#A89070",
          disabled: "#6E5F50",
        },
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(108, 99, 255, 0.25) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(0, 217, 192, 0.15) 0%, transparent 60%)",
        "card-gradient": "linear-gradient(135deg, rgba(28, 28, 40, 0.9) 0%, rgba(22, 22, 31, 0.95) 100%)",
        "violet-gradient": "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
        "teal-gradient": "linear-gradient(135deg, #A89070 0%, #D4B896 100%)",
        "mixed-gradient": "linear-gradient(135deg, #DC2626 0%, #D4B896 100%)",
      },
      boxShadow: {
        "glow-violet": "0 0 40px rgba(220, 38, 38, 0.25)",
        "glow-teal": "0 0 40px rgba(212, 184, 150, 0.2)",
        "card": "0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.04) inset",
        "card-hover": "0 8px 40px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.06) inset",
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2s linear infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};

export default config;
