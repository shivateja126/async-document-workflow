import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', '"Satoshi"', '"Avenir Next"', "sans-serif"],
        body: ['"Manrope"', '"Satoshi"', '"Avenir Next"', "sans-serif"]
      },
      colors: {
        shell: "rgb(var(--shell) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        panelStrong: "rgb(var(--panel-strong) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accentSoft: "rgb(var(--accent-soft) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        appBg: "rgb(var(--app-bg) / <alpha-value>)",
        appBgSecondary: "rgb(var(--app-bg-secondary) / <alpha-value>)",
        appSurface: "rgb(var(--app-surface) / <alpha-value>)",
        appSurfaceStrong: "rgb(var(--app-surface-strong) / <alpha-value>)",
        appBorder: "rgb(var(--app-border) / <alpha-value>)",
        appText: "rgb(var(--app-text) / <alpha-value>)",
        appTextMuted: "rgb(var(--app-text-muted) / <alpha-value>)",
        brand: "rgb(var(--brand-primary) / <alpha-value>)",
        brandSecondary: "rgb(var(--brand-secondary) / <alpha-value>)",
        brandSuccess: "rgb(var(--brand-success) / <alpha-value>)",
        brandDanger: "rgb(var(--brand-danger) / <alpha-value>)"
      },
      boxShadow: {
        glow: "0 12px 60px rgba(10, 132, 255, 0.18)",
        glass: "0 20px 60px rgba(15, 23, 42, 0.18)",
        panel: "0 24px 80px rgba(2, 6, 23, 0.45)",
        button: "0 14px 32px rgba(99, 102, 241, 0.28)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at 20% 20%, rgba(93, 135, 255, 0.22), transparent 35%), radial-gradient(circle at 80% 0%, rgba(57, 209, 201, 0.18), transparent 30%), radial-gradient(circle at 50% 100%, rgba(255, 140, 92, 0.16), transparent 40%)",
        appGlow:
          "radial-gradient(circle at top left, rgba(99, 102, 241, 0.22), transparent 28%), radial-gradient(circle at top right, rgba(139, 92, 246, 0.18), transparent 24%), linear-gradient(180deg, rgba(17, 24, 39, 0.72), rgba(11, 15, 25, 0.95))"
      }
    }
  },
  plugins: []
};

export default config;
