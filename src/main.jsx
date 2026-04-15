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
console.warn("Theme load failed");
}

/* ================= RENDER ================= */
createRoot(rootElement).render( <StrictMode> <ErrorBoundary> <App /> </ErrorBoundary> </StrictMode>
);

/* ================= SERVICE WORKER ================= */
if ("serviceWorker" in navigator) {
window.addEventListener("load", () => {
navigator.serviceWorker
.register("/sw.js")
.then((registration) => {
console.log("✅ Service Worker registered:", registration);
})
.catch((error) => {
console.log("❌ Service Worker registration failed:", error);
});
});
}
