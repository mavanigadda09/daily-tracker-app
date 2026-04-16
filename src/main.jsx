import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary";

/* ================= ROOT ================= */
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

/* ================= THEME INIT ================= */
// Apply theme BEFORE React loads (prevents flicker)
try {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.body.setAttribute("data-theme", savedTheme);
} catch (e) {
  console.warn("⚠️ Theme load failed:", e);
}

/* ================= RENDER ================= */
createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

/* ================= SERVICE WORKER ================= */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      console.log("✅ Service Worker registered:", registration);

      // 🔥 AUTO UPDATE SERVICE WORKER
      if (registration.waiting) {
        console.log("🔄 New version available");
      }

      registration.onupdatefound = () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.onstatechange = () => {
            if (newWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                console.log("🚀 New content available, refresh to update");
              } else {
                console.log("📦 Content cached for offline use");
              }
            }
          };
        }
      };

    } catch (error) {
      console.log("❌ Service Worker registration failed:", error);
    }
  });
}