import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#161c1a",
        surface: "#1f2725",
        ink: "#e3e2da",
        muted: "#8e948d",
        accent: "#9fc7b8",
        accentInk: "#161c1a",
        cream: {
          DEFAULT: "#161c1a",
          2: "#1f2725",
          3: "#28322f",
        },
        sage: {
          DEFAULT: "#9fc7b8",
          light: "#b8d8cc",
          pale: "#23302c",
          dark: "#7fa999",
        },
        charcoal: {
          DEFAULT: "#e3e2da",
          2: "#c2c4bc",
          muted: "#8e948d",
        },
        dust: {
          DEFAULT: "#9fc7b8",
          light: "#b8d8cc",
          pale: "#1f2725",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        body: ['"Be Vietnam Pro"', "system-ui", "sans-serif"],
        app: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
