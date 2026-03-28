import { useState } from "react";

export default function Tasks({
  tasks,
  addTask,
  startTask,
  endTask
}) {
  const [name, setName] = useState("");

  return (
    <div>
      <h1 style={styles.title}>⏱ Task Tracker</h1>

      {/* ================= ADD TASK ================= */}
      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="Task name (e.g. Medicine)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          style={styles.btn}
          onClick={() => {
            addTask(name);
            setName("");
          }}
        >
          Add Task
        </button>
      </div>

      {/* ================= TASK LIST ================= */}
      <div style={styles.grid}>
        {tasks.length === 0 && (
          <p style={{ color: "#94a3b8" }}>No tasks added</p>
        )}

        {tasks.map((t) => (
          <div key={t.id} style={styles.cardHover}>
            <h3 style={styles.taskName}>{t.name}</h3>

            {/* STATUS */}
            <p style={t.running ? styles.running : styles.stopped}>
              {t.running ? "🟢 Running" : "⚪ Not running"}
            </p>

            {/* TIME */}
            {t.start && (
              <p style={styles.time}>
                Start: {new Date(t.start).toLocaleTimeString()}
              </p>
            )}

            {t.end && (
              <p style={styles.time}>
                End: {new Date(t.end).toLocaleTimeString()}
              </p>
            )}

            {/* DURATION */}
            {t.duration > 0 && (
              <p style={styles.duration}>
                ⏳ {Math.floor(t.duration)} sec
              </p>
            )}

            {/* CONTROLS */}
            {!t.running ? (
              <button
                style={styles.start}
                onClick={() => startTask(t.id)}
              >
                ▶ Start
              </button>
            ) : (
              <button
                style={styles.stop}
                onClick={() => endTask(t.id)}
              >
                ⏹ End
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ================= STYLES =================
const styles = {
  title: {
    fontSize: 28,
    fontWeight: 600,
    marginBottom: 20,
    color: "#e2e8f0"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20
  },

  card: {
    background: "#0f172a",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    border: "1px solid rgba(148,163,184,0.1)"
  },

  cardHover: {
    background: "#0f172a",
    padding: 20,
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.1)",
    transition: "0.3s",
    cursor: "pointer"
  },

  taskName: {
    color: "#e2e8f0"
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#020617",
    color: "#fff",
    marginRight: 10
  },

  btn: {
    background: "#6366f1",
    border: "none",
    padding: 10,
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },

  start: {
    background: "#22c55e",
    border: "none",
    padding: 10,
    borderRadius: 8,
    color: "#fff",
    marginTop: 10,
    cursor: "pointer"
  },

  stop: {
    background: "#ef4444",
    border: "none",
    padding: 10,
    borderRadius: 8,
    color: "#fff",
    marginTop: 10,
    cursor: "pointer"
  },

  running: {
    color: "#22c55e"
  },

  stopped: {
    color: "#94a3b8"
  },

  time: {
    fontSize: 12,
    color: "#94a3b8"
  },

  duration: {
    marginTop: 5,
    color: "#facc15"
  }
};