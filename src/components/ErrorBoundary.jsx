import React from "react";

// These keys are passed in from outside — the boundary shouldn't
// hardcode application concerns. But we keep a default for backward compat.
const DEFAULT_STORAGE_KEYS = ["tracker_backup", "tracker_queue"];

/**
 * ErrorBoundary — last line of defense before a blank screen.
 *
 * Props:
 *   children       — subtree to protect
 *   fallback       — optional ReactNode or fn(error, reset) for custom UI
 *   onError        — optional fn(error, errorInfo) for Sentry / reporting
 *   storageKeys    — keys to clear on hard reset (default: tracker keys)
 *   resetOnNavigate — future: hook into router to auto-reset on nav
 */
export default class ErrorBoundary extends React.Component {
  static defaultProps = {
    storageKeys: DEFAULT_STORAGE_KEYS,
    onError: null,
    fallback: null,
  };

  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,   // Stores componentStack — the useful part
      showDetails: false,
      clearSucceeded: null, // null | true | false — tracks clear outcome
    };
  }

  static getDerivedStateFromError(error) {
    // Only sets hasError + error — errorInfo comes from componentDidCatch
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Store componentStack so the details panel can show it
    this.setState({ errorInfo });

    // Fire external reporter if provided — Sentry, LogRocket, etc.
    // Pattern: <ErrorBoundary onError={(e, info) => Sentry.captureException(e, { extra: info })}>
    try {
      this.props.onError?.(error, errorInfo);
    } catch {
      // Reporter itself must not crash the boundary
    }

    // Keep console output for dev — but only stack, not the full info object
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error);
      console.error(errorInfo?.componentStack);
    }
  }

  // ── Recovery actions ──────────────────────────────────────────────────────

  handleReload = () => {
    window.location.reload();
  };

  handleClearAndReload = () => {
    // Attempt to clear known corrupt state before reloading.
    // User has explicitly chosen to wipe data — confirmed by the button label.
    let succeeded = true;
    const { storageKeys } = this.props;

    try {
      storageKeys.forEach((key) => localStorage.removeItem(key));
    } catch {
      // localStorage unavailable (private mode, quota, etc.)
      succeeded = false;
    }

    if (succeeded) {
      window.location.reload();
    } else {
      // Can't clear — tell the user rather than silently reloading
      // into the same state
      this.setState({ clearSucceeded: false });
    }
  };

  // Soft reset: just clears the error state.
  // Useful when ErrorBoundary wraps a sub-tree (e.g. a Finance section)
  // and you want to retry without a full page reload.
  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      clearSucceeded: null,
    });
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  render() {
    const { hasError, error, errorInfo, showDetails, clearSucceeded } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) return children;

    // Custom fallback — supports both ReactNode and render-prop patterns
    // e.g. fallback={<MyCustomError />}
    // e.g. fallback={(error, retry) => <SectionError onRetry={retry} />}
    if (fallback) {
      return typeof fallback === "function"
        ? fallback(error, this.handleRetry)
        : fallback;
    }

    // ── Default fullscreen fallback ──────────────────────────────────────
    const errorMessage = error?.message || String(error) || "Unknown error";

    // Full stack: prefer error.stack, append componentStack for deep traces
    const debugInfo = [
      error?.stack || errorMessage,
      errorInfo?.componentStack
        ? `\nComponent stack:${errorInfo.componentStack}`
        : "",
    ]
      .filter(Boolean)
      .join("");

    return (
      <div style={s.container} role="alert" aria-live="assertive">

        <div style={s.icon} aria-hidden="true">⚠️</div>

        <h1 style={s.title}>Something went wrong</h1>

        <p style={s.text}>
          The app hit an unexpected error. Your cloud data is safe.
        </p>

        {/* Storage clear failure notice */}
        {clearSucceeded === false && (
          <p style={s.warning}>
            Could not clear local storage. Try clearing browser data manually.
          </p>
        )}

        {/* Primary recovery actions */}
        <div style={s.actions}>
          <button style={s.primaryBtn} onClick={this.handleReload}>
            Reload app
          </button>

          <button style={s.retryBtn} onClick={this.handleRetry}>
            Try again
          </button>
        </div>

        {/* Secondary — data-destructive action, visually separated */}
        <div style={s.secondaryActions}>
          <button style={s.dangerBtn} onClick={this.handleClearAndReload}>
            Clear local data and reload
          </button>
        </div>

        {/* Debug details — useful for users reporting bugs */}
        <button style={s.linkBtn} onClick={this.toggleDetails}>
          {showDetails ? "Hide details" : "Show error details"}
        </button>

        {showDetails && (
          <pre style={s.errorBox} aria-label="Error details">
            {debugInfo}
          </pre>
        )}

      </div>
    );
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────
// Uses CSS variables throughout — theme system works even in class components.
// Fallback values handle the rare case where CSS vars aren't loaded yet
// (e.g. boundary catches during initial render before theme injection).

const s = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    // CSS vars with explicit fallbacks — the only place fallbacks are justified
    background: "var(--color-background-primary, #ffffff)",
    color: "var(--color-text-primary, #111111)",
    padding: "20px",
    textAlign: "center",
    gap: "0px",
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 8,
    color: "var(--color-text-primary, #111111)",
  },
  text: {
    color: "var(--color-text-secondary, #555555)",
    marginBottom: 20,
    maxWidth: 360,
    lineHeight: 1.5,
  },
  warning: {
    color: "var(--color-text-warning, #b45309)",
    background: "var(--color-background-warning, #fffbeb)",
    border: "1px solid var(--color-border-warning, #fcd34d)",
    borderRadius: 6,
    padding: "8px 12px",
    marginBottom: 16,
    fontSize: 13,
    maxWidth: 360,
  },
  actions: {
    display: "flex",
    gap: 10,
    marginBottom: 10,
  },
  secondaryActions: {
    marginBottom: 16,
  },
  primaryBtn: {
    background: "var(--color-background-success, #16a34a)",
    color: "var(--color-text-success, #ffffff)",
    padding: "10px 18px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  retryBtn: {
    background: "var(--color-background-secondary, #f1f5f9)",
    color: "var(--color-text-primary, #111111)",
    padding: "10px 18px",
    border: "1px solid var(--color-border-secondary, #cbd5e1)",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  dangerBtn: {
    background: "transparent",
    color: "var(--color-text-danger, #dc2626)",
    padding: "6px 12px",
    border: "1px solid var(--color-border-danger, #fca5a5)",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
  },
  linkBtn: {
    background: "transparent",
    border: "none",
    color: "var(--color-text-info, #2563eb)",
    cursor: "pointer",
    fontSize: 13,
    marginBottom: 10,
    textDecoration: "underline",
  },
  errorBox: {
    background: "var(--color-background-secondary, #f8fafc)",
    border: "1px solid var(--color-border-danger, #fca5a5)",
    padding: 12,
    borderRadius: 8,
    maxWidth: 480,
    width: "100%",
    overflowX: "auto",
    fontSize: 11,
    color: "var(--color-text-danger, #dc2626)",
    textAlign: "left",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",  // Wraps long stack traces — avoids horizontal scroll on mobile
  },
};