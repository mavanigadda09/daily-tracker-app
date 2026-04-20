/**
 * useTheme.js
 * Persists theme to localStorage and syncs to data-theme on <body>.
 *
 * FIX: theme.js initTheme() was setting data-theme on document.documentElement
 * (<html>), while this hook sets it on document.body. Your CSS selectors are
 * body[data-theme="light"] — so document.body is the correct target.
 * initTheme() in theme.js has been updated to match.
 */
import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") ?? "dark"
  );

  useEffect(() => {
    // Always target body — matches body[data-theme="light"] in index.css
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return /** @type {[string, () => void, (t: string) => void]} */ (
    [theme, toggleTheme, setTheme]
  );
}
