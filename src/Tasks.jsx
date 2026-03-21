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

      {/* Add Task */}
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

      {/* Tasks List */}
      <div style={styles.grid}>
        {tasks.map((t) => (
          <div key={t.id} style={styles.card}>
            <h3>{t.name}</h3>

            <p>
              {t.running ? "🟢 Running..." : "⚪ Not running"}
            </p>

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

            {t.duration > 0 && (
              <p style={styles.duration}>
                ⏳ {Math.floor(t.duration)} sec
              </p>
            )}

            {/* Controls */}
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

const styles = {
  title: {
    marginBottom: 20
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20
  },

  card: {
    background: "#0f172a",
    padding: 20,
    borderRadius: 16
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
    color: "#fff"
  },

  start: {
    background: "#22c55e",
    border: "none",
    padding: 10,
    borderRadius: 8,
    color: "#fff",
    marginTop: 10
  },

  stop: {
    background: "#ef4444",
    border: "none",
    padding: 10,
    borderRadius: 8,
    color: "#fff",
    marginTop: 10
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