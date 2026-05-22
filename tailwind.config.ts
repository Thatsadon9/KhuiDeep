import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: "var(--paper, #fffdf7)",
          100: "var(--paper-100, #fbf3df)",
          200: "var(--paper-200, #f2dfba)",
          300: "var(--paper-300, #e5c690)",
        },
        ink: {
          700: "var(--ink-700, #3f352d)",
          800: "var(--ink-800, #2f2925)",
          900: "var(--ink-900, #211d1a)",
        },
        doodle: {
          mint: "#ccebd9",
          peach: "#ffd5bd",
          lemon: "#f7e7a7",
          rose: "#f3b8c6",
          sky: "#b9d9f2",
          lilac: "#d9c9ef",
        },
      },
      fontFamily: {
        body: ["var(--font-noto-thai)", "system-ui", "sans-serif"],
        hand: ["var(--font-mali)", "var(--font-noto-thai)", "cursive"],
      },
      boxShadow: {
        sketch: "5px 7px 0 rgba(47, 41, 37, 0.16)",
        "sketch-soft": "3px 5px 0 rgba(47, 41, 37, 0.1)",
        tape: "0 6px 18px rgba(47, 41, 37, 0.12)",
      },
      borderRadius: {
        sketch: "24px 18px 22px 16px",
        note: "18px 22px 17px 24px",
      },
      backgroundImage: {
        paper:
          "radial-gradient(circle at 1px 1px, rgba(63,53,45,0.08) 1px, transparent 0)",
        notebook:
          "linear-gradient(rgba(63,53,45,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        paper: "22px 22px",
        notebook: "100% 34px",
      },
      keyframes: {
        "float-note": {
          "0%, 100%": { transform: "rotate(-1.5deg) translateY(0)" },
          "50%": { transform: "rotate(1deg) translateY(-8px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1.5deg)" },
        },
        "ink-pop": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "float-note": "float-note 7s ease-in-out infinite",
        wiggle: "wiggle 0.7s ease-in-out",
        "ink-pop": "ink-pop 0.28s ease-out both",
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        ".sketch-border": {
          border: "2px solid #2f2925",
          borderRadius: "24px 18px 22px 16px",
          boxShadow:
            "5px 7px 0 rgba(47, 41, 37, 0.16), inset 0 0 0 1px rgba(47, 41, 37, 0.05)",
        },
        ".sketch-border-thin": {
          border: "1.5px solid #2f2925",
          borderRadius: "16px 22px 15px 20px",
        },
        ".paper-tilt-left": {
          transform: "rotate(-1.3deg)",
        },
        ".paper-tilt-right": {
          transform: "rotate(1.1deg)",
        },
      });
    }),
  ],
};

export default config;
