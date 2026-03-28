import React, { useState } from "react";

export default function Onboarding({ onComplete }) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!name) return;

    localStorage.setItem("user", JSON.stringify({ name }));
    onComplete();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: "#fff" }}>Welcome 👋</h2>
        <p style={{ color: "#94a3b8" }}>
          What should we call you?
        </p>

        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />

        <button style={styles.button} onClick={handleSubmit}>
          Continue
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
    background: "#020617"
  },
  card: {
    padding: 30,
    borderRadius: 16,
    background: "#0f172a",
    border: "1px solid #1e293b"
  },
  input: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#020617",
    color: "#fff"
  },
  button: {
    padding: "10px 16px",
    borderRadius: 8,
    background: "#6366f1",
    border: "none",
    color: "#fff",
    cursor: "pointer"
  }
};