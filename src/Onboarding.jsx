import { useState } from "react";

export default function Onboarding({ onComplete }) {

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [focus, setFocus] = useState("productivity");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    const user = {
      name: name.trim(),
      goal: goal.trim(),
      focus
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

        {/* TITLE */}
        <h1 style={styles.title}>👋 Welcome</h1>
        <p style={styles.subtitle}>
          Let’s personalize your experience
        </p>

        {/* NAME */}
        <input
          style={styles.input}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="Your name"
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

        {/* FOCUS */}
        <div style={styles.focusRow}>
          {["productivity", "fitness", "finance"].map((f) => (
            <button
              key={f}
              onClick={() => setFocus(f)}
              style={{
                ...styles.focusBtn,
                ...(focus === f ? styles.focusActive : {})
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ERROR */}
        {error && <p style={styles.error}>{error}</p>}

        {/* CTA */}
        <button style={styles.button} onClick={handleSubmit}>
          Continue →
        </button>

      </div>

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
    background: "var(--bg)",
    padding: 20
  },

  card: {
    width: "100%",
    maxWidth: 400,
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
    color: "var(--text-muted)",
    marginBottom: 10
  },

  input: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    outline: "none"
  },

  focusRow: {
    display: "flex",
    gap: 8,
    marginTop: 5
  },

  focusBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text)",
    cursor: "pointer"
  },

  focusActive: {
    background: "var(--accent)",
    color: "#fff"
  },

  button: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    background: "var(--accent)",
    border: "none",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
  },

  error: {
    color: "#ef4444",
    fontSize: 12
  }
};