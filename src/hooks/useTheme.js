/**
 * useTheme.js
 * Persists theme to localStorage and syncs to data-theme attribute.
 * Extracted from App so it can be tested and reused independently.
 */
import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") ?? "dark"
  );

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return /** @type {[string, (t: string) => void]} */ ([theme, setTheme]);
}
