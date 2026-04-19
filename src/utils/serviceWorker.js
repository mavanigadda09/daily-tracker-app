/**
 * utils/serviceWorker.js
 * ─────────────────────────────────────────────────────────────
 * Registers /sw.js and handles the full update lifecycle:
 *
 *   Register → onupdatefound → installing → installed
 *       ↓                                       ↓
 *   (first install)                     (update available)
 *   "Cached for offline"            → promptUserToRefresh()
 *                                       → postMessage SKIP_WAITING
 *                                       → window.location.reload()
 *
 * The user refresh prompt is a lightweight browser `confirm()` by
 * default. Replace `promptUserToRefresh` with your own toast/modal
 * if you want branded UX (see comment below).
 *
 * skipWaiting is triggered only with explicit user consent so we
 * never forcibly interrupt an active user session.
 */

// ─── Config ───────────────────────────────────────────────────

const SW_URL  = "/sw.js";

/** Dev-mode structured logger. Silent in production. */
const log = {
  info : (...a) => import.meta.env.DEV && console.info ("[SW]", ...a),
  warn : (...a) => import.meta.env.DEV && console.warn ("[SW]", ...a),
  error: (...a) =>                         console.error("[SW]", ...a), // always
};

// ─── Update prompt ────────────────────────────────────────────

/**
 * Ask the user if they want to reload for the new version.
 *
 * ── Customisation point ──────────────────────────────────────
 * Replace this with a toast / snackbar / modal for branded UX:
 *
 *   import { showUpdateBanner } from "../components/UpdateBanner";
 *   export function promptUserToRefresh(worker) {
 *     showUpdateBanner({ onAccept: () => skipAndReload(worker) });
 *   }
 * ─────────────────────────────────────────────────────────────
 *
 * @param {ServiceWorker} worker — the waiting service worker
 */
function promptUserToRefresh(worker) {
  const accepted = window.confirm(
    "A new version of Phoenix Tracker is available.\n\nRefresh now to get the latest update?"
  );
  if (accepted) {
    skipAndReload(worker);
  }
}

/**
 * Tell the waiting worker to skip its waiting phase, then reload
 * once the new worker takes control.
 *
 * @param {ServiceWorker} worker
 */
function skipAndReload(worker) {
  // Listen for the controller change BEFORE posting the message so
  // there is no race between the reload and the controllerchange event.
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  }, { once: true });

  worker.postMessage({ type: "SKIP_WAITING" });
}

// ─── Update detection ─────────────────────────────────────────

/**
 * Wire up the full update lifecycle on a registration.
 * @param {ServiceWorkerRegistration} registration
 */
function handleRegistrationUpdates(registration) {
  // Case 1: a worker was already waiting when we registered
  // (e.g. the user had the tab open during a previous deployment).
  if (registration.waiting) {
    log.info("Update ready (worker was already waiting).");
    promptUserToRefresh(registration.waiting);
    return;
  }

  // Case 2: a new worker is found and begins installing.
  registration.onupdatefound = () => {
    const installing = registration.installing;
    if (!installing) return;

    log.info("New service worker installing…");

    installing.onstatechange = () => {
      log.info(`Worker state → ${installing.state}`);

      if (installing.state !== "installed") return;

      if (navigator.serviceWorker.controller) {
        // An existing controller means this is an update, not first install.
        log.info("Update installed and waiting. Prompting user.");
        promptUserToRefresh(installing);
      } else {
        // No previous controller — this is the initial install.
        log.info("App cached for offline use.");
      }
    };
  };
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Register the service worker and set up the full update lifecycle.
 * Safe to call unconditionally — guards against unsupported browsers
 * and non-HTTPS environments automatically.
 *
 * Deferred to the "load" event so it never blocks the first paint.
 */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    log.info("Service workers not supported in this browser.");
    return;
  }

  // SW requires a secure context except on localhost.
  if (!window.isSecureContext) {
    log.warn("Service worker skipped: not a secure context (HTTPS required).");
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(SW_URL, {
        // "all" causes the SW to intercept every request from the app origin.
        // Change to "/" if you want to scope it to a sub-path.
        scope: "/",
      });

      log.info("Registered.", { scope: registration.scope });

      handleRegistrationUpdates(registration);

      // Periodically check for updates (every 60 minutes while the tab is open).
      // The browser also checks on navigation, but this catches long-lived sessions.
      setInterval(() => {
        registration.update().catch((err) => {
          log.warn("Periodic update check failed:", err);
        });
      }, 60 * 60 * 1000);

    } catch (error) {
      // Registration failure is non-fatal — log it but don't crash the app.
      log.error("Registration failed:", error);
    }
  });
}

/**
 * Unregister all service workers for this origin.
 * Useful for dev tooling or a "clear cache" feature.
 * @returns {Promise<void>}
 */
export async function unregisterServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
  log.info("All service workers unregistered.");
}
