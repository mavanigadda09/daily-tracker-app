/**
 * utils/serviceWorker.js
 * ─────────────────────────────────────────────────────────────
 * Registers /sw.js and handles the full update lifecycle:
 *
 *   Register → onupdatefound → installing → installed
 *       ↓                                       ↓
 *   (first install)                     (update available)
 *   dispatches "phoenix:sw-offline"  →  dispatches "phoenix:sw-update"
 *                                    →  Layout.jsx shows update banner
 *                                    →  user accepts → SKIP_WAITING
 *                                    →  window.location.reload()
 *
 * UI decoupling:
 *   This module never imports React components. It communicates via
 *   CustomEvents so any component can listen without creating a
 *   dependency chain back to the bootstrap layer.
 *
 *   To trigger reload from UI after user accepts:
 *     window.dispatchEvent(new CustomEvent("phoenix:sw-accept"));
 *   This file listens for that event and calls skipAndReload().
 */

// ─── Config ───────────────────────────────────────────────────

const SW_URL = "/sw.js";

/** Dev-mode structured logger. Silent in production. */
const log = {
  info : (...a) => import.meta.env.DEV && console.info ("[SW]", ...a),
  warn : (...a) => import.meta.env.DEV && console.warn ("[SW]", ...a),
  error: (...a) =>                         console.error("[SW]", ...a),
};

// ─── Skip + Reload ────────────────────────────────────────────

/**
 * Tell the waiting worker to skip its waiting phase, then reload
 * once the new worker takes control.
 *
 * Listener is registered BEFORE postMessage to avoid the race
 * between controllerchange firing and the reload call.
 *
 * @param {ServiceWorker} worker
 */
function skipAndReload(worker) {
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => window.location.reload(),
    { once: true }
  );
  worker.postMessage({ type: "SKIP_WAITING" });
}

// ─── Update notification ──────────────────────────────────────

/**
 * Notify the app that a new SW version is waiting.
 * Dispatches "phoenix:sw-update" with the waiting worker attached
 * so the UI can call skipAndReload when the user accepts.
 *
 * The UI should listen for "phoenix:sw-accept" to confirm, OR
 * call skipAndReload directly via the detail reference.
 *
 * Replaces window.confirm() — keeps this module UI-agnostic.
 *
 * @param {ServiceWorker} worker — the waiting service worker
 * @param {function}      [onUpdate] — optional callback from main.jsx
 */
function notifyUpdate(worker, onUpdate) {
  log.info("Update installed and waiting. Notifying app.");

  // Attach worker to event so the UI can trigger skipAndReload
  // without needing a direct import of this module.
  window.dispatchEvent(
    new CustomEvent("phoenix:sw-update", {
      detail: {
        accept: () => skipAndReload(worker),
      },
    })
  );

  // Also call the imperative callback if provided (used in main.jsx)
  onUpdate?.();
}

// ─── Update detection ─────────────────────────────────────────

/**
 * Wire up the full update lifecycle on a registration.
 *
 * @param {ServiceWorkerRegistration} registration
 * @param {function} [onUpdate]  — called when update is waiting
 * @param {function} [onOffline] — called on first install (offline-ready)
 */
function handleRegistrationUpdates(registration, onUpdate, onOffline) {
  // Case 1: worker already waiting when we registered.
  // Happens when user had the tab open during a previous deployment.
  if (registration.waiting) {
    log.info("Update ready (worker was already waiting).");
    notifyUpdate(registration.waiting, onUpdate);
    return;
  }

  // Case 2: new worker found and begins installing.
  registration.onupdatefound = () => {
    const installing = registration.installing;
    if (!installing) return;

    log.info("New service worker installing…");

    installing.onstatechange = () => {
      log.info(`Worker state → ${installing.state}`);
      if (installing.state !== "installed") return;

      if (navigator.serviceWorker.controller) {
        // Existing controller = this is an update, not first install
        notifyUpdate(installing, onUpdate);
      } else {
        // No previous controller = initial install, app is now offline-ready
        log.info("App cached for offline use.");
        window.dispatchEvent(new CustomEvent("phoenix:sw-offline"));
        onOffline?.();
      }
    };
  };
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Register the service worker and set up the full update lifecycle.
 * Safe to call unconditionally — guards against unsupported browsers
 * and non-HTTPS automatically.
 *
 * Deferred to the "load" event so it never blocks first paint.
 *
 * @param {object}   [options]
 * @param {function} [options.onUpdate]  — called when a new SW is waiting
 * @param {function} [options.onOffline] — called when app is offline-ready
 */
export function registerServiceWorker({ onUpdate, onOffline } = {}) {
  if (!("serviceWorker" in navigator)) {
    log.info("Service workers not supported in this browser.");
    return;
  }

  if (!window.isSecureContext) {
    log.warn("Service worker skipped: not a secure context (HTTPS required).");
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(SW_URL, {
        scope: "/",
      });

      log.info("Registered.", { scope: registration.scope });

      handleRegistrationUpdates(registration, onUpdate, onOffline);

      // Periodic update check — catches long-lived sessions.
      // Browser also checks on navigation automatically.
      setInterval(() => {
        registration.update().catch((err) => {
          log.warn("Periodic update check failed:", err);
        });
      }, 60 * 60 * 1000);

    } catch (error) {
      log.error("Registration failed:", error);
    }
  });
}

/**
 * Unregister all service workers for this origin.
 * Useful for dev tooling or a "clear cache" reset feature.
 * @returns {Promise<void>}
 */
export async function unregisterServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
  log.info("All service workers unregistered.");
}