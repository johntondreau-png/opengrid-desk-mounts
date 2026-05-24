import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Georgia", "serif"],
      },
      colors: {
        cream: "#F4F1EA",
        ink: "#1A1614",
        terracotta: "#C45A3D",
        spice1: "#FFEDC2",
        spice2: "#F7B267",
        spice3: "#E76F51",
        spice4: "#7B2D26",
      },
    },
  },
  plugins: [],
} satisfies Config;
