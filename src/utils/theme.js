/**
 * theme.js
 * ─────────────────────────────────────────────────────────────
 * JS-side design tokens — ONLY for contexts where CSS variables
 * are not accessible (Recharts, Canvas, inline SVG, etc.).
 *
 * ⚠️  Do NOT use this for regular component styles.
 *     Use CSS variables (var(--*)) directly in inline styles
 *     or className-based styles instead.
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
 * FIX: Added gold/orange to match Phoenix design tokens used in Analytics.jsx
 */
export const CHART_COLORS = {
  gold:   "#facc15",   // --accent
  orange: "#f97316",   // --accent-orange
  green:  "#22c55e",
  blue:   "#3b82f6",
  amber:  "#f59e0b",
  purple: "#a855f7",
  red:    "#ef4444",
  cyan:   "#06b6d4",
};

/**
 * Chart grid/axis colors — intentionally subtle.
 */
export const CHART_GRID = {
  dark:  "rgba(255,255,255,0.08)",
  light: "rgba(0,0,0,0.08)",
};

/**
 * Status colors — for JS logic only. For CSS, use var(--success) etc.
 */
export const STATUS_COLORS = {
  success: "#22c55e",
  warning: "#f59e0b",
  danger:  "#ef4444",
  info:    "#3b82f6",
};

/**
 * Recharts-specific config presets.
 */
export const CHART_DEFAULTS = {
  margin: { top: 10, right: 10, left: -10, bottom: 0 },
  animationDuration: 400,
};

/**
 * Pre-paint theme init — call in main.jsx BEFORE React renders.
 *
 * FIX: Was setting data-theme on document.documentElement (<html>),
 * but index.css uses body[data-theme="light"] selectors.
 * Now correctly targets document.body to match.
 */
export function initTheme() {
  const theme = localStorage.getItem("theme") ?? "dark";
  document.body.setAttribute("data-theme", theme);
}
