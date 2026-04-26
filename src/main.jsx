/**
 * main.jsx – Application bootstrap
 * ─────────────────────────────────────────────────────────────
 * Execution order:
 *   1. Guard    – verify #root exists before anything else
 *   2. Theme    – safety net if index.html inline script was stripped
 *   3. Render   – React 18 StrictMode + ErrorBoundary
 *   4. SW       – deferred post-paint, never blocks first render
 *                 SKIPPED entirely inside Capacitor WebView
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App           from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { initTheme } from "./utils/theme.js";
import { registerServiceWorker } from "./utils/serviceWorker.js";

// ─── 1. Root guard ────────────────────────────────────────────
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error(
    "[Phoenix] Fatal: #root element missing. Verify index.html is intact."
  );
}

// ─── 2. Theme safety net ──────────────────────────────────────
if (!document.documentElement.hasAttribute("data-theme")) {
  initTheme();
}

// ─── 3. Render ────────────────────────────────────────────────
createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// ─── 4. Service worker – deferred, Capacitor-safe ─────────────
// NEVER runs inside Capacitor WebView.
// registerServiceWorker() checks window.Capacitor and returns
// immediately if detected — so this block is safe to keep here.
//
// On web: fires after paint via requestIdleCallback / setTimeout
// so it never blocks first render.
const swInit = () =>
  registerServiceWorker({
    onUpdate: () => {
      window.dispatchEvent(new CustomEvent("phoenix:sw-update"));
    },
    onOffline: () => {
      window.dispatchEvent(new CustomEvent("phoenix:sw-offline"));
    },
  });

if ("requestIdleCallback" in window) {
  requestIdleCallback(swInit);
} else {
  setTimeout(swInit, 0);
}