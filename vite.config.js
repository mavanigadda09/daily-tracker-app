import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),

    // ✅ PWA Plugin
    VitePWA({
      registerType: "autoUpdate",

      devOptions: {
        enabled: true // allows PWA in development
      },

      manifest: {
        name: "Daily Tracker App",
        short_name: "Tracker",
        description: "Track your daily tasks and progress",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",

        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ],

  // ===== PATH ALIAS =====
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },

  // ===== DEV SERVER =====
  server: {
    port: 5173,
    open: true,

    proxy: {
      "/api": {
        target: "https://daily-tracker-app-g96u.onrender.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  },

  // ===== BUILD =====
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "react-vendor";
            if (id.includes("firebase")) return "firebase";
            return "vendor";
          }
        }
      }
    }
  },

  // ===== OPTIMIZATION =====
  optimizeDeps: {
    include: ["react", "react-dom"]
  }
});