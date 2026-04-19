/**
 * utils/theme.js
 * ─────────────────────────────────────────────────────────────
 * Theme system with three layers of resolution:
 *   1. User preference in localStorage  (explicit choice wins)
 *   2. OS/browser prefers-color-scheme  (respects system setting)
 *   3. Hard-coded default ("dark")      (last resort)
 *
 * Applied to <html> (not <body>) so CSS variables are available
 * to every element in the document, including <head> meta-theme-color.
 *
 * FOUC prevention:
 *   Call initTheme() from an inline <script> in index.html that runs
 *   synchronously before the browser paints. Copy the one-liner below.
 *
 * ── index.html inline script (copy-paste) ─────────────────────
 *   <script>
 *     (function(){
 *       var VALID = ['dark','light','system'];
 *       var saved = '';
 *       try { saved = localStorage.getItem('theme') || ''; } catch(e){}
 *       var t = VALID.includes(saved) ? saved : 'dark';
 *       if (t === 'system') {
 *         t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
 *       }
 *       document.documentElement.setAttribute('data-theme', t);
 *     })();
 *   </script>
 * ──────────────────────────────────────────────────────────────
 */

/** All themes the app supports. Add new values here to unlock them. */
export const VALID_THEMES = /** @type {const} */ (["dark", "light", "system"]);

/** @typedef {(typeof VALID_THEMES)[number]} Theme */

const STORAGE_KEY  = "theme";
const DEFAULT_THEME = /** @type {Theme} */ ("dark");
const ROOT         = document.documentElement;

// ─── Helpers ──────────────────────────────────────────────────

/** Safely read localStorage — returns null if storage is unavailable. */
function readStorage() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Safely write localStorage — silent no-op if storage is unavailable. */
function writeStorage(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private-browsing or quota exceeded — carry on */
  }
}

/** Resolve "system" to the actual OS preference. */
function resolveSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Resolve which concrete theme string to apply to the DOM.
 * "system" is expanded here; only "dark" | "light" (or custom)
 * strings ever reach data-theme.
 * @param {string | null} raw
 * @returns {string}
 */
function resolveTheme(raw) {
  if (!raw || !VALID_THEMES.includes(/** @type {Theme} */ (raw))) {
    return DEFAULT_THEME;
  }
  return raw === "system" ? resolveSystemTheme() : raw;
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Read the stored/system theme and apply it to <html data-theme="…">.
 * Call this as early as possible (inline script in index.html) to
 * prevent flash of incorrect theme.
 */
export function initTheme() {
  const resolved = resolveTheme(readStorage());
  ROOT.setAttribute("data-theme", resolved);
  return resolved;
}

/**
 * Programmatically change the active theme.
 * Persists the raw value (e.g. "system") but applies the resolved
 * concrete value to the DOM immediately.
 *
 * @param {Theme} theme
 */
export function setTheme(theme) {
  if (!VALID_THEMES.includes(theme)) {
    if (import.meta.env.DEV) {
      console.warn(`[theme] "${theme}" is not a valid theme. Valid: ${VALID_THEMES.join(", ")}`);
    }
    return;
  }

  writeStorage(theme);
  const resolved = resolveTheme(theme);
  ROOT.setAttribute("data-theme", resolved);
}

/**
 * Returns the currently active theme preference (may be "system"),
 * falling back to the default.
 * @returns {Theme}
 */
export function getTheme() {
  const raw = readStorage();
  if (raw && VALID_THEMES.includes(/** @type {Theme} */ (raw))) {
    return /** @type {Theme} */ (raw);
  }
  return DEFAULT_THEME;
}

/**
 * Subscribe to OS-level color scheme changes.
 * Automatically re-applies the theme when the user switches
 * system appearance and their preference is set to "system".
 *
 * Returns an unsubscribe function — call it in a useEffect cleanup.
 *
 * @returns {() => void}
 */
export function subscribeToSystemTheme() {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");

  const handler = () => {
    if (readStorage() === "system") {
      ROOT.setAttribute("data-theme", resolveSystemTheme());
    }
  };

  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
