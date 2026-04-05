import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

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
            // Split vendor chunks smarter
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