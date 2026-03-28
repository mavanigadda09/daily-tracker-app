import React from "react";

export default function Landing({ onStart }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🚀 Personal Tracker</h1>
        <p style={styles.subtitle}>
          Track habits, activities, and build consistency like a pro.
        </p>

        <button style={styles.button} onClick={onStart}>
          Get Started
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #020617, #0f172a)"
  },
  card: {
    textAlign: "center",
    padding: 40,
    borderRadius: 20,
    background: "#0f172a",
    border: "1px solid #1e293b"
  },
  title: {
    fontSize: 36,
    marginBottom: 10,
    color: "#fff"
  },
  subtitle: {
    color: "#94a3b8",
    marginBottom: 20
  },
  button: {
    padding: "12px 20px",
    borderRadius: 10,
    border: "none",
    background: "#6366f1",
    color: "#fff",
    cursor: "pointer"
  }
};