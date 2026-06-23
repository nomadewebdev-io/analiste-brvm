import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Le frontend appelle /api/* — proxy vers le backend local (port 8787 par défaut).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
