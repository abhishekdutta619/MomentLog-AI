import type { Config } from "tailwindcss";

// No gradients anywhere in this palette — see docs/PRD.md, Section 5.
// Colors are CSS variables (globals.css) so dark mode is a variable swap,
// not a second set of Tailwind classes scattered through components.
//
// Each color is wrapped in rgb(var(--x) / <alpha-value>) rather than a
// bare var(--x) reference — this is what lets opacity-modifier utilities
// (bg-foreground/20, text-foreground/50, etc.) actually work. Tailwind
// substitutes <alpha-value> with whatever comes after the slash at build
// time; it can only do that because globals.css stores these variables as
// space-separated RGB channels, not hex strings.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--color-muted) / <alpha-value>)",
          foreground: "rgb(var(--color-muted-foreground) / <alpha-value>)",
        },
        border: "rgb(var(--color-border) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;