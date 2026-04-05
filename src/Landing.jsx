import React from "react";

export default function Landing({ onStart }) {
  return (
    <div style={styles.container}>

      <div style={styles.card}>

        {/* TITLE */}
        <h1 style={styles.title}>
          🚀 Your Personal Life OS
        </h1>

        <p style={styles.subtitle}>
          Track habits, manage tasks, analyze performance,
          and get AI-powered insights — all in one place.
        </p>

        {/* FEATURES */}
        <div style={styles.features}>
          <Feature icon="🤖" text="AI Coach & Smart Suggestions" />
          <Feature icon="📊" text="Insights & Analytics" />
          <Feature icon="🔥" text="Habit & Streak Tracking" />
          <Feature icon="💰" text="Finance Tracking" />
        </div>

        {/* CTA */}
        <button style={styles.button} onClick={onStart}>
          Get Started →
        </button>

      </div>

    </div>
  );
}

// ================= FEATURE =================
function Feature({ icon, text }) {
  return (
    <div style={styles.feature}>
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #020617, #0f172a)",
    padding: 20
  },

  card: {
    textAlign: "center",
    padding: 40,
    borderRadius: 20,
    background: "#0f172a",
    border: "1px solid #1e293b",
    maxWidth: 500,
    width: "100%"
  },

  title: {
    fontSize: 36,
    marginBottom: 10,
    color: "#fff"
  },

  subtitle: {
    color: "#94a3b8",
    marginBottom: 25,
    lineHeight: 1.5
  },

  features: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 30
  },

  feature: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
    color: "#cbd5f5"
  },

  button: {
    padding: "12px 20px",
    borderRadius: 10,
    border: "none",
    background: "#6366f1",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 16
  }
};