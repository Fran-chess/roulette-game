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
        "azul-intenso": "#192A6E",
        "verde-salud": "#5ACCC1",
        "celeste-medio": "#40C0EF",
        "amarillo-ds": "#F2BD35",
        "rosado-lila": "#D5A7CD",
        "main-dark": "#121F4B",
      },
      fontFamily: {
        sans: ["Marine-Regular", "sans-serif"],
        marineBold: ["Marine-Bold", "sans-serif"],
        marineBlack: ["Marine-Black", "sans-serif"],
      },
      animation: {
        "pulse-once": "pulseCustom 1s cubic-bezier(0.4, 0, 0.6, 1) 1", // Renombrado para evitar conflicto con pulse de Tailwind
      },
      keyframes: {
        pulseCustom: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: ".8", transform: "scale(1.03)" }, // Ajuste sutil
        },
      },
    },
  },
  plugins: [],
};
export default config;
