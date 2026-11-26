import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: { colors: { kitchen: { bg: "#171A18", surface: "#222824", elevated: "#2B332D", sage: "#A6C6A0", cream: "#F3EFE5", muted: "#A5ADA5" } }, fontFamily: { sans: ["Arial", "Helvetica", "sans-serif"] } } },
  plugins: []
};
export default config;