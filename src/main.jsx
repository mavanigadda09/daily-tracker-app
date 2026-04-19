/**
 * main.jsx — Application bootstrap
 * ─────────────────────────────────────────────────────────────
 * Responsibilities (in execution order):
 *   1. Guard: verify #root exists
 *   2. Theme: validate + apply (true FOUC prevention is in index.html)
 *   3. Render: React 18 createRoot with StrictMode + ErrorBoundary
 *   4. Service worker: register, detect updates, surface refresh prompt
 *
 * Theme note:
 *   The inline <script> in index.html (see index.html) runs synchronously
 *   before first paint — that is the only reliable FOUC prevention.
 *   This file's theme call is a safety net for the rare case where
 *   index.html is served without that script (e.g. a different CDN edge).
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App         from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import { initTheme } from "./utils/theme.js";
import { registerServiceWorker } from "./utils/serviceWorker.js";

// ─── 1. Root guard ────────────────────────────────────────────
const rootElement = document.getElementById("root");
if (!rootElement) {
  // Throw synchronously — nothing can render without a mount point.
  throw new Error(
    "[Phoenix] #root element not found. Check your index.html."
  );
}

// ─── 2. Theme safety net ──────────────────────────────────────
// index.html already ran this before first paint. This call is a
// no-op if data-theme is already set, but prevents a bare page if
// the inline script was somehow stripped.
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

// ─── 4. Service worker ────────────────────────────────────────
// Deferred to after React has painted — SW registration is never
// on the critical path and should not block the first render.
registerServiceWorker();
