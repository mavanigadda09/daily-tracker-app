import { useState } from "react";

export default function Onboarding({ onComplete }) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;

    const user = {
      name: name.trim(),
      goal: goal.trim()
    };

    localStorage.setItem("user", JSON.stringify(user));
    onComplete(user);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div style={styles.container}>

      <div style={styles.card}>

        <h1 style={styles.title}>Welcome 👋</h1>
        <p style={styles.subtitle}>
          Let’s set up your profile
        </p>

        {/* NAME */}
        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          onKeyDown={handleKeyDown}
        />

        {/* GOAL */}
        <input
          style={styles.input}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Your goal (e.g. Study 2h daily)"
          onKeyDown={handleKeyDown}
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
    background: "var(--bg)"
  },

  card: {
    width: 360,
    padding: 30,
    borderRadius: 16,
    background: "var(--card)",
    border: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: 12
  },

  title: {
    fontSize: 26
  },

  subtitle: {
    color: "var(--text-muted)"
  },

  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "#020617",
    color: "#fff",
    outline: "none"
  },

  button: {
    marginTop: 5,
    padding: 12,
    borderRadius: 8,
    background: "var(--accent)",
    border: "none",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
  }
};