import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        'tablet-sm': '601px',
        'tablet-md': '768px',
        'tablet-lg': '1024px',
        'tv-sm': '1025px',
        'tv-md': '1440px',
        'tv-lg': '1920px',
        'tv-xl': '2560px',
      },
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
      spacing: {
        'touch-sm': '0.75rem',
        'touch-md': '1.5rem',
        'touch-lg': '2.5rem',
        'touch-xl': '3.5rem',
      },
      fontSize: {
        'touch-xs': ['0.875rem', { lineHeight: '1.25rem' }],
        'touch-sm': ['1rem', { lineHeight: '1.5rem' }],
        'touch-base': ['1.125rem', { lineHeight: '1.75rem' }],
        'touch-lg': ['1.375rem', { lineHeight: '2rem' }],
        'touch-xl': ['1.75rem', { lineHeight: '2.25rem' }],
        'touch-2xl': ['2.25rem', { lineHeight: '2.75rem' }],
        'touch-3xl': ['3rem', { lineHeight: '3.5rem' }],
        'touch-4xl': ['4rem', { lineHeight: '4.5rem' }],
      },
      borderRadius: {
        'touch-sm': '6px',
        'touch-md': '8px',
        'touch-lg': '12px',
        'touch-xl': '16px',
        'touch-2xl': '20px',
      },
      boxShadow: {
        'touch-sm': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'touch-md': '0 8px 25px rgba(0, 0, 0, 0.15)',
        'touch-lg': '0 12px 35px rgba(0, 0, 0, 0.25)',
        'touch-xl': '0 16px 45px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        "pulse-once": "pulseCustom 1s cubic-bezier(0.4, 0, 0.6, 1) 1",
        "tv-pulse": "tv-pulse 2s infinite",
        "tablet-bounce": "tablet-bounce 0.3s ease-out",
        "touch-hover": "touch-hover 0.2s ease",
      },
      keyframes: {
        pulseCustom: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: ".8", transform: "scale(1.03)" },
        },
        "tv-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.9" },
        },
        "tablet-bounce": {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
          "100%": { transform: "translateY(0)" },
        },
        "touch-hover": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-2px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
