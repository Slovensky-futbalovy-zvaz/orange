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
        // Theme-aware design tokens (map to CSS variables)
        accent:      "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        "accent-ink":  "var(--accent-ink)",
        paper:       "var(--paper)",
        surface:     "var(--surface)",
        ink:         "var(--ink)",
        muted:       "var(--muted)",
        faint:       "var(--faint)",
        line:        "var(--line)",
        "side-bg":   "var(--side-bg)",
        "side-fg":   "var(--side-fg)",
        "side-active-bg": "var(--side-active-bg)",
        "side-active-fg": "var(--side-active-fg)",
        danger:      "var(--danger)",
        // Legacy orange palette (backward compat)
        orange: {
          50: "#fff7ed",
          100: "#ffedd5",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
        },
      },
      borderRadius: {
        theme: "var(--radius)",
      },
      fontFamily: {
        sans:   ["var(--font-manrope)", "system-ui", "sans-serif"],
        serif:  ["var(--font-instrument-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
