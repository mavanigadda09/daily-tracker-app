/**
 * theme.js
 * ─────────────────────────────────────────────────────────────
 * JS-side design tokens — ONLY for contexts where CSS variables
 * are not accessible (Recharts, Canvas, inline SVG, etc.).
 *
 * ⚠️  Do NOT use this for regular component styles.
 *     Use CSS variables (var(--*)) directly in inline styles
 *     or className-based styles instead.
 *
 * These values must be kept in sync with index.css manually.
 * If that drift becomes a problem, replace with a CSS-var reader:
 *   getComputedStyle(document.documentElement).getPropertyValue('--accent')
 */

/**
 * Reads a CSS variable at runtime — always reflects the active theme.
 * Use this instead of hardcoded values wherever possible.
 *
 * @param {string} variable — e.g. "--accent"
 * @returns {string}
 */
export function cssVar(variable) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
}

/**
 * Static chart palette — used by Recharts which cannot read CSS vars.
 * Distinct colors, ordered by visual weight.
 * Keep in sync with --chart-* in index.css.
 */
export const CHART_COLORS = {
  green:  "#22c55e",
  blue:   "#3b82f6",
  amber:  "#f59e0b",
  purple: "#a855f7",
  red:    "#ef4444",
  cyan:   "#06b6d4",
};

/**
 * Chart grid/axis colors — separate from data colors.
 * These are intentionally subtle.
 */
export const CHART_GRID = {
  dark:  "rgba(255,255,255,0.08)",
  light: "rgba(0,0,0,0.08)",
};

/**
 * Status colors — for use in JS logic (e.g. computing a dot color
 * based on a status string). For CSS, use var(--success) etc.
 */
export const STATUS_COLORS = {
  success: "#22c55e",
  warning: "#f59e0b",
  danger:  "#ef4444",
  info:    "#3b82f6",
};

/**
 * Recharts-specific config presets.
 * Centralizes repetitive chart props.
 */
export const CHART_DEFAULTS = {
  margin: { top: 10, right: 10, left: -10, bottom: 0 },
  animationDuration: 400,
};
// ─── Pre-paint theme init ─────────────────────────────────────
// Called in main.jsx before React renders to avoid theme flash.
export function initTheme() {
  const theme = localStorage.getItem("theme") ?? "dark";
  document.documentElement.setAttribute("data-theme", theme);
}
