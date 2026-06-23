/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Vert profond — couleur principale (cockpit financier privé)
        forest: {
          50: "#f1f6f3",
          100: "#dce9e1",
          200: "#bad3c5",
          300: "#8eb5a1",
          400: "#5f9079",
          500: "#3f725c",
          600: "#2f5a48",
          700: "#27483b",
          800: "#1f3a30",
          900: "#142b22",
        },
        // Or — réservé aux dividendes / mises en valeur
        gold: {
          400: "#d9b25a",
          500: "#c79a3e",
          600: "#a87e2c",
        },
        gain: "#2f8f5b", // vert pour les gains
        loss: "#a8412e", // rouge brique pour les pertes
        parchment: "#f7f5ef", // fond papier
        ink: "#1c2620", // texte foncé
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'SFMono-Regular'", "ui-monospace", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
