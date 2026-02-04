import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FFF8F0",
          100: "#FFEDDB",
          200: "#FFDBB7",
          300: "#F0C999",
          400: "#D4A574",
          500: "#C49A6C",
          600: "#A67C52",
          700: "#8B6340",
          800: "#6B4D33",
          900: "#4A3524",
        },
        surface: {
          900: "#0A0A0F",
          800: "#12121A",
          700: "#1A1A2E",
          600: "#222236",
          500: "#2A2A40",
          400: "#33334D",
          300: "#3D3D5C",
        },
        accent: {
          warm: "#E8B87D",
          gold: "#D4A574",
          copper: "#B87333",
          rose: "#C9A0A0",
          amber: "#FFBF69",
        },
        scent: {
          citrus: "#FFD93D",
          floral: "#FF6B9D",
          woody: "#8B6914",
          fresh: "#6EC6FF",
          oriental: "#FF6B35",
          musk: "#C9B1FF",
          green: "#7BC67E",
          fruity: "#FF8FA3",
          spicy: "#FF4444",
          aquatic: "#4ECDC4",
          gourmand: "#D4956A",
          leather: "#6B3A2A",
          aromatic: "#82C46C",
          amber: "#FFAA33",
          powdery: "#E8D5E0",
          earthy: "#8B7355",
          smoky: "#6B6B6B",
          herbal: "#A0C55F",
          animalic: "#7A5C3E",
          balsamic: "#CC8844",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "monospace",
        ],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(212, 165, 116, 0.15)",
        "glow-lg": "0 0 40px rgba(212, 165, 116, 0.2)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
