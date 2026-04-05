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

    // 🔥 API PROXY (OPTIONAL)
    proxy: {
      "/api": {
        target: "https://daily-tracker-app-g96u.onrender.com",
        changeOrigin: true,
        secure: false
      }
    }
  },

  // ===== BUILD OPTIMIZATION =====
  build: {
    outDir: "dist",
    sourcemap: false,

    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        }
      }
    }
  }
});