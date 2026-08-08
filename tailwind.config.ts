import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#05060a",
          soft: "#0a0d16",
        },
        nebula: {
          DEFAULT: "#0b1020",
          deep: "#111834",
        },
        cyan: {
          glow: "#22d3ee",
          soft: "rgba(34, 211, 238, 0.35)",
          dim: "rgba(34, 211, 238, 0.12)",
        },
        amber: {
          hud: "#f5a524",
          dim: "rgba(245, 165, 36, 0.25)",
        },
        ink: {
          primary: "#e2e8f0",
          secondary: "#8b96ac",
          faint: "#4b5468",
        },
        line: {
          DEFAULT: "rgba(148, 163, 184, 0.16)",
          soft: "rgba(148, 163, 184, 0.08)",
        },
        sun: {
          core: "#fff8e1",
          mid: "#ffc857",
          base: "#f5a524",
          edge: "#b45309",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        "cyan-glow": "0 0 24px rgba(34, 211, 238, 0.45), 0 0 64px rgba(34, 211, 238, 0.15)",
        "cyan-glow-sm": "0 0 12px rgba(34, 211, 238, 0.35)",
      },
      letterSpacing: {
        widest2: "0.28em",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(2%, -3%, 0) scale(1.05)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.08)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        drift: "drift 26s ease-in-out infinite",
        breathe: "breathe 4.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
