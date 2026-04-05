import React from "react";

const LOCAL_KEY = "tracker_backup";
const QUEUE_KEY = "tracker_queue";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("🔥 Error Boundary:", error, info);
  }

  // ✅ SAFE RESET
  handleReset = () => {
    try {
      localStorage.removeItem(LOCAL_KEY);
      localStorage.removeItem(QUEUE_KEY);
    } catch (err) {
      console.error("Reset failed:", err);
    }

    window.location.reload();
  };

  // ✅ RELOAD
  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((prev) => ({
      showDetails: !prev.showDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      // 🔒 fallback styles safety
      const s = styles || {};

      return (
        <div style={s.container || { padding: 20, textAlign: "center" }}>

          <h1 style={s.title || { fontSize: 24 }}>
            ⚠️ Something went wrong
          </h1>

          <p style={s.text || { marginBottom: 20 }}>
            Don't worry — your data is likely safe.
          </p>

          {/* ACTIONS */}
          <div style={s.actions || { marginBottom: 15 }}>
            <button
              style={s.primaryBtn || {}}
              onClick={this.handleReload}
            >
              🔄 Reload App
            </button>

            <button
              style={s.dangerBtn || {}}
              onClick={this.handleReset}
            >
              🧹 Reset App Data
            </button>
          </div>

          {/* ERROR DETAILS */}
          <button
            style={s.linkBtn || {}}
            onClick={this.toggleDetails}
          >
            {this.state.showDetails ? "Hide Details" : "Show Details"}
          </button>

          {this.state.showDetails && (
            <pre style={s.errorBox || { marginTop: 10 }}>
              {this.state.error?.message || String(this.state.error)}
            </pre>
          )}

        </div>
      );
    }

    return this.props.children;
  }
}

// ================= STYLES =================

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617",
    color: "#fff",
    padding: 20,
    textAlign: "center"
  },

  title: {
    fontSize: 28,
    marginBottom: 10
  },

  text: {
    color: "#94a3b8",
    marginBottom: 20
  },

  actions: {
    display: "flex",
    gap: 10,
    marginBottom: 15
  },

  primaryBtn: {
    background: "#22c55e",
    padding: "10px 16px",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },

  dangerBtn: {
    background: "#ef4444",
    padding: "10px 16px",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },

  linkBtn: {
    background: "transparent",
    border: "none",
    color: "#60a5fa",
    cursor: "pointer",
    marginBottom: 10
  },

  errorBox: {
    background: "#111827",
    padding: 10,
    borderRadius: 8,
    maxWidth: 400,
    overflowX: "auto",
    fontSize: 12,
    color: "#f87171"
  }
};