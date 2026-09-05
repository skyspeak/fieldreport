import type { Config } from "tailwindcss";

/** dearCC theme. Coral is the only chromatic color, and it marks state, never a
 *  control fill: coral on #F1F1F1 is 2.74:1 and fails WCAG 1.4.11. See DESIGN.md. */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        coral: "#FF5A3D",        // state and highlight only
        ink: "#000000",          // every filled control
        paper: "#F1F1F1",        // a surface you act on
        page: "#EDEDED",
        muted: "#5C5C5C",
        line: "#E2E2E2",
        placeholder: "#9A9A9A",
      },
      // three sizes in the product, nothing else
      fontSize: {
        t1: ["27px", { lineHeight: "1.12", letterSpacing: "-0.028em" }],
        t2: ["14px", { lineHeight: "1.5" }],
        t3: ["11.5px", { lineHeight: "1.4" }],
      },
      borderRadius: {
        chip: "6px",
        control: "8px",
        card: "12px",
      },
      borderWidth: {
        hairline: "1px",
        emphasis: "2px",
        frame: "3px",
      },
      spacing: {
        item: "10px",            // item to item in a stack
        block: "18px",           // paragraph to paragraph
        section: "36px",         // a category break
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      letterSpacing: { heading: "-0.028em", label: "0.14em" },
      boxShadow: { none: "none" },   // the system has no shadows
      keyframes: {
        "cc-bob":   { "0%,100%": { transform: "translateY(0)" },
                      "46%":     { transform: "translateY(-5px)" } },
        "cc-pulse": { "0%,100%": { opacity: ".25", transform: "scale(.8)" },
                      "50%":     { opacity: "1", transform: "scale(1)" } },
      },
      animation: {
        "cc-bob": "cc-bob 3.2s ease-in-out infinite",
        "cc-pulse": "cc-pulse 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
