/**
 * utils/serviceWorker.js
 * ─────────────────────────────────────────────────────────────
 * CAPACITOR FIX:
 *   Capacitor serves from http://localhost with no HTTP server.
 *   If SW tries to cache "/" during install → ERR_CONNECTION_REFUSED
 *   → SW install fails → WebView shows the error page.
 *   Solution: detect Capacitor and skip registration entirely.
 */

const SW_URL = "/sw.js";

const log = {
  info : (...a) => import.meta.env.DEV && console.info ("[SW]", ...a),
  warn : (...a) => import.meta.env.DEV && console.warn ("[SW]", ...a),
  error: (...a) =>                         console.error("[SW]", ...a),
};

// ─── Capacitor detection ──────────────────────────────────────
function isCapacitor() {
  return !!(
    window.Capacitor ||
    window.webkit?.messageHandlers?.capacitor ||
    navigator.userAgent.includes("Capacitor")
  );
}

// ─── Internal helpers ─────────────────────────────────────────
function skipAndReload(worker) {
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => window.location.reload(),
    { once: true }
  );
  worker.postMessage({ type: "SKIP_WAITING" });
}

function notifyUpdate(worker, onUpdate) {
  log.info("Update installed and waiting. Notifying app.");
  window.dispatchEvent(
    new CustomEvent("phoenix:sw-update", {
      detail: { accept: () => skipAndReload(worker) },
    })
  );
  onUpdate?.();
}

function handleRegistrationUpdates(registration, onUpdate, onOffline) {
  if (registration.waiting) {
    log.info("Update ready (worker was already waiting).");
    notifyUpdate(registration.waiting, onUpdate);
    return;
  }

  registration.onupdatefound = () => {
    const installing = registration.installing;
    if (!installing) return;
    log.info("New service worker installing…");

    installing.onstatechange = () => {
      log.info(`Worker state → ${installing.state}`);
      if (installing.state !== "installed") return;

      if (navigator.serviceWorker.controller) {
        notifyUpdate(installing, onUpdate);
      } else {
        log.info("App cached for offline use.");
        window.dispatchEvent(new CustomEvent("phoenix:sw-offline"));
        onOffline?.();
      }
    };
  };
}

// ─── Public API ───────────────────────────────────────────────
export function registerServiceWorker({ onUpdate, onOffline } = {}) {
  // ✅ PRIMARY GUARD — skip everything in Capacitor WebView
  if (isCapacitor()) {
    log.info("Skipped: running inside Capacitor WebView.");
    return;
  }

  if (!("serviceWorker" in navigator)) {
    log.info("Service workers not supported.");
    return;
  }

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (!window.isSecureContext && !isLocalhost) {
    log.warn("Skipped: not a secure context.");
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(SW_URL, {
        scope: "/",
      });
      log.info("Registered.", { scope: registration.scope });
      handleRegistrationUpdates(registration, onUpdate, onOffline);

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

export async function unregisterServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
  log.info("All service workers unregistered.");
}