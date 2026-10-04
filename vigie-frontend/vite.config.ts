import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Le proxy évite les problèmes CORS en développement :
// le front appelle /api/... et Vite relaie vers Django.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
      "/media": "http://localhost:8000",
      "/sitemap.xml": "http://localhost:8000",
      "/robots.txt": "http://localhost:8000",
      "/feed.xml": "http://localhost:8000",
    },
  },
});
