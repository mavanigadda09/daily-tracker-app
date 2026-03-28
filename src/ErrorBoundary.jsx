import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Error Boundary Caught:", error, info);
  }

  handleReset = () => {
    localStorage.clear(); // 🔥 auto-fix corrupted data
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <h1 style={styles.title}>⚠️ Something went wrong</h1>

          <p style={styles.text}>
            Your data might be corrupted. We can fix it.
          </p>

          <button style={styles.button} onClick={this.handleReset}>
            Reset & Fix
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617",
    color: "#fff"
  },

  title: {
    fontSize: 28,
    marginBottom: 10
  },

  text: {
    color: "#94a3b8",
    marginBottom: 20
  },

  button: {
    background: "#ef4444",
    padding: "10px 20px",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  }
};