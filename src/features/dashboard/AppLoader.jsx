/**
 * AppLoader.jsx
 * Centralised loading and error states for the app shell.
 * Keeping this out of App.jsx avoids polluting the orchestration layer
 * with presentational concerns.
 */
import React from "react";

const styles = {
  wrapper: {
    display        : "flex",
    alignItems     : "center",
    justifyContent : "center",
    height         : "100vh",
    color          : "var(--text-muted, #94a3b8)",
    fontSize       : "14px",
    gap            : "10px",
  },
  spinner: {
    width           : "18px",
    height          : "18px",
    border          : "2px solid var(--text-muted, #94a3b8)",
    borderTopColor  : "var(--accent, #6366f1)",
    borderRadius    : "50%",
    animation       : "spin 0.7s linear infinite",
  },
};

export function AppLoader({ message = "Loading…" }) {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.wrapper} role="status" aria-live="polite">
        <div style={styles.spinner} aria-hidden="true" />
        <span>{message}</span>
      </div>
    </>
  );
}
