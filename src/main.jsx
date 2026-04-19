/**
 * main.jsx — Application bootstrap
 * ─────────────────────────────────────────────────────────────
 * Execution order:
 *   1. Guard    — verify #root exists before anything else
 *   2. Theme    — safety net if index.html inline script was stripped
 *   3. Render   — React 18 StrictMode + ErrorBoundary
 *   4. SW       — deferred post-paint, never blocks first render
 *
 * FOUC prevention:
 *   The inline <script> in index.html runs synchronously before first
 *   paint. This file's initTheme() call is a fallback only — it runs
 *   after the bundle parses, which is too late to prevent FOUC on its
 *   own. index.html is the real guard.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App             from "./App.jsx";
import ErrorBoundary   from "./components/ErrorBoundary.jsx";
import { initTheme }   from "./utils/theme.js";
import { registerServiceWorker } from "./utils/serviceWorker.js";

// ─── 1. Root guard ────────────────────────────────────────────
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error(
    "[Phoenix] Fatal: #root element missing. Verify index.html is intact."
  );
}

// ─── 2. Theme safety net ──────────────────────────────────────
// hasAttribute check means this is a true no-op when index.html
// already set data-theme before first paint.
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

// ─── 4. Service worker — deferred post-paint ─────────────────
// requestIdleCallback fires after the browser has painted and is
// idle — ideal for non-critical work like SW registration.
// setTimeout(0) is the fallback for Safari, which lacks rIC.
//
// onUpdate is called when a new SW version is waiting. The app
// surfaces a refresh prompt via the NotificationContext toast
// (handled inside registerServiceWorker via this callback).
const swInit = () =>
  registerServiceWorker({
    onUpdate: () => {
      // New version detected — SW is waiting to activate.
      // Dispatch a custom event so any subscribed UI component
      // (e.g. an update banner in Layout.jsx) can react without
      // requiring a direct reference here.
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