import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const REQUIRED_ENV_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const missing = REQUIRED_ENV_VARS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      "\n[Phoenix Tracker] Missing required environment variables:\n" +
      missing.map((k) => "  x " + k).join("\n") +
      "\n\nCopy .env.example to .env and fill in your Firebase credentials.\n"
    );
  }

  return {
    plugins: [react({ fastRefresh: true })],

    resolve: {
      alias: {
        "@":           resolve(__dirname, "src"),
        "@hooks":      resolve(__dirname, "src/hooks"),
        "@context":    resolve(__dirname, "src/context"),
        "@components": resolve(__dirname, "src/components"),
        "@pages":      resolve(__dirname, "src/pages"),
        "@utils":      resolve(__dirname, "src/utils"),
        "@assets":     resolve(__dirname, "src/assets"),
        "@styles":     resolve(__dirname, "src/styles"),
      },
    },

    build: {
      target: "es2020",
      outDir: "dist",
      sourcemap: mode !== "production",
      minify: "esbuild",
      chunkSizeWarningLimit: 400,

      rollupOptions: {
        output: {
          manualChunks(id) {
  if (id.includes("firebase/app"))       return "vendor-firebase-app";
  if (id.includes("firebase/auth"))      return "vendor-firebase-auth";
  if (id.includes("firebase/firestore")) return "vendor-firebase-db";
  if (id.includes("recharts") || id.includes("d3-"))
                                         return "vendor-charts";
  if (id.includes("framer-motion"))      return "vendor-motion";
  if (id.includes("react-dom"))          return "vendor-react";
  if (id.includes("node_modules/react")) return "vendor-react";
},
          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
        },
      },
    },

    server: {
      port: 5173,
      strictPort: true,
      open: false,
      cors: true,
    },

    preview: {
      port: 4173,
      strictPort: true,
    },

    css: {
      devSourcemap: true,
    },

    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "firebase/app",
        "firebase/auth",
        "firebase/firestore",
      ],
      esbuildOptions: {
        target: "es2020",
      },
    },
  };
});